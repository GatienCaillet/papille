// Cherche une photo libre pour chaque aliment et chaque plat sans photo, via Wikipédia / Wikimedia Commons.
//
//   node scripts/build-images.mjs
//
// Lit public/data/aliments.json et public/data/recettes.json, écrit public/data/images.json :
//   { foods: { id: image }, recipes: { id: image } }  avec image = { thumb, page, title, author, licence }
// Seules les images hébergées sur Commons (donc sous licence libre) sont gardées, avec auteur et licence.

import { readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/data/', import.meta.url);
const UA = 'PapilleDataBuild/0.1 (personal project; data build script)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cap = s => s[0].toUpperCase() + s.slice(1);
// Fichiers qui sont des dessins plutôt que des photos (planches de Köhler, illustrations, schémas)
const DRAWING = /k(o|ö|oe)hler|illustration|tafel|planche|plate|drawing|dessin|sowerby|thom[eé]|flora|botanic|schema|diagram|map|carte|\.svg$|\.gif$|\.tiff?$/i;

async function api(host, params) {
  // POST : 50 titres ne tiennent pas dans une URL
  const body = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  let status = 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://${host}/w/api.php`, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (res.ok) return res.json();
    status = res.status;
    await sleep(Number(res.headers.get("retry-after")) * 1000 || 5000 * 2 ** attempt);
  }
  throw new Error(`API ${host} indisponible (${status})`);
}

/** Pour une liste de titres : titre demandé → { file, page } (article non ambigu avec image). */
async function pageImages(host, titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const j = await api(host, { action: 'query', titles: batch.join('|'), prop: 'pageimages|pageprops', piprop: 'name', ppprop: 'disambiguation', redirects: '1' });
    const norm = new Map((j.query.normalized || []).map(n => [n.to, n.from]));
    const redir = new Map((j.query.redirects || []).map(r => [r.to, r.from]));
    for (const p of j.query.pages || []) {
      if (p.missing || !p.pageimage || p.pageprops?.disambiguation !== undefined) continue;
      if (DRAWING.test(p.pageimage)) continue; // planche botanique ou dessin : on cherche une vraie photo ailleurs
      let t = p.title;
      if (redir.has(t)) t = redir.get(t);
      if (norm.has(t)) t = norm.get(t);
      out.set(t, { file: p.pageimage, page: `https://${host}/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}` });
    }
    await sleep(1000);
  }
  return out;
}

/** Fichiers → vignette, auteur, licence (Commons uniquement). */
async function commonsInfo(files) {
  const out = new Map();
  const list = [...new Set(files)];
  for (let i = 0; i < list.length; i += 50) {
    const batch = list.slice(i, i + 50).map(f => `File:${f}`);
    const j = await api('commons.wikimedia.org', { action: 'query', titles: batch.join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '480', iiextmetadatafilter: 'Artist|LicenseShortName|NonFree' });
    const norm = new Map((j.query.normalized || []).map(n => [n.to, n.from]));
    for (const p of j.query.pages || []) {
      const ii = p.imageinfo?.[0];
      if (!ii || p.missing) continue;
      const meta = ii.extmetadata || {};
      if (meta.NonFree?.value === 'true') continue;
      const title = (norm.get(p.title) || p.title).replace(/^File:/, '');
      const author = (meta.Artist?.value || 'Auteur inconnu').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
      out.set(title, { thumb: ii.thumburl, page: ii.descriptionurl, author, licence: meta.LicenseShortName?.value || 'Licence libre' });
    }
    await sleep(1000);
  }
  return out;
}

const { aliments } = JSON.parse(readFileSync(new URL('aliments.json', OUT), 'utf8'));
const { recettes } = JSON.parse(readFileSync(new URL('recettes.json', OUT), 'utf8'));
const FOOD = Object.fromEntries(aliments.map(a => [a.id, a]));

