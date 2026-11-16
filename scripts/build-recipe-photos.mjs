// Cherche une photo du plat pour chaque recette qui n'a pas la sienne, dans Wikimedia Commons.
//
//   node scripts/build-recipe-photos.mjs            (à lancer après build-images.mjs)
//   node scripts/build-recipe-photos.mjs --review   (écrit aussi une planche contact HTML pour relire)
//
// Chaque recette a des requêtes (scripts/recipe-queries.mjs), de la plus précise à la plus générale ;
// les candidats sont filtrés (vraie photo, assez grande, pas un dessin, un étal ou un champ) puis
// chaque recette reçoit le premier candidat que n'a pas déjà pris une autre recette.
// scripts/recipe-photos.json garde les choix faits à la relecture :
//   pins    : { idRecette: "Fichier.jpg" }  photo imposée (celle d’une recette sœur si Commons n’a rien de mieux), null pour aucune
//   banned  : [ "Fichier.jpg" ]             photos écartées (hors sujet, peu appétissantes)
//   queries : { idRecette: ["requête"] }    requêtes remplaçant celles par défaut
//   replaceOwn : [ idRecette ]              recettes dont la photo d'origine est remplacée (plat cru, ingrédients…)
// Les réponses de Commons sont gardées dans scripts/.cache/ pour relancer sans tout réinterroger.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { queriesFor } from './recipe-queries.mjs';

const OUT = new URL('../public/data/', import.meta.url);
const CACHE_DIR = new URL('.cache/', import.meta.url);
const CACHE = new URL('commons-search.json', CACHE_DIR);
const CHOICES = new URL('recipe-photos.json', import.meta.url);
const UA = 'PapilleDataBuild/0.1 (personal project; data build script)';
const strip = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Fichiers qui ne montrent pas un plat servi : dessins, étals, champs, emballages, enseignes…
const BAD = /k(o|ö|oe)hler|illustration|drawing|dessin|botanic|diagram|\bmap\b|poster|stamp|logo|\bsign\b|label|packag|wrapper|advert|\bbox\b|\btin\b|\bcan\b|bottle|market|march[ée]|stall|shop|store|supermarket|grocer|field|garden|orchard|\bfarm|harvest|plant\b|plants|flower|blossom|seedling|\btree\b|museum|statue|church|building|street|portrait|\bman\b|\bwoman\b|girl|\bboy\b|child|people|crowd|festival|parade|protest|book|cover|menu|screenshot|recipe card|\bseeds?\b|nutrition|anatomy|microscop|specimen|herbarium|\bcat\b|\bdog\b|insect|larva|caterpillar|\bmold|rotten|spoiled|waste|garbage|vomit|disease|butterfl|\bmoth\b|hairstreak|\bempty\b|\bvides?\b|vendor|seller|maker\b|breakfast experience|\bx-?ray|\.svg$|\.gif$|\.tiff?$|\.png$/i;

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const choices = existsSync(CHOICES) ? JSON.parse(readFileSync(CHOICES, 'utf8')) : {};
const pins = choices.pins || {};
const banned = new Set((choices.banned || []).map(f => f.replace(/_/g, ' ')));
const customQueries = choices.queries || {};
const replaceOwn = new Set(choices.replaceOwn || []); // recettes dont la photo d'origine ne montre pas le plat fini

