import Phaser from 'phaser';
import { ASSET_MANIFEST_KEY, type AssetEntry, type AssetManifest } from '../data/assets';
import { SaveService } from './SaveService';

// Fast start: Preload loads only the core art (the gymnast, UI pieces, icons, the start screen
// backdrop and every item a gymnast wears). The AssetStream scene then loads everything else in
// the background, most-used first. A scene that opens before its art has arrived loads whatever
// is still missing in its own preload (BaseScene), so no scene ever starts without its art.

const AUDIO_EXT = /\.(mp3|ogg|wav|m4a)$/i;
export const assetUrl = (a: AssetEntry) => `assets/${a.file}`;

// Background order: first what most screens use.
const STREAM_ORDER = [
  'wardrobe',
  'backdrops',
  'furniture',
  'pets',
  'petstuff',
  'food',
  'toys',
  'equipment',
  'exterior',
];

function manifestOf(scene: Phaser.Scene): AssetEntry[] {
  return (scene.cache.json.get(ASSET_MANIFEST_KEY) as AssetManifest | undefined)?.assets ?? [];
}

function wornIds(): Set<string> {
  const ids = new Set<string>();
  for (const g of SaveService.get().gymnasts) {
    for (const w of Object.values(g.outfit)) ids.add(w.item);
    for (const look of Object.values(g.looks ?? {}))
      for (const w of Object.values(look)) ids.add(w.item);
  }
  return ids;
}

// Core art that Preload waits for.
export function coreAssets(scene: Phaser.Scene): AssetEntry[] {
  const worn = wornIds();
  return manifestOf(scene).filter(
    (a) =>
      a.category === 'base' ||
      a.category === 'ui' ||
      a.category === 'icons' ||
      a.id === 'bg_welcome' ||
      worn.has(a.id),
  );
}

// Manifest art not loaded yet (audio excluded), in background order.
export function missingAssets(scene: Phaser.Scene): AssetEntry[] {
  const rank = (a: AssetEntry) => {
    const group = a.file.startsWith('wardrobe/') ? 'wardrobe' : a.category;
    const i = STREAM_ORDER.indexOf(group);
    return i < 0 ? STREAM_ORDER.length : i;
  };
  return manifestOf(scene)
    .filter((a) => !AUDIO_EXT.test(a.file) && !scene.textures.exists(a.id))
    .sort((a, b) => rank(a) - rank(b));
}

export function queueAssets(scene: Phaser.Scene, assets: AssetEntry[]): void {
  for (const a of assets) {
    if (AUDIO_EXT.test(a.file)) scene.load.audio(a.id, assetUrl(a));
    else scene.load.image(a.id, assetUrl(a));
  }
}

// Background progress (0-1) and a promise that resolves when the stream has loaded everything.
let resolveDone: () => void = () => {};
export const streamDone: Promise<void> = new Promise((r) => (resolveDone = r));
let streaming = false;
let progress = 1;
export const streamState = () => ({ streaming, progress });

// Invisible scene that runs in parallel with the game and loads the rest of the art.
export class AssetStreamScene extends Phaser.Scene {
  constructor() {
    super('AssetStream');
  }

  create(): void {
    const rest = missingAssets(this);
    if (!rest.length) {
      resolveDone();
      return;
    }
    streaming = true;
    progress = 0;
    queueAssets(this, rest);
    this.load.on('progress', (p: number) => (progress = p));
    this.load.once('complete', () => {
      streaming = false;
      progress = 1;
      resolveDone();
    });
    this.load.start();
  }
}

// A loader "file" that finishes when a promise resolves: lets a scene's preload wait for the
// background stream instead of downloading the same files a second time.
export class WaitFile extends Phaser.Loader.File {
  constructor(
    loader: Phaser.Loader.LoaderPlugin,
    key: string,
    private readonly until: Promise<void>,
  ) {
    super(loader, { type: 'wait', key, url: 'wait:' + key });
  }

  load(): void {
    void this.until.then(() => this.loader.nextFile(this, true));
  }

  onProcess(): void {
    this.onProcessComplete();
  }
}
