/* Papille · wireframes — helpers, données d'exemple et rendu mobile + ordi */

const H = {
  img: (r = '4/3', l = '', c = '') => `<div class="ph ${c}" style="aspect-ratio:${r}">${l ? `<span>${l}</span>` : ''}</div>`,
  lines: (ws = [100, 92, 60]) => ws.map(w => `<i class="ln" style="width:${w}%"></i>`).join(''),
  chips: (arr, on = [], c = '') => arr.map(a => `<span class="chip ${c} ${on.includes(a) ? 'on' : ''}">${a}</span>`).join(''),
  ic: (c = '') => `<i class="ic ${c}"></i>`,
  mk: n => `<b class="mk">${n}</b>`,
  bar: (p, col = 'acc') => `<span class="bar"><i style="width:${Math.min(p, 100)}%;background:var(--${col})"></i></span>`,
  col: p => (p < 70 ? 'red' : p < 90 ? 'orange' : 'green'),
  cb: on => `<i class="cb ${on ? 'on' : ''}"></i>`,
  tg: on => `<i class="tg ${on ? 'on' : ''}"></i>`,
  field: (t, c = '') => `<div class="field ${c}">${t}</div>`,
  seg: (arr, on = 0, c = '') => `<div class="seg ${c}">${arr.map((a, i) => `<span class="${i === on ? 'on' : ''}">${a}</span>`).join('')}</div>`,
  bdg: (t, c = '') => `<span class="bdg ${c}">${t}</span>`,
  pct: (v, ref) => Math.round((v / ref) * 100),
  fmt: n => String(n).replace('.', ','),
};

