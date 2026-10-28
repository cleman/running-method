// Builds web/index.html: one self-contained page (engine + spec + messages + UI), no network at run time.
// Usage, from web/:  npm install && node build.mjs [--fragment <path>]
//   --fragment also writes the page without <!doctype>/<html>/<head>/<body>, for hosts that add their own skeleton.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const read = p => readFileSync(resolve(root, p), 'utf8');

import { parseMessages, parseModules, paramDefaults } from './src/catalogue.mjs';

const catalogue = {
  ...parseMessages(read('spec/messages.md')), modules: parseModules(read('spec/06-session-library.md')),
  params: paramDefaults(JSON.parse(read('spec/parameters.json'))),
};

// ---- the engine, bundled for a Web Worker (it also runs on the main thread if workers are refused)
const engineJs = (await build({
  entryPoints: [resolve(here, 'src/engine-worker.ts')], bundle: true, format: 'iife', write: false, minify: true,
  target: 'es2020', loader: { '.json': 'json' }, legalComments: 'none',
})).outputFiles[0].text;

const appJs = (await build({
  entryPoints: [resolve(here, 'src/app.js')], bundle: true, format: 'iife', write: false, minify: false, target: 'es2020',
})).outputFiles[0].text;

const css = read('web/src/style.css');
const body = read('web/src/body.html');
const specVersion = JSON.parse(read('spec/rules.json')).version ?? 'v5.2';
const builtOn = new Date().toISOString().slice(0, 10);

// </script> inside a JSON or JS string would end the tag early
const safe = s => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

const inner = `<title>Running Method Prototype</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Prototype training-plan generator for trusted testers. Not medical advice.">
<style>
${css}
</style>
${body.replace('{{SPEC_VERSION}}', specVersion).replace('{{BUILT_ON}}', builtOn)}
<script type="text/plain" id="engine-src">${safe(engineJs)}</script>
<script type="application/json" id="catalogue">${safe(JSON.stringify(catalogue))}</script>
<script>
${safe(appJs)}
</script>
`;

const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
</head>
<body>
${inner}</body>
</html>
`;
writeFileSync(resolve(here, 'index.html'), full);
const fi = process.argv.indexOf('--fragment');
if (fi > 0) writeFileSync(resolve(process.argv[fi + 1]), inner);
console.log(`web/index.html: ${(full.length / 1024).toFixed(0)} KB (engine ${(engineJs.length / 1024).toFixed(0)} KB, ${Object.keys(catalogue.msgs).length} messages, ${Object.keys(catalogue.reasons).length} reason codes, ${Object.keys(catalogue.modules).length} modules)`);
