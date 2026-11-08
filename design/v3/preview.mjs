// Throwaway: renders a .dc.html artboard to static HTML so the taste-skill inspector can screenshot it.
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
const html = fs.readFileSync(src, 'utf8');
const blobs = {
  '5844faf225dc808cea391afa4c0c9225':'img/1773844389459-110d2b5e18e2.jpg','f588ac6bb2b1cc12e8c1f60b28366ce3':'img/1725811641350-f63dc7442725.jpg','9e661ba4c7d9d2251cf2a1c2fe726f1c':'img/1621905252507-b35492cc74b4.jpg','c62a033b552fa44a16656e7232b3baa0':'img/1776597172675-cf10349ac5b6.jpg','4d0f3109a46b6d4a8ea0f2db82be4764':'img/1787672357797-f5fa35bb0d18.jpg','63be3fbd9e399ba71047e8927cb4000c':'img/1719314313652-d9835e0c52c3.jpg',
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
