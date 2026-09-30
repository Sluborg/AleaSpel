// Shape of public/assets/manifest.json. Preload loads every entry listed there.
export interface AssetEntry {
  id: string;
  category: string; // e.g. 'avatar', 'furniture', 'gym', 'ui'
  layer?: string; // avatar/render layer, e.g. 'hair', 'top'
  file: string; // path relative to public/assets
  license: string;
  source: string;
}

export interface AssetManifest {
  version: number;
  assets: AssetEntry[];
}

export const ASSET_MANIFEST_KEY = 'asset-manifest';
