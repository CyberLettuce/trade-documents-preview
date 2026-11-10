import { execFileSync } from 'node:child_process';
import { mkdir, readFile, copyFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Publish the active, prebuilt application without historical preview bundles.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, process.argv[2] || '_site');
if (output === root || root.startsWith(output + path.sep)) throw new Error('Invalid output directory');
await mkdir(output); // Require a fresh directory so stale files cannot be published.
const entries = execFileSync('git', ['ls-files', '--stage', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const tracked = new Map(entries.map(entry => {
  const [metadata, name] = entry.split('\t');
  return [name, metadata.split(' ')[0]];
}));
const selected = new Set();
const queue = [];
function add(name) {
  name = path.posix.normalize(name);
  if (name.startsWith('../') || name.startsWith('/') || !tracked.has(name)) throw new Error(`Missing tracked dependency: ${name}`);
  if (tracked.get(name) !== '100644' && tracked.get(name) !== '100755') throw new Error(`Unsupported file type: ${name}`);
  if (!selected.has(name)) { selected.add(name); queue.push(name); }
}
add('index.html');
for (const name of tracked.keys()) {
  // PDF rendering loads its fonts, character maps and worker dynamically.
  if (name.startsWith('assets/pdfjs-5.6.205/') || /^assets\/.*\.(?:svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf|wasm)$/i.test(name)) add(name);
  if (['robots.txt', '.nojekyll', 'CNAME'].includes(name)) add(name);
}
for (let i = 0; i < queue.length; i++) {
  const name = queue[i];
  if (!/\.(?:html|m?js|css)$/.test(name) || name.startsWith('assets/pdfjs-5.6.205/')) continue;
  const source = await readFile(path.join(root, name), 'utf8');
  // Vite emits static imports, lazy import maps, URL assets and CSS URLs as literals.
  const literals = source.matchAll(/["'`](\.?\.?\/?[A-Za-z0-9_./@+-]+\.(?:m?js|css|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf|wasm)(?:[?#][^"'`\s]*)?)["'`]/g);
  const cssUrls = source.matchAll(/url\(\s*([A-Za-z0-9_./@+-]+\.(?:woff2?|ttf|otf|svg|png|jpe?g|webp|gif))(?:[?#][^\s)]*)?\s*\)/g);
  for (const match of [...literals, ...cssUrls]) {
    const ref = match[1].split(/[?#]/)[0];
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(name), ref));
    const documentRelative = path.posix.normalize(ref);
    if (tracked.has(relative)) add(relative);
    else if (tracked.has(documentRelative)) add(documentRelative);
    else if (ref.startsWith('./') || ref.startsWith('../')) add(relative);
    else if (tracked.has(ref)) add(ref);
  }
}
let bytes = 0;
for (const name of [...selected].sort()) {
  const source = path.join(root, name);
  const dest = path.join(output, name);
  const stat = await lstat(source);
  if (!stat.isFile()) throw new Error(`Not a regular file: ${name}`);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(source, dest);
  if (!(await readFile(source)).equals(await readFile(dest))) throw new Error(`Copy mismatch: ${name}`);
  bytes += stat.size;
}
console.log(JSON.stringify({ output, files: selected.size, bytes, modules: [...selected].filter(name => /\.(?:m?js|css)$/.test(name) && !name.startsWith('assets/pdfjs-5.6.205/')).sort() }, null, 2));