/* ---------- Données d'exemple (un profil fictif) ---------- */
const D = {
  allergens: ['Gluten', 'Crustacés', 'Œufs', 'Poissons', 'Arachides', 'Soja', 'Lait', 'Fruits à coque', 'Céleri', 'Moutarde', 'Sésame', 'Sulfites', 'Lupin', 'Mollusques'],
  allergensOn: ['Fruits à coque', 'Sésame'],
  regimes: ['Végétarien', 'Végétalien', 'Sans viande', 'Sans porc', 'Sans alcool', 'Sans gluten', 'Sans lait'],
  regimesOn: ['Sans porc'],
  forbidden: ['Coriandre', 'Kiwi'],
  body: { age: 29, sexe: 'Femme', poids: 62, taille: 168, act: 'Modérée · 3 à 5 séances / sem.', bmr: 1364, k: '1,55', kcal: 2114 },
  refs: [
    ['Protéines', '51 g'], ['Glucides', '265 g'], ['Lipides', '70 g'], ['Fibres', '30 g'], ['Fer', '11 mg'],
    ['Calcium', '950 mg'], ['Magnésium', '300 mg'], ['Vitamine C', '110 mg'], ['Vitamine D', '15 µg'], ['Vitamine B12', '4 µg'],
  ],
  recipes: [
    { n: 'Curry de lentilles corail', t: 30, k: 520, ty: 'Plat', o: 'Indienne', s: 94 },
    { n: 'Gratin dauphinois', t: 75, k: 430, ty: 'Plat', o: 'Française', s: 91 },
    { n: 'Poulet rôti au citron', t: 60, k: 610, ty: 'Plat', o: 'Française', s: 88 },
    { n: 'Chili sin carne', t: 45, k: 480, ty: 'Plat', o: 'Mexicaine', s: 86 },
    { n: 'Risotto au potiron', t: 40, k: 540, ty: 'Plat', o: 'Italienne', s: 84 },
    { n: 'Salade de pois chiches', t: 15, k: 380, ty: 'Entrée', o: 'Libanaise', s: 83 },
    { n: 'Quiche aux poireaux', t: 55, k: 450, ty: 'Plat', o: 'Française', s: 82 },
    { n: 'Tarte aux pommes', t: 50, k: 340, ty: 'Dessert', o: 'Française', s: 80 },
  ],
  unverifiable: { n: 'Bo bun express', t: 25, k: 590, ty: 'Plat', o: 'Vietnamienne', why: '« sauce nems du commerce » : composition inconnue' },
  likes: [['Carotte', 'Légumes racines', 82], ['Lentille corail', 'Légumineuses', 76], ['Poulet', 'Volailles', 74], ['Pomme', 'Fruits', 70], ['Pomme de terre', 'Féculents', 68], ['Tomate', 'Légumes', 65], ['Riz basmati', 'Céréales', 60]],
  dislikes: [['Champignon de Paris', 'Champignons', -80], ['Betterave', 'Légumes racines', -60], ['Endive', 'Légumes', -55], ['Olive noire', 'Fruits gras', -40]],
  unsure: [['Fenouil', 'Légumes', 6], ['Aubergine', 'Légumes', 0], ['Tofu', 'Soja', -4]],
  unknown: [['Patate douce', 'Féculents', 44], ['Panais', 'Légumes racines', 38], ['Topinambour', 'Légumes racines', 30], ['Quinoa', 'Céréales', 25]],
  discover: [
    { n: 'Panais', why: 'carotte, navet', s: 38 },
    { n: 'Patate douce', why: 'pomme de terre, carotte', s: 44 },
    { n: 'Boulgour', why: 'riz basmati, semoule', s: 27 },
  ],
  discoverRecipes: [{ n: 'Velouté de panais', t: 35, k: 290 }, { n: 'Panais rôtis au miel', t: 40, k: 260 }, { n: 'Purée carotte-panais', t: 30, k: 310 }],
  ingredients: [
    ['Lentilles corail', '300 g', 'like'], ['Lait de coco', '40 cl', ''], ['Oignon', '1', 'like'], ['Ail', '2 gousses', ''],
    ['Tomates concassées', '400 g', 'like'], ['Pâte de curry', '2 c. à s.', 'comp'], ['Bouillon de légumes', '50 cl', 'comp'], ['Épinards', '100 g', 'unknown'],
  ],
  nutriRecipe: [['Énergie', '520 kcal', 25], ['Protéines', '22 g', 43], ['Fibres', '9 g', 30], ['Fer', '5,8 mg', 53], ['Magnésium', '96 mg', 32], ['Vitamine C', '24 mg', 22]],
  // [nom, unité, jour, moyenne 7 j, besoin]
  nutri: [
    ['Énergie', 'kcal', 1640, 1980, 2114], ['Protéines', 'g', 46, 55, 51], ['Glucides', 'g', 205, 240, 265], ['Lipides', 'g', 58, 66, 70],
    ['Fibres', 'g', 18, 19, 30], ['Fer', 'mg', 6.1, 7.4, 11], ['Calcium', 'mg', 720, 810, 950], ['Magnésium', 'mg', 200, 230, 300],
    ['Vitamine C', 'mg', 115, 98, 110], ['Vitamine D', 'µg', 2.1, 3, 15], ['Vitamine B12', 'µg', 3.8, 4.4, 4],
  ],
  watch: [
    { n: 'Vitamine D', p: 20, foods: 'sardine, maquereau, œuf', recipes: 'Sardines grillées, Omelette aux herbes' },
    { n: 'Fibres', p: 63, foods: 'haricots rouges, poire, flocons d’avoine', recipes: 'Chili sin carne, Porridge poire' },
    { n: 'Fer', p: 67, foods: 'lentilles, pois chiches, épinards', recipes: 'Curry de lentilles corail' },
  ],
  journal: [['Flocons d’avoine', '60 g', 225], ['Lait demi-écrémé', '200 g', 92], ['Curry de lentilles corail', '1,5 portion', 780], ['Pomme', '150 g', 78], ['Poulet rôti au citron', '½ portion', 305], ['Yaourt nature', '125 g', 160]],
  week: [['L', 9], ['M', 10], ['M', 11], ['J', 12], ['V', 13], ['S', 14], ['D', 15]],
  shopping: [
    ['Fruits & légumes', [['Oignon', '3', '2 recettes', 1], ['Ail', '4 gousses', '2 recettes', 0], ['Épinards', '200 g', '', 0], ['Bananes', '6', 'base', 1]]],
    ['Épicerie', [['Lentilles corail', '600 g', '', 0], ['Tomates concassées', '3 boîtes', '2 recettes', 1], ['Lait de coco', '80 cl', '', 0], ['Haricots rouges', '1 boîte', '', 0]]],
    ['Frais', [['Lait demi-écrémé', '2 L', 'base', 0], ['Œufs', '12', 'base', 0], ['Yaourts nature', '8', 'base', 0]]],
    ['Boulangerie', [['Pain complet', '1', 'manuel', 0]]],
  ],
  always: ['Lait demi-écrémé', 'Œufs', 'Pain complet', 'Bananes', 'Yaourts nature', 'Café'],
  web: [
    { n: 'Lasagnes végétariennes', src: 'marmiton.org', st: 'ok', info: '1 inconnu : ricotta' },
    { n: 'Lasagnes à la bolognaise', src: '750g.com', st: 'ok', info: '' },
    { n: 'Lasagnes aux champignons', src: 'cuisineaz.com', st: 'dislike', info: '1 je n’aime pas : champignon' },
    { n: 'Lasagnes express', src: 'journaldesfemmes.fr', st: 'unv', info: '« sauce tomate cuisinée » : composition inconnue' },
  ],
  webQuery: ['-porc', '-noix', '-cajou', '-sésame', '-coriandre', '-kiwi'],
  sources: ['Marmiton', '750g', 'Cuisine AZ', 'Journal des Femmes', 'Ricardo'],
};

