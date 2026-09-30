import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

function shortCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

// Every deploy gets a name, A to Z and round again, so Stefan can see which build is running.
// The deploy workflow's run number picks it; run 61 was the first named build (Astrid).
const RELEASE_NAMES = [
  'Astrid',
  'Bella',
  'Cleo',
  'Dixi',
  'Elsa',
  'Fia',
  'Greta',
  'Hilma',
  'Idun',
  'Juni',
  'Kiki',
  'Lova',
  'Mimmi',
  'Nova',
  'Oda',
  'Pippi',
  'Quinny',
  'Ronja',
  'Saga',
  'Tindra',
  'Ulla',
  'Vilda',
  'Wilma',
  'Xena',
  'Ylva',
  'Zelda',
];
const FIRST_NAMED_RUN = 61;

function releaseName(): string {
  const run = Number(process.env.GITHUB_RUN_NUMBER);
  if (!Number.isFinite(run) || run <= 0) return 'Lokal';
  const n = RELEASE_NAMES.length;
  return RELEASE_NAMES[(((run - FIRST_NAMED_RUN) % n) + n) % n];
}

// BASE_PATH is set by the deploy workflow from GITHUB_REPOSITORY, e.g. "/AleaSpel/".
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(`${pkg.version}+${shortCommit()}`),
    __APP_NAME__: JSON.stringify(releaseName()),
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: 'index.html',
        preview: 'preview/index.html',
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png', 'assets/manifest.json'],
      manifest: {
        name: 'AleaSpel',
        short_name: 'AleaSpel',
        description: 'Gymnastics game for Alea',
        theme_color: '#ff6fae',
        background_color: '#2b1a3d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        lang: 'sv',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,png,webp,mp3,ogg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // The preview page is a separate document, never answer it with the game shell.
        navigateFallbackDenylist: [/\/preview\//],
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
});
