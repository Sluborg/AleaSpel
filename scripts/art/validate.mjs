// Validates public/assets/manifest.json and every wardrobe PNG against docs/asset-spec.md.
// Run: npm run validate:art   (CI runs it before the build; exits 1 on any error)
import { existsSync, readFileSync } from 'node:fs';
import { readPng, alphaOf, alphaReport, bbox, components, distanceTo, CANVAS } from './lib.mjs';

const ROOT = 'public/assets';
const manifest = JSON.parse(readFileSync(`${ROOT}/manifest.json`, 'utf-8'));
const wardrobe = JSON.parse(readFileSync('src/data/wardrobe.json', 'utf-8'));
const anchors = JSON.parse(readFileSync(`${ROOT}/base/anchors.json`, 'utf-8'));

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);

const layers = new Map(wardrobe.layers.map((l) => [l.id, l]));
const categories = new Map(wardrobe.categories.map((c) => [c.id, c]));
const WEARABLE = new Set(wardrobe.categories.filter((c) => c.id !== 'base').map((c) => c.id));
const ID_RE = /^[a-z0-9]+(_[a-z0-9]+)*$/;

const refs = {
  ...anchors.points,
  bbox: {
    left: anchors.bbox.x,
    right: anchors.bbox.x + anchors.bbox.w - 1,
    top: anchors.bbox.y,
    bottom: anchors.bbox.y + anchors.bbox.h - 1,
  },
};
function resolve(expr) {
  if (typeof expr === 'number') return expr;
  const m = /^([A-Za-z]+)\.([a-z]+)([+-]\d+)?$/.exec(expr);
  if (!m || refs[m[1]]?.[m[2]] === undefined) throw new Error(`bad region expression "${expr}"`);
  return refs[m[1]][m[2]] + Number(m[3] ?? 0);
}

// Body mask and distance outside it, computed once.
const master = readPng(`${ROOT}/base/master.png`);
const bodyMask = alphaOf(master).map((a) => (a >= 128 ? 1 : 0));
const outsideDist = distanceTo(bodyMask, master.width, master.height);

// Master: must be the untouched source master and clean.
const src = readFileSync('assets/source/base/master.png');
if (!src.equals(readFileSync(`${ROOT}/base/master.png`))) {
  err('base_body', 'public/assets/base/master.png differs from assets/source/base/master.png');
}
const mr = alphaReport(master);
if (mr.haloPixels > 0 || mr.components !== 1 || mr.borderPixels > 0) {
  err('base_body', `master alpha not clean ${JSON.stringify(mr)}`);
}

const seen = new Set();
for (const entry of manifest.assets) {
  const id = entry.id ?? '(missing id)';
  for (const field of ['id', 'category', 'layer', 'file', 'license', 'source']) {
    if (!entry[field] || typeof entry[field] !== 'string') err(id, `missing field "${field}"`);
  }
  if (typeof entry.tintable !== 'boolean') err(id, 'missing boolean "tintable"');
  if (seen.has(id)) err(id, 'duplicate id');
  seen.add(id);
  if (!ID_RE.test(id)) err(id, 'id must be snake_case (a-z, 0-9, _)');
  if (!existsSync(`${ROOT}/${entry.file}`)) {
    err(id, `file not found: ${entry.file}`);
    continue;
  }
  if (!categories.has(entry.category)) continue; // not a wardrobe asset, other rules later
  const category = categories.get(entry.category);
  if (entry.layer !== category.layer)
    err(id, `layer must be "${category.layer}" for category ${entry.category}`);
  if (!WEARABLE.has(entry.category)) continue;

  const expectedFile = `wardrobe/${entry.category}/${id}${entry.tintable ? '_tint' : ''}.png`;
  if (entry.file !== expectedFile) err(id, `file must be ${expectedFile}`);
  if (entry.detail && entry.detail !== `wardrobe/${entry.category}/${id}_detail.png`) {
    err(id, `detail must be wardrobe/${entry.category}/${id}_detail.png`);
  }
  for (const file of [entry.file, entry.detail].filter(Boolean)) checkImage(id, entry, file);
}

function checkImage(id, entry, file) {
  const img = readPng(`${ROOT}/${file}`);
  const tag = `${id} (${file})`;
  if (img.width !== CANVAS.width || img.height !== CANVAS.height) {
    err(tag, `canvas must be ${CANVAS.width}x${CANVAS.height}, is ${img.width}x${img.height}`);
    return;
  }
  const report = alphaReport(img);
  if (!report.hasAlphaChannel) err(tag, 'PNG has no alpha channel');
  if (report.transparentShare > 0.999) err(tag, 'image is empty');
  if (report.transparentShare < 0.3) err(tag, 'less than 30% transparent, background not removed?');
  if (report.borderPixels > 0)
    err(tag, `${report.borderPixels} visible pixels on the canvas border`);

  const a = alphaOf(img);
  const visible = a.map((v) => (v > 0 ? 1 : 0));
  const { sizes } = components(visible, img.width, img.height);
  const specks = sizes.slice(1).filter((s) => s < 16).length;
  if (specks) err(tag, `${specks} stray specks (<16 px islands)`);
  if (
    report.haloPixels /
      Math.max(
        1,
        visible.reduce((s, v) => s + v, 0),
      ) >
    0.02
  ) {
    warn(
      tag,
      `soft halo: ${report.haloPixels} semi-transparent px more than 3 px from solid pixels`,
    );
  }

  const layer = layers.get(entry.layer);
  const region = {
    top: resolve(layer.region.top),
    bottom: resolve(layer.region.bottom),
    left: resolve(layer.region.left),
    right: resolve(layer.region.right),
  };
  const b = bbox(visible, img.width, img.height);
  if (
    b &&
    (b.y < region.top ||
      b.y + b.h - 1 > region.bottom ||
      b.x < region.left ||
      b.x + b.w - 1 > region.right)
  ) {
    err(
      tag,
      `pixels outside the ${entry.layer} region (item bbox x ${b.x}-${b.x + b.w - 1}, y ${b.y}-${b.y + b.h - 1}; allowed x ${region.left}-${region.right}, y ${region.top}-${region.bottom})`,
    );
  }
  let far = 0;
  for (let i = 0; i < a.length; i++) if (a[i] > 0 && outsideDist[i] > layer.maxOutsideMask) far++;
  if (far > 0)
    err(tag, `${far} px more than ${layer.maxOutsideMask} px outside the body silhouette`);

  if (entry.tintable && file === entry.file) {
    let sat = 0;
    let lum = 0;
    let n = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] < 128) continue;
      const r = img.data[i * 4];
      const g = img.data[i * 4 + 1];
      const bl = img.data[i * 4 + 2];
      sat += Math.max(r, g, bl) - Math.min(r, g, bl);
      lum += 0.299 * r + 0.587 * g + 0.114 * bl;
      n++;
    }
    if (n && sat / n > 25) err(tag, 'tintable art must be grayscale (average saturation too high)');
    if (n && lum / n < 150)
      warn(tag, 'tintable art is dark; tint colours will look muddy (aim for light grey)');
  }
}

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(
  `validate:art ${manifest.assets.length} assets, ${errors.length} errors, ${warnings.length} warnings`,
);
process.exit(errors.length ? 1 : 0);
