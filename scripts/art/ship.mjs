// Ships a reviewed batch folder (<dir>/<id>.png, raw ChatGPT images) into the game: picks the
// extractor by id prefix, copies the raw file to assets/source/, writes the game PNG(s) and adds or
// replaces the manifest rows. Run validate:art afterwards.
//
// Usage: node scripts/art/ship.mjs <dir> <batch>      e.g. node scripts/art/ship.mjs /tmp/B12 B12
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [dir, batch] = process.argv.slice(2);
if (!dir || !batch) throw new Error('usage: ship.mjs <dir> <batch>');
const run = (script, args) =>
  console.log(
    execFileSync('node', [`scripts/art/${script}`, ...args], { encoding: 'utf-8' }).trim(),
  );

// Garment category by id prefix (clothes on the master, pink key, tintable).
const GARMENT = {
  tshirt: 'tops',
  top: 'tops',
  shorts: 'bottoms',
  skirt: 'bottoms',
  leggings: 'bottoms',
  dress: 'onepiece',
  leotard: 'onepiece',
  jacket: 'outerwear',
  hoodie: 'outerwear',
  slippers: 'shoes',
  shoes: 'shoes',
  socks: 'socks',
  bow: 'acc_head',
  headband: 'acc_head',
  glasses: 'acc_face',
  medal: 'acc_neck',
  necklace: 'acc_neck',
  wristbands: 'acc_wrist',
  bag: 'acc_bag',
};
const MAKEUP = { shadow: 'eyeshadow', blush: 'blush', lips: 'lips', paint: 'facepaint' };
const OBJECT = {
  furn: ['furniture', 'room', 512, 512],
  equip: ['equipment', 'room', 512, 512],
  ext: ['exterior', 'house', 512, 512],
  garden: ['exterior', 'house', 512, 512],
  food: ['food', 'icon', 256, 256],
  toy: ['toys', 'icon', 256, 256],
  pet: ['petstuff', 'icon', 256, 256],
  icon: ['icons', 'ui', 128, 128],
  trophy: ['trophies', 'icon', 256, 256],
};
const SIZE = { equip_mat: [512, 256], toy_plank: [512, 128] };
const PETS = ['cat', 'dog', 'rabbit', 'guinea', 'hamster', 'pony'];

const manifestPath = 'public/assets/manifest.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const rows = [];
const date = new Date().toISOString().slice(0, 10);
const license = 'Project-owned, AI-generated for AleaSpel';

for (const file of readdirSync(dir)
  .filter((f) => f.endsWith('.png'))
  .sort()) {
  const id = file.replace(/\.png$/, '');
  const src = `${dir}/${file}`;
  const prefix = id.split('_')[0];
  const raw = (sub) => {
    mkdirSync(`assets/source/${sub}`, { recursive: true });
    const p = `assets/source/${sub}/${id}-raw.png`;
    copyFileSync(src, p);
    return p;
  };
  const source = (p, tool) =>
    `ChatGPT image generation ${date}, batch ${batch} (${p}), extracted by scripts/art/${tool}`;
  const row = (category, layer, f, tintable, s) =>
    rows.push({ id, category, layer, file: f, tintable, license, source: s });

  if (prefix === 'pet' && PETS.includes(id.split('_')[1]) && id.split('_').length === 2) {
    const p = raw('pets');
    const keyed = `${dir}/.${id}-keyed.png`;
    run('extract-object.mjs', ['--src', p, '--out', keyed, '--size', '1024']);
    run('split-pet.mjs', [
      '--src',
      keyed,
      '--species',
      id.split('_')[1],
      '--dir',
      'public/assets/pets',
    ]);
    const s = source(p, 'extract-object.mjs and split-pet.mjs');
    rows.push({
      id: `${id}_fur`,
      category: 'pets',
      layer: 'fur',
      file: `pets/${id}_fur.png`,
      tintable: true,
      license,
      source: s,
    });
    rows.push({
      id: `${id}_face`,
      category: 'pets',
      layer: 'face',
      file: `pets/${id}_face.png`,
      tintable: false,
      license,
      source: s,
    });
  } else if (['eyes', 'brows', 'mouth'].includes(prefix)) {
    const p = raw(`face/${prefix}`);
    run('extract-face.mjs', ['--src', p, '--category', prefix, '--id', id]);
    row(prefix, prefix, `wardrobe/${prefix}/${id}.png`, false, source(p, 'extract-face.mjs'));
  } else if (MAKEUP[prefix]) {
    const c = MAKEUP[prefix];
    const p = raw('face/makeup');
    run('extract-makeup.mjs', ['--src', p, '--category', c, '--id', id]);
    row(c, c, `wardrobe/${c}/${id}_tint.png`, true, source(p, 'extract-makeup.mjs'));
  } else if (GARMENT[prefix]) {
    const c = GARMENT[prefix];
    const p = raw(`wardrobe/${c}`);
    run('extract-item.mjs', ['--src', p, '--category', c, '--id', id, '--tint']);
    row(c, c, `wardrobe/${c}/${id}_tint.png`, true, source(p, 'extract-item.mjs'));
  } else if (prefix === 'ui' || prefix === 'logo') {
    // UI pieces and the logo keep their own shape: trimmed, longest side 512.
    const p = raw('ui');
    run('extract-object.mjs', [
      '--src',
      p,
      '--out',
      `public/assets/ui/${id}.png`,
      '--size',
      '512',
      '--trim',
      '1',
    ]);
    row(
      'ui',
      'ui',
      `ui/${id}.png`,
      id === 'ui_button' || id === 'ui_button_round',
      source(p, 'extract-object.mjs'),
    );
  } else if (id === 'app_icon') {
    // Full-bleed icon: no key. Kept as the source for public/icon*.png (scripts/gen-icons.mjs).
    const p = raw('ui');
    console.log(`app_icon saved to ${p}; update the app icons from it`);
  } else if (prefix === 'bg') {
    const p = raw('backdrops');
    run('extract-backdrop.mjs', ['--src', p, '--out', `public/assets/backdrops/${id}.png`]);
    row('backdrops', 'backdrop', `backdrops/${id}.png`, false, source(p, 'extract-backdrop.mjs'));
  } else if (OBJECT[prefix]) {
    const [cat, layer, w, h] = OBJECT[prefix];
    const [sw, sh] = SIZE[id] ?? [w, h];
    const p = raw(cat);
    const extra = sh < sw / 2 ? ['--fit', '1'] : [];
    run('extract-object.mjs', [
      '--src',
      p,
      '--out',
      `public/assets/${cat}/${id}.png`,
      '--size',
      String(sw),
      '--height',
      String(sh),
      ...extra,
    ]);
    row(cat, layer, `${cat}/${id}.png`, false, source(p, 'extract-object.mjs'));
  } else {
    console.log(`SKIPPED ${id}: no rule for prefix "${prefix}"`);
  }
}

const ids = new Set(rows.map((r) => r.id));
manifest.assets = manifest.assets.filter((a) => !ids.has(a.id)).concat(rows);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${rows.length} rows added or replaced`);
