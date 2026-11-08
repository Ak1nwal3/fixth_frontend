// Throwaway: renders a .dc.html artboard to static HTML so the taste-skill inspector can screenshot it.
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
const html = fs.readFileSync(src, 'utf8');
const blobs = {
  '36db8debf955ae1446c8234252e2a209': 'assets/female-aircraft-engineers-kwara-state-nigeria.jpg',
  '28dccb5cf0f78e1f1d91be395b029c85': 'assets/a-welding.jpg',
  '7eff6bb75d2814713368f5f6588ba05d': 'assets/egbin-thermal-power-station-admin-section.jpg',
  'c299cee69c281a9d40cad6e1d1139c9d': 'assets/kainji-dam.jpg',
  '4db024b6147984492787b92e0dbd9e60': 'assets/river-niger-at-kainji-dam-niger-state.jpg',
  'c8d559f8cdd5474f378a20a886583cd6': 'assets/abuja-builders-16710242076.jpg',
};
const script = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState() {} }
const Component = new Function('DCLogic', script + '\nreturn Component;')(DCLogic);
const vals = new Component({}).renderVals();
const get = (scope, path) => path.trim().split('.').reduce((o, k) => (o == null ? o : o[k]), scope);
let body = html.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
const helmet = (body.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1];
body = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
body = body.replace(/<sc-for list="\{\{(.+?)\}\}" as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g, (_, list, as, inner) =>
  (get(vals, list) || []).map((item) => inner.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (m, p) =>
    p.startsWith(as + '.') ? String(get({ [as]: item }, p) ?? '') : m)).join(''));
body = body.replace(/\s(onClick)="\{\{[^}]+\}\}"/g, '');
body = body.replace(/open="\{\{yes\}\}"/g, 'open');
body = body.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_, p) => String(get(vals, p) ?? ''));
body = body.replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => blobs[id] || '');
fs.writeFileSync(out, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixth — get placed</title>${helmet}</head><body>${body}</body></html>`);
console.log('wrote', out);
