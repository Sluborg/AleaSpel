// Shape of public/assets/manifest.json. Preload loads every entry listed there.
export interface AssetEntry {
  id: string;
  category: string; // e.g. 'avatar', 'furniture', 'gym', 'ui'
  layer?: string; // avatar/render layer, e.g. 'hair', 'top'
  file: string; // path relative to public/assets
  tintable?: boolean; // true = light/grayscale art, coloured in code (multiply tint)
  detail?: string; // optional untinted overlay file for a tintable item
  license: string;
  source: string;
}

export interface AssetManifest {
  version: number;
  assets: AssetEntry[];
}

export const ASSET_MANIFEST_KEY = 'asset-manifest';