/** Requête avec reprise : Commons limite le débit des clients anonymes (429 + retry-after), on attend le délai demandé. */
async function get(url, init = {}) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...init.headers } }).catch(e => (attempt < 3 ? { status: e.cause?.code || 'réseau', headers: new Headers() } : null));
    if (!res) return null; // réseau coupé : on garde ce qu'on a, la recherche sera refaite au prochain lancement
    if (res.ok) return res.json();
    process.stdout.write(`[${res.status}]`);
    await sleep(((Number(res.headers.get('retry-after')) || 5) + 1) * 1000);
  }
  throw new Error(`Commons indisponible : ${url}`);
}
const api = params => get('https://commons.wikimedia.org/w/api.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ format: 'json', formatversion: '2', ...params }) });

// Vignette à l’adresse classique (upload.wikimedia.org), sans paramètres de suivi
const thumbUrl = u => u && u.replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/").replace(/[?]utm_.*$/, "");
const clean = s => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const info = cache.info || (cache.info = {});   // fichier → { w, h, mime, thumb, page, author, licence, nonfree }
const searches = cache.search || (cache.search = {}); // requête → [fichiers], par pertinence
const shape = cache.shape || (cache.shape = {}); // fichier → largeur / hauteur
const photoName = f => (!shape[f] || (shape[f] >= 0.66 && shape[f] <= 2.2)) && /\.jpe?g$/i.test(f) && !BAD.test(f) && !banned.has(f);

/** Fichiers trouvés par une requête, dans l'ordre de pertinence.
 *  Passe par la passerelle REST (api.wikimedia.org) : l'API action de Commons limite fortement les clients anonymes. */
async function search(q) {
  if (searches[q]) return searches[q];
  const j = await get(`https://api.wikimedia.org/core/v1/commons/search/page?q=${encodeURIComponent(`${q} filetype:bitmap`)}&limit=100`);
  if (!j) return [];
  const pages = (j.pages || []).filter(x => x.title.startsWith('File:'));
  // La vignette de la recherche donne déjà le format et les proportions : on écarte tôt les images trop étirées
  for (const x of pages) if (x.thumbnail?.width) shape[x.title.slice(5)] = Math.round(x.thumbnail.width / x.thumbnail.height * 100) / 100;
  searches[q] = pages.map(x => x.title.slice(5));
  return searches[q];
}

/** Dimensions, vignette, auteur et licence, par lots de 50 fichiers. */
async function fetchInfo(files) {
  const list = [...new Set(files)].filter(f => !(f in info));
  for (let i = 0; i < list.length; i += 50) {
    const batch = list.slice(i, i + 50);
    const j = await api({ action: 'query', titles: batch.map(f => `File:${f}`).join('|'), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '480', iiextmetadatafilter: 'Artist|LicenseShortName|NonFree' });
    if (!j) return;
    const norm = new Map((j.query?.normalized || []).map(n => [n.to, n.from]));
    for (const p of j.query?.pages || []) {
      const ii = p.imageinfo?.[0];
      const f = (norm.get(p.title) || p.title).replace(/^File:/, '');
      if (!ii) { info[f] = null; continue; }
      const meta = ii.extmetadata || {};
      info[f] = { w: ii.width, h: ii.height, mime: ii.mime, thumb: thumbUrl(ii.thumburl), page: ii.descriptionurl,
        author: clean(meta.Artist?.value || 'Auteur inconnu').slice(0, 120), licence: meta.LicenseShortName?.value || 'Licence libre', nonfree: meta.NonFree?.value === 'true' };
    }
    for (const f of batch) if (!(f in info)) info[f] = null;
    save();
    process.stdout.write('i');
    await sleep(1000);
  }
}
const save = () => { mkdirSync(CACHE_DIR, { recursive: true }); writeFileSync(CACHE, JSON.stringify(cache)); };

const good = f => { const c = info[f]; return c && !c.nonfree && /jpe?g|webp/.test(c.mime) && c.w >= 640 && c.h >= 427 && c.w / c.h >= 0.66 && c.w / c.h <= 2.2 && photoName(f); };

/* ---------- Recherche : requêtes dans l'ordre, jusqu'à 8 noms de fichiers plausibles ---------- */
const { recettes } = JSON.parse(readFileSync(new URL('recettes.json', OUT), 'utf8'));
const images = JSON.parse(readFileSync(new URL('images.json', OUT), 'utf8'));
const todo = recettes.filter(r => !r.photo || replaceOwn.has(r.id));
const qs = new Map(todo.map(r => [r.id, customQueries[r.id] || queriesFor(r.name) || [r.name]]));
// --fast : Commons limite le débit (une dizaine de recherches par minute). Dans ce mode, les familles regroupées
// n'interrogent que leur lot commun, et une recette qui avait la photo de l'article Wikipédia de son plat la garde.
const FAST = process.argv.includes('--fast');
const article = cache.article || (cache.article = Object.fromEntries(Object.entries(images.recipes || {}).filter(([, x]) => x.article)));
const found = new Map(); // id → [{ file, q }]
const hasKey = (f, keys) => keys?.some(k => strip(f).includes(strip(k)));
let n = 0;
for (const r of todo) {
  const list = [];
  const all = qs.get(r.id);
  const queries = FAST && all.pool ? [...all.filter(q => q !== all.pool && searches[q]), all.pool] : all;
  // Photo imposée : inutile de chercher ; en mode --fast, la photo de l’article Wikipédia suffit
  const skip = !!pins[r.id] || (FAST && article[r.id] && !all.some(q => searches[q]));
  for (const q of skip ? [] : queries) {
    for (const f of await search(q)) if (photoName(f) && !list.some(x => x.file === f)) list.push({ file: f, q });
    if (list.length >= (q === all.pool ? 1 : 4)) break; // la requête suivante, plus générale, ne sert que si celle-ci ne donne presque rien
  }
  // Dans un lot commun, les photos dont le nom cite la variante (« leek », « poireau ») passent devant
  if (all.kw) list.sort((a, b) => hasKey(b.file, all.kw) - hasKey(a.file, all.kw));
  list.pooled = !!all.pool;
  found.set(r.id, list);
  if (++n % 50 === 0) { save(); process.stdout.write(`${n} `); }
}
save();
// Dimensions et licence : seulement pour les premiers candidats de chaque recette, puis les suivants si aucun ne convient
await fetchInfo(Object.values(pins).filter(Boolean));
for (const [from, to] of [[0, 3], [3, 8], [8, 16]]) {
  await fetchInfo([...found.values()].flatMap(list => list.slice(0, from).some(x => good(x.file)) ? [] : list.slice(from, list.pooled ? to * 3 : to).map(x => x.file)));
}
save();

/* ---------- Attribution : photo imposée, sinon premier candidat libre ---------- */
const used = new Set();
const result = {};
const alternates = {};
// Les recettes à photo imposée passent d'abord, pour que leur photo ne soit pas prise par une autre
const order = [...todo].sort((a, b) => (pins[b.id] ? 1 : 0) - (pins[a.id] ? 1 : 0));
for (const r of order) {
  const none = r.id in pins && pins[r.id] === null; // aucune photo convenable : la fiche garde l’illustration par l’ingrédient
  let pick = pins[r.id] && info[pins[r.id]] ? { ...info[pins[r.id]], file: pins[r.id], q: 'imposée' } : null;
  // La photo de l’article Wikipédia du plat, choisie par ses rédacteurs, passe avant les résultats de recherche
  const art = article[r.id] && decodeURIComponent(article[r.id].page.split('/File:')[1]).replace(/_/g, ' ');
  const cands = found.get(r.id).filter(x => good(x.file) && x.file !== art).map(x => ({ ...info[x.file], ...x }));
  if (art && !banned.has(art)) cands.unshift({ ...article[r.id], file: art, q: 'article Wikipédia' });
  if (!pick && !none) pick = cands.find(c => !used.has(c.file)) || cands[0] || null;
  alternates[r.id] = cands.filter(c => c.file !== pick?.file).slice(0, 8);
  if (!pick) continue;
  used.add(pick.file);
  result[r.id] = { thumb: thumbUrl(pick.thumb), page: pick.page, author: pick.author, licence: pick.licence, q: pick.q };
}
const missing = todo.filter(r => !result[r.id]);
console.log(`\nPhotos trouvées : ${Object.keys(result).length} / ${todo.length}`);
if (missing.length) console.log('Sans photo :', missing.map(r => r.name).join(' | '));

images.recipes = Object.fromEntries(Object.entries(result).map(([id, { q, ...img }]) => [id, img]));
images.genere_le = new Date().toISOString();
writeFileSync(new URL('images.json', OUT), JSON.stringify(images));

/* ---------- Planche contact pour la relecture ---------- */
if (process.argv.includes('--review')) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const cards = todo.map((r, i) => {
    const x = result[r.id];
    const alts = (alternates[r.id] || []).map((c, k) => `<figure class="alt"><img loading="lazy" src="${esc(thumbUrl(c.thumb))}"><figcaption>${k + 1}</figcaption></figure>`).join('');
    return `<section id="${r.id}" data-i="${i}"><b>${i} · ${esc(r.name)}</b><small>${esc(x?.q || '—')} · ${esc(pins[r.id] ? 'imposée' : '')}</small>${x ? `<img src="${esc(x.thumb)}">` : '<div class="none">aucune</div>'}<div class="alts">${alts}</div></section>`;
  }).join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>Relecture photos</title><style>[hidden]{display:none!important}
body{font:12px system-ui;margin:8px;background:#fff}main{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
section{display:flex;flex-direction:column;gap:2px;min-width:0}section>img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#eee}
small{color:#777;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.alts{display:none}.none{aspect-ratio:4/3;background:#fdd;display:grid;place-items:center}
body.alts-on .alts{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}.alt{margin:0;position:relative}.alt img{width:100%;aspect-ratio:4/3;object-fit:cover}
.alt figcaption{position:absolute;top:0;left:0;background:#000a;color:#fff;padding:0 3px}
</style><main>${cards}</main><script>
// #30-59 : n'affiche que ces cartes (une capture par tranche) ; #alts:30-59 montre aussi les autres candidats
function show(){const h=(location.search||location.hash).slice(1);const alts=h.startsWith('alts:');document.body.classList.toggle('alts-on',alts);
const r=alts?h.slice(5):h;const list=r.includes(',')?new Set(r.split(',').map(Number)):null;
const [a,b]=r.split('-').map(Number);
document.querySelectorAll('section').forEach(s=>{const i=+s.dataset.i;s.hidden=list?!list.has(i):!(isNaN(a)||(i>=a&&i<=(isNaN(b)?a:b)));});}
addEventListener('hashchange',show);show();</script>`;
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(new URL('review.html', CACHE_DIR), html);
  writeFileSync(new URL('alternates.json', CACHE_DIR), JSON.stringify(Object.fromEntries(Object.entries(alternates).map(([id, l]) => [id, l.map(c => c.file)]))));
  console.log('Planche : scripts/.cache/review.html');
}
