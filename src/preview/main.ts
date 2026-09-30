// Wardrobe preview (/preview/): stacks the master with selected manifest items so new art can be
// checked on a phone. Dev tool, not part of the game. Selection is kept in the URL (?items=a,b).
import wardrobe from '../data/wardrobe.json';
import type { AssetEntry, AssetManifest } from '../data/assets';
import './preview.css';

interface Anchors {
  canvas: { width: number; height: number };
  points: Record<string, { x: number; y: number }>;
}

const ASSETS = '../assets/';
const layerOrder = new Map(wardrobe.layers.map((l) => [l.id, l.order]));
const BACKGROUNDS = [
  { id: 'checker', label: 'Rutor' },
  { id: 'dark', label: 'Mörk' },
  { id: 'light', label: 'Ljus' },
  { id: 'green', label: 'Grön' },
];

const state = {
  selected: new Set<string>(),
  tints: new Map<string, string>(),
  background: 'checker',
  anchors: false,
};

function readUrl(): void {
  const q = new URLSearchParams(location.search);
  for (const id of (q.get('items') ?? '').split(',').filter(Boolean)) state.selected.add(id);
  for (const pair of (q.get('tints') ?? '').split(',').filter(Boolean)) {
    const [id, hex] = pair.split(':');
    if (id && hex) state.tints.set(id, `#${hex}`);
  }
  state.background = q.get('bg') ?? state.background;
  state.anchors = q.get('anchors') === '1';
}

function writeUrl(): void {
  const q = new URLSearchParams();
  if (state.selected.size) q.set('items', [...state.selected].join(','));
  const tints = [...state.tints].filter(([id]) => state.selected.has(id));
  if (tints.length) q.set('tints', tints.map(([id, c]) => `${id}:${c.slice(1)}`).join(','));
  if (state.background !== 'checker') q.set('bg', state.background);
  if (state.anchors) q.set('anchors', '1');
  history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}`);
}

const images = new Map<string, Promise<HTMLImageElement>>();
function load(file: string): Promise<HTMLImageElement> {
  if (!images.has(file)) {
    images.set(
      file,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`could not load ${file}`));
        img.src = ASSETS + file;
      }),
    );
  }
  return images.get(file)!;
}

// Multiply tint that keeps the item's own alpha (same result as Phaser setTint).
function tinted(img: HTMLImageElement, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(img, 0, 0);
  return c;
}

async function main(): Promise<void> {
  readUrl();
  const [manifest, anchors] = await Promise.all([
    fetch(`${ASSETS}manifest.json`).then((r) => r.json() as Promise<AssetManifest>),
    fetch(`${ASSETS}base/anchors.json`).then((r) => r.json() as Promise<Anchors>),
  ]);
  const items = manifest.assets
    .filter((a) => a.layer && layerOrder.has(a.layer))
    .sort((a, b) => (layerOrder.get(a.layer!) ?? 0) - (layerOrder.get(b.layer!) ?? 0));
  const base = items.find((a) => a.category === 'base');
  const wearables = items.filter((a) => a.category !== 'base');

  document.body.innerHTML = `
    <header><h1>Garderob</h1><span class="muted">${wearables.length} plagg</span></header>
    <main>
      <div class="stage bg-${state.background}"><canvas width="${anchors.canvas.width}" height="${anchors.canvas.height}"></canvas></div>
      <section class="controls">
        <div class="row" id="bgs"></div>
        <label class="toggle"><input type="checkbox" id="anchors" /> Visa ankarpunkter</label>
        <div id="list"></div>
      </section>
    </main>`;
  const stage = document.querySelector<HTMLDivElement>('.stage')!;
  const canvas = document.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;

  const bgRow = document.getElementById('bgs')!;
  for (const bg of BACKGROUNDS) {
    const b = document.createElement('button');
    b.textContent = bg.label;
    b.className = bg.id === state.background ? 'on' : '';
    b.onclick = () => {
      state.background = bg.id;
      stage.className = `stage bg-${bg.id}`;
      bgRow.querySelectorAll('button').forEach((x) => (x.className = x === b ? 'on' : ''));
      writeUrl();
    };
    bgRow.append(b);
  }
  const anchorBox = document.getElementById('anchors') as HTMLInputElement;
  anchorBox.checked = state.anchors;
  anchorBox.onchange = () => {
    state.anchors = anchorBox.checked;
    writeUrl();
    void draw();
  };

  const list = document.getElementById('list')!;
  if (!wearables.length) list.innerHTML = '<p class="muted">Inga plagg i manifestet ännu.</p>';
  let currentLayer = '';
  for (const item of wearables) {
    if (item.layer !== currentLayer) {
      currentLayer = item.layer!;
      const h = document.createElement('h2');
      h.textContent = currentLayer;
      list.append(h);
    }
    list.append(itemRow(item));
  }

  function itemRow(item: AssetEntry): HTMLElement {
    const row = document.createElement('label');
    row.className = 'item';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.selected.has(item.id);
    box.onchange = () => {
      if (box.checked) state.selected.add(item.id);
      else state.selected.delete(item.id);
      writeUrl();
      void draw();
    };
    const name = document.createElement('span');
    name.textContent = item.id;
    row.append(box, name);
    if (item.tintable) {
      const color = document.createElement('input');
      color.type = 'color';
      color.value = state.tints.get(item.id) ?? '#ff6fae';
      state.tints.set(item.id, color.value);
      color.oninput = () => {
        state.tints.set(item.id, color.value);
        writeUrl();
        void draw();
      };
      row.append(color);
    }
    return row;
  }

  let drawId = 0;
  async function draw(): Promise<void> {
    const id = ++drawId;
    const stack = [base, ...wearables.filter((w) => state.selected.has(w.id))].filter(
      (a): a is AssetEntry => !!a,
    );
    const layers = await Promise.all(
      stack.map(async (a) => ({
        entry: a,
        img: await load(a.file),
        detail: a.detail ? await load(a.detail) : null,
      })),
    );
    if (id !== drawId) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const { entry, img, detail } of layers) {
      const tint = entry.tintable ? state.tints.get(entry.id) : undefined;
      ctx.drawImage(tint ? tinted(img, tint) : img, 0, 0);
      if (detail) ctx.drawImage(detail, 0, 0);
    }
    if (state.anchors) drawAnchors();
  }

  function drawAnchors(): void {
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    for (const [name, p] of Object.entries(anchors.points)) {
      const right = name.endsWith('R');
      ctx.fillStyle = name.endsWith('L') ? '#ff3c3c' : right ? '#3c8cff' : '#ff00c8';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = right ? 'left' : 'right';
      const tx = p.x + (right ? 12 : -12);
      ctx.strokeText(name, tx, p.y);
      ctx.fillText(name, tx, p.y);
    }
  }

  await draw();
}

main().catch((e: unknown) => {
  document.body.textContent = `Preview error: ${e instanceof Error ? e.message : String(e)}`;
});