/* Petits blocs réutilisés (le style change avec chaque variante) */
const B = {
  ingMark: m => m === 'like' ? H.bdg('♥ aimé', 'green') : m === 'unknown' ? H.bdg('? inconnu') : m === 'comp' ? H.bdg('composé ✓', 'acc') : '',
  webBadges: w => (w.st === 'ok' ? H.bdg('✓ Compatible', 'green') : w.st === 'dislike' ? H.bdg('✓ Compatible', 'green') : '') +
    (w.st === 'unv' ? H.bdg('⚠ Impossible à vérifier', 'red') : '') +
    (w.info && w.st !== 'unv' ? ' ' + H.bdg(w.info, w.st === 'dislike' ? 'orange' : '') : ''),
  score: s => `<span class="bdg ${s > 0 ? 'green' : s < 0 ? 'red' : ''}">${s > 0 ? '+' : ''}${s}</span>`,
  nutriRow: (r, which = 2) => { const p = H.pct(r[which], r[4]); return { name: r[0], val: `${H.fmt(r[which])} ${r[1]}`, ref: `${H.fmt(r[4])} ${r[1]}`, p, c: H.col(p) }; },
  legend: () => `<div class="row wrap g12 xs mut"><span class="row g4"><i class="dot red"></i>&lt; 70 %</span><span class="row g4"><i class="dot orange"></i>70 – 89 %</span><span class="row g4"><i class="dot green"></i>≥ 90 %</span></div>`,
};

/* ---------- Rendu de la page ---------- */
const WF = {
  render(V, screens) {
    const pad = n => String(n).padStart(2, '0');
    // ?ecran=journal → n'affiche qu'un écran (pratique pour partager ou capturer)
    const only = new URLSearchParams(location.search).get('ecran');
    if (only) { screens = screens.filter(s => s.id === only); document.body.classList.add('pg-only'); }
    const wrap = (s, m) => {
      const html = typeof s.html === 'function' ? s.html(m) : s.html;
      return s.tab === null ? html : V.shell(html, m, s.tab);
    };
    const variants = [['index.html', 'Accueil'], ['a.html', 'A · Tableau de bord'], ['b.html', 'B · Vitrine'], ['c.html', 'C · Carnet']];
    document.body.insertAdjacentHTML('afterbegin', `
      <header class="pg-top">
        <a class="pg-brand" href="../index.html">Papille <span>· wireframes</span></a>
        <nav class="pg-seg">${variants.slice(1).map(([h, l]) => `<a href="${h}" class="${h.startsWith(V.key) ? 'on' : ''}">${l}</a>`).join('')}</nav>
        <div class="pg-seg" id="view"><button data-v="both" class="on">Les deux</button><button data-v="m">Téléphone</button><button data-v="d">Ordinateur</button></div>
      </header>
      <section class="pg-intro">
        <div>
          <div class="pg-kicker">Proposition ${V.letter} · ${screens.length} écrans</div>
          <h1>${V.name}</h1>
          <p>${V.desc}</p>
          <div class="pg-legend">
            <span><b class="mk">1</b> repère → note de l’écran</span>
            <span><span class="bdg red">⚠</span> sécurité alimentaire</span>
            <span><span class="ph" style="width:26px;height:18px;border-radius:4px"></span> image</span>
          </div>
        </div>
        <div class="pg-box">
          <h3>Inspirations</h3><ul>${V.refs.map(r => `<li>${r}</li>`).join('')}</ul>
          <h3>Gestes signature</h3><ul>${V.moves.map(r => `<li>${r}</li>`).join('')}</ul>
        </div>
      </section>
      <div class="pg-layout">
        <nav class="pg-index">${screens.map((s, i) => `<a href="#${s.id}"><span>${pad(i + 1)}</span>${s.title}</a>`).join('')}</nav>
        <main>${screens.map((s, i) => `
          <section class="pg-screen" id="${s.id}">
            <header class="pg-sh"><span class="pg-num">${pad(i + 1)}</span><h2>${s.title}</h2></header>
            <ol class="pg-notes">${s.notes.map(n => `<li><span>${n}</span></li>`).join('')}</ol>
            <div class="pg-frames">
              <div class="pg-fm"><div class="pg-cap">Téléphone · 390 px</div>
                <figure class="dev m"><div class="sb"><span>9:41</span><i></i><b></b></div><div class="app is-m">${wrap(s, 'm')}</div></figure></div>
              <div class="pg-fd"><div class="pg-cap">Ordinateur · 1280 px (réduit)</div>
                <figure class="dev d"><div class="dwrap"><div class="dscale"><div class="bb"><i></i><i></i><i></i><span>gatiencaillet.github.io/papille/#/${s.id}</span></div><div class="app is-d">${wrap(s, 'd')}</div></div></div></figure></div>
            </div>
          </section>`).join('')}
        </main>
      </div>`);

    const fit = () => document.querySelectorAll('.dwrap').forEach(w => {
      const s = w.firstElementChild, k = Math.min(1, w.clientWidth / 1280);
      s.style.transform = `scale(${k})`;
      w.style.height = Math.ceil(s.offsetHeight * k) + 'px';
    });
    const setView = v => {
      document.body.dataset.view = v;
      document.querySelectorAll('#view button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
      try { localStorage.setItem('papille-wf-view', v); } catch (e) {}
      fit();
    };
    document.getElementById('view').addEventListener('click', e => { if (e.target.dataset.v) setView(e.target.dataset.v); });
    let saved = 'both';
    try { saved = localStorage.getItem('papille-wf-view') || 'both'; } catch (e) {}
    setView(saved);
    addEventListener('resize', fit);
    if (document.fonts) document.fonts.ready.then(fit);
    addEventListener('load', fit);
  },
};