/* ---------- Aliments ---------- */
const foods = aliments.filter(a => !a.categorie);
const QUALIFIER = { fruits: ['fruit'], legumes: ['légume', 'plante'], 'herbes-epices': ['plante', 'épice'], 'legumineuses-fruits-a-coque-graines': ['plante', 'graine'], 'poissons-fruits-de-mer': ['poisson'], 'cereales-feculents': ['céréale', 'aliment'] };
const isEnglish = s => /^[a-z' -]+$/i.test(s) && !/[àâäéèêëîïôöùûüç]/i.test(s);
const found = new Map(); // id → { file, page }

// Corrections relevées à la relecture des planches : homonymes (« asperge » → un prêtre, « lentille » → une église…)
const FOOD_OVERRIDE = {
  asperge: 'Asparagus', lentille: 'Lentil', baguette: 'Baguette', amande: 'Almond', herbes_de_provence: 'Herbes de Provence',
  lardon: 'Lardon', blanc_d_oeuf: 'Egg white', rumsteck: 'Rump steak', filet_mignon_de_porc: 'Pork tenderloin',
  // Aliments de base dont l'article français n'a qu'une planche botanique
  persil: 'Parsley', cumin: 'Cumin', poivron: 'Bell pepper', creme_liquide: 'Cream', coriandre_feuille: 'Coriander',
  laurier: 'Bay leaf', betterave: 'Beetroot', piment: 'Chili pepper', aneth: 'Dill', mais: 'Maize', bouillon_de_volaille: 'Broth',
  laitue: 'Lettuce', romarin: 'Rosemary', colin: 'Pollock', fromage_blanc: 'Fromage blanc', fruits_rouges_melanges: 'Berry', porc_hache: 'Ground meat',
};
const DISH_OVERRIDE = { 'Île flottante': 'Floating island (dessert)', 'Bouches de dames': null };
// Aucun article ne montre une photo : recherche directe dans Commons
const COMMONS_SEARCH = {
  asperge: 'green asparagus bunch', cumin: 'cumin seeds', aneth: 'fresh dill herb',
  mais: 'corn on the cob',
};
{
  const res = await pageImages('en.wikipedia.org', Object.values(FOOD_OVERRIDE));
  for (const [id, t] of Object.entries(FOOD_OVERRIDE)) if (res.get(t)) found.set(id, res.get(t));
  for (const [id, q] of Object.entries(COMMONS_SEARCH)) {
    const j = await api('commons.wikimedia.org', { action: 'query', list: 'search', srsearch: `${q} filetype:bitmap`, srnamespace: '6', srlimit: '10' });
    const hit = (j.query.search || []).map(s => s.title.replace(/^File:/, '')).find(f => /\.jpe?g$/i.test(f) && !DRAWING.test(f));
    if (hit) found.set(id, { file: hit, page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(hit.replace(/ /g, '_'))}` });
    await sleep(1000);
  }
}

// Ordre d'essai : « Nom (qualificatif) », « Nom », puis les autres noms français, puis l'anglais
const passes = [
  ['fr.wikipedia.org', f => (QUALIFIER[f.famille] || ['aliment']).map(q => `${cap(f.nom)} (${q})`)],
  ['fr.wikipedia.org', f => [cap(f.nom)]],
  ['fr.wikipedia.org', f => (f.alias || []).filter(a => !isEnglish(a)).slice(0, 3).map(cap)],
  ['en.wikipedia.org', f => (f.alias || []).filter(isEnglish).slice(0, 2).map(cap)],
];
for (const [host, candidates] of passes) {
  const todo = foods.filter(f => !found.has(f.id));
  const want = new Map(); // titre → [ids]
  for (const f of todo) for (const t of candidates(f)) (want.get(t) || want.set(t, []).get(t)).push(f.id);
  const res = await pageImages(host, [...want.keys()]);
  for (const f of todo) {
    const hit = candidates(f).map(t => res.get(t)).find(Boolean);
    if (hit) found.set(f.id, hit);
  }
  console.log(`${host} : ${found.size} aliments sur ${foods.length}`);
}

/* ---------- Plats sans photo : article Wikipédia du même nom ---------- */
const dishes = recettes.filter(r => !r.photo);
const dishFound = new Map();
const dishTitles = new Map(dishes.map(r => [r.id, cap(r.name.replace(/\s*\(.*\)$/, ''))]));
const dishRes = await pageImages('fr.wikipedia.org', [...new Set(dishTitles.values())]);
const dishOverride = await pageImages('en.wikipedia.org', Object.values(DISH_OVERRIDE).filter(Boolean));
for (const r of dishes) {
  const t = dishTitles.get(r.id);
  const hit = t in DISH_OVERRIDE ? (DISH_OVERRIDE[t] ? dishOverride.get(DISH_OVERRIDE[t]) : null) : dishRes.get(t);
  if (hit) dishFound.set(r.id, hit);
}
console.log(`Plats : ${dishFound.size} sur ${dishes.length} sans photo ont un article illustré`);

/* ---------- Licences ---------- */
const info = await commonsInfo([...found.values(), ...dishFound.values()].map(x => x.file));
const pack = x => { const i = info.get(x.file.replace(/_/g, ' ')) || info.get(x.file); return i ? { ...i, article: x.page } : null; };
const out = { genere_le: new Date().toISOString(), source: 'Wikipédia et Wikimedia Commons (auteur et licence par image)', foods: {}, recipes: {} };
for (const [id, x] of found) { const p = pack(x); if (p) out.foods[id] = p; }
for (const [id, x] of dishFound) { const p = pack(x); if (p) out.recipes[id] = p; }
writeFileSync(new URL('images.json', OUT), JSON.stringify(out));
console.log(`Gardées (Commons, licence libre) : ${Object.keys(out.foods).length} aliments, ${Object.keys(out.recipes).length} plats`);
const sample = ['carotte', 'avocat', 'peche', 'sel', 'orange', 'poulet', 'lentille_corail', 'pomme_de_terre'].map(id => `${id} → ${out.foods[id]?.article?.split('/wiki/')[1] || '—'}`);
console.log(sample.join('\n'));
