// Edge Function « recettes-web » : recherche de recettes sur le web et lecture d'une page de recette.
//
//   POST { action: "search", q: "lasagnes", exclude: ["porc", "noix"], sites: ["marmiton.org", "750g.com"] }
//     → { results: [{ title, url, site }], removed: [{ title, word }] }
//   POST { action: "read", url: "https://www.marmiton.org/recettes/..." }
//     → { recipe: { name, url, site, image, yield, minutes, category, cuisine, ingredients[], steps[] } }
//
// Recherche : moteurs internes de Marmiton et 750g (les moteurs généralistes bloquent les serveurs).
// Les mots exclus du profil retirent les titres qui les contiennent ; la vraie vérification se fait
// ensuite dans l'app, ingrédient par ingrédient. Lecture : cinq sites, données schema.org Recipe.
// Seuls ces sites sont interrogés ou lus : la fonction n'est pas un proxy ouvert.

const SITES: Record<string, RegExp> = {
  'marmiton.org': /^https:\/\/www\.marmiton\.org\/recettes\/recette_[^/]+\.aspx/,
  '750g.com': /^https:\/\/www\.750g\.com\/[a-z0-9-]+-r\d+\.htm/,
  'cuisineaz.com': /^https:\/\/www\.cuisineaz\.com\/recettes\/[a-z0-9-]+-\d+\.aspx/,
  'journaldesfemmes.fr': /^https:\/\/cuisine\.journaldesfemmes\.fr\/recette\/\d+-[a-z0-9-]+/,
  'ricardocuisine.com': /^https:\/\/www\.ricardocuisine\.com\/recettes\/\d+-[a-z0-9-]+/,
};
const SEARCHABLE = ['marmiton.org', '750g.com'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const decode = (s: string) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = (s: string) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe');
const siteOf = (url: string) => Object.entries(SITES).find(([, re]) => re.test(url))?.[0] || null;
const clean = (url: string) => url.split('#')[0].split('?')[0];

async function get(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${new URL(url).hostname} a répondu ${res.status}`);
  return res.text();
}

/* ---------- Recherche ---------- */
// Titre tiré de l'adresse : « recette_lasagnes-a-la-bolognaise_18215.aspx » → « Lasagnes a la bolognaise »
const titleFromSlug = (slug: string) => { const t = slug.replace(/-/g, ' ').trim(); return t[0].toUpperCase() + t.slice(1); };

async function searchMarmiton(q: string) {
  const html = await get(`https://www.marmiton.org/recettes/recherche.aspx?aqt=${encodeURIComponent(q)}`);
  const out: { title: string; url: string; site: string }[] = [];
  for (const m of html.matchAll(/https:\/\/www\.marmiton\.org\/recettes\/recette_([a-z0-9-]+)_\d+\.aspx/g)) {
    if (!out.some(r => r.url === m[0])) out.push({ title: titleFromSlug(m[1]), url: m[0], site: 'marmiton.org' });
  }
  return out;
}
async function search750g(q: string) {
  const html = await get(`https://www.750g.com/recherche/?q=${encodeURIComponent(q)}`);
  const out: { title: string; url: string; site: string }[] = [];
  for (const m of html.matchAll(/href="((?:https:\/\/www\.750g\.com)?\/[a-z0-9-]+-r\d+\.htm)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const url = clean(m[1].startsWith('http') ? m[1] : `https://www.750g.com${m[1]}`);
    const title = strip(m[2]);
    if (title && !out.some(r => r.url === url)) out.push({ title, url, site: '750g.com' });
  }
  return out;
}

async function search(q: string, exclude: string[], sites: string[]) {
  const engines: Record<string, (q: string) => Promise<{ title: string; url: string; site: string }[]>> = { 'marmiton.org': searchMarmiton, '750g.com': search750g };
  const lists = await Promise.all(sites.filter(s => engines[s]).map(s => engines[s](q).catch(() => [])));
  // Les pages de résultats contiennent aussi des liens de navigation : on garde les titres qui parlent de la recherche
  const words = norm(q).split(/[^a-z0-9]+/).filter(w => w.length >= 3).map(w => w.replace(/s$/, ''));
  const relevant = (t: string) => !words.length || words.some(w => norm(t).includes(w));
  const removed: { title: string; word: string }[] = [];
  const results = [];
  for (let i = 0; i < 12; i++) {
    for (const list of lists) {
      const r = list.filter(x => relevant(x.title))[i];
      if (!r) continue;
      const hit = exclude.find(w => new RegExp(`\\b${norm(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(norm(r.title)));
      if (hit) removed.push({ title: r.title, word: hit }); else results.push(r);
    }
  }
  return { results: results.slice(0, 12), removed };
}

/* ---------- Lecture d'une recette (schema.org Recipe en JSON-LD) ---------- */
function findRecipe(html: string) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      // Certains sites laissent des retours à la ligne bruts dans les chaînes : JSON invalide sans ce nettoyage
      const data = JSON.parse(m[1].trim().replace(/[\u0000-\u001F]+/g, ' '));
      const nodes = [data].flat().flatMap((x: any) => x?.['@graph'] || [x]);
      const r = nodes.find((x: any) => [x?.['@type']].flat().includes('Recipe'));
      if (r) return r;
    } catch { /* bloc illisible : on passe au suivant */ }
  }
  return null;
}
const minutes = (iso?: string) => {
  const m = iso?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  return m ? (Number(m[1] || 0) * 1440 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) || null : null;
};
const steps = (ins: any): string[] => [ins].flat().flatMap((s: any) => {
  if (!s) return [];
  if (typeof s === 'string') return [strip(s)];
  if (s['@type'] === 'HowToSection') return steps(s.itemListElement);
  return s.text ? [strip(s.text)] : s.name ? [strip(s.name)] : [];
}).filter(Boolean);
const image = (img: any): string | null => {
  const first = [img].flat()[0];
  return typeof first === 'string' ? first : first?.url || null;
};

async function readRecipe(url: string) {
  const site = siteOf(clean(url));
  if (!site) throw new Error('Site non pris en charge : Marmiton, 750g, Cuisine AZ, Journal des Femmes ou Ricardo.');
  const html = await get(clean(url));
  const r = findRecipe(html);
  if (!r) throw new Error('Cette page ne contient pas de recette lisible.');
  return {
    name: strip(String(r.name || '')).replace(/\s*:\s*la meilleure recette$/i, ''),
    url: clean(url),
    site,
    image: image(r.image),
    yield: Number(String([r.recipeYield].flat()[0] ?? '').match(/\d+/)?.[0]) || null,
    minutes: minutes(r.totalTime) || ((minutes(r.prepTime) || 0) + (minutes(r.cookTime) || 0)) || null,
    category: [r.recipeCategory].flat()[0] || null,
    cuisine: [r.recipeCuisine].flat()[0] || null,
    ingredients: [r.recipeIngredient || r.ingredients].flat().filter(Boolean).map((s: string) => strip(String(s))),
    steps: steps(r.recipeInstructions),
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST attendu' }, 405);
  try {
    const body = await req.json();
    if (body.action === 'search') {
      const q = String(body.q || '').trim().slice(0, 80);
      if (!q) return json({ error: 'Requête vide' }, 400);
      const exclude = (Array.isArray(body.exclude) ? body.exclude : []).map(String).map((w: string) => w.trim()).filter(Boolean).slice(0, 30);
      const asked = (Array.isArray(body.sites) ? body.sites : SEARCHABLE).filter((s: string) => SEARCHABLE.includes(s));
      return json(await search(q, exclude, asked.length ? asked : SEARCHABLE));
    }
    if (body.action === 'read') return json({ recipe: await readRecipe(String(body.url || '')) });
    return json({ error: 'Action inconnue' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
