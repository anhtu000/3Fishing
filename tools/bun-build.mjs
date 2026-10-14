// Build without npm/Vite, for environments where the npm registry is blocked (Claude's cloud workspace).
// Produces the same layout as `vite build`: dist/<target>/index.html + assets/ + public files.
// On a normal machine use `npm run build` / `npm run build:web` (Vite) instead.
//   bun tools/bun-build.mjs web        -> dist/web
//   bun tools/bun-build.mjs poki       -> dist/poki
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const target = process.argv[2] ?? 'web';
const root = resolve(import.meta.dir, '..');
const game = JSON.parse(readFileSync(join(root, 'src/game.json'), 'utf8'));
const SDK_TAGS = {
  web: '',
  crazygames: '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
  poki: '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
};
if (!(target in SDK_TAGS)) throw new Error(`Unknown target ${target}`);

const out = join(root, 'dist', target);
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'assets'), { recursive: true });

const result = await Bun.build({
  entrypoints: [join(root, 'src/main.ts')],
  outdir: join(out, 'assets'),
  target: 'browser',
  format: 'esm',
  minify: true,
  sourcemap: 'none',
  naming: { entry: '[name]-[hash].[ext]', asset: '[name]-[hash].[ext]' },
  define: {
    __TARGET__: JSON.stringify(target),
    __GAME_ID__: JSON.stringify(game.id),
    'process.env.NODE_ENV': '"production"',
  },
  loader: { '.woff': 'file', '.woff2': 'file', '.ttf': 'file' },
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const files = readdirSync(join(out, 'assets'));
const js = files.find((f) => f.endsWith('.js'));
const css = files.filter((f) => f.endsWith('.css'));

let html = readFileSync(join(root, 'index.html'), 'utf8')
  .replace('<!-- PORTAL_SDK -->', SDK_TAGS[target])
  .replaceAll('%GAME_TITLE%', game.title)
  .replaceAll('%GAME_BG%', game.background)
  .replace(/<script type="module" src="\/src\/main.ts"><\/script>/, '');
const links = css.map((f) => `<link rel="stylesheet" crossorigin href="./assets/${f}">`).join('\n    ');
html = html.replace('</head>', `    <script type="module" crossorigin src="./assets/${js}"></script>\n    ${links}\n  </head>`);
writeFileSync(join(out, 'index.html'), html);

if (existsSync(join(root, 'public'))) cpSync(join(root, 'public'), out, { recursive: true });
console.log(`built ${target}: ${files.join(', ')}`);
