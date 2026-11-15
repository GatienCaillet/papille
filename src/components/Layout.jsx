import { useMemo } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowRight, BookOpen, Compass, Heart, NotebookPen, ShoppingBasket } from 'lucide-react';
import { useStore } from '../store.jsx';
import { RECIPE } from '../data/recipes.js';
import { FOOD } from '../data/foods.js';
import { addDays, buildShopping, dayKey, entryVector, listFr, needs, NUTRIENTS, sumVectors, today } from '../lib/logic.js';
import { Toast } from './ui.jsx';

const NAV = [
  ['/recettes', 'Recettes', BookOpen],
  ['/decouvrir', 'Découvrir', Compass],
  ['/gouts', 'Goûts', Heart],
  ['/journal', 'Journal', NotebookPen],
  ['/courses', 'Courses', ShoppingBasket],
];

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 21c-4.4 0-8-3.4-8-8.6C4 7 8 3 12 3s8 4 8 9.4c0 5.2-3.6 8.6-8 8.6Z" />
          <path d="M12 7v10M8.5 10.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
        </svg>
      </span>
      papille
    </span>
  );
}

/** Nutriments sous 70 % du besoin, en moyenne sur 7 jours. */
export function useWatch() {
  const { state } = useStore();
  return useMemo(() => {
    const ref = needs(state.profile);
    const t = today();
    const logged = Array.from({ length: 7 }, (_, i) => state.journal[dayKey(addDays(t, -i))] || []);
    // Pas d'alerte avant 3 jours notés : une moyenne sur des jours vides n'a pas de sens
    if (logged.filter(d => d.length).length < 3) return [];
    const days = logged.map(entries => sumVectors(entries.map(e => entryVector(e, FOOD, RECIPE))));
    const avg = sumVectors(days).map(v => v / 7);
    return NUTRIENTS.map(n => ({ ...n, value: avg[n.i], pct: Math.round((avg[n.i] / ref[n.i]) * 100) })).filter(n => n.pct < 70).sort((a, b) => a.pct - b.pct);
  }, [state.journal, state.profile]);
}

export default function Layout() {
  const { state } = useStore();
  const watch = useWatch();
  const shoppingCount = useMemo(
    () => buildShopping(state.shopping, RECIPE).reduce((n, g) => n + g.items.filter(i => !i.checked).length, 0),
    [state.shopping],
  );

  return (
    <div className="shell">
      <aside className="side" aria-label="Navigation principale">
        <Logo />
        <p className="side-tag">Ce qui vous plaît, sans risque.</p>
        {state.mode === 'demo' && <span className="badge badge-warn mode-badge">Démo · données fictives</span>}
        <nav className="stack" style={{ gap: 2 }}>
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className="nav-link">
              <Icon size={19} strokeWidth={1.8} />
              {label}
              {to === '/courses' && shoppingCount > 0 && <span className="count num">{shoppingCount}</span>}
            </NavLink>
          ))}
        </nav>
        {watch.length > 0 && (
          <div className="side-watch">
            <h3>À surveiller cette semaine</h3>
            <p>{(s => s[0].toUpperCase() + s.slice(1))(listFr(watch.slice(0, 3).map(w => w.label[0].toLowerCase() + w.label.slice(1))))}</p>
            <Link to="/journal">Voir le journal <ArrowRight size={14} /></Link>
          </div>
        )}
        <NavLink to="/profil" className="nav-link side-profile">
          <span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>GC</span>
          Profil
        </NavLink>
      </aside>

      <main className="main" id="contenu">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Navigation principale">
        {NAV.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} className="tab">
            <span className="tab-ic"><Icon size={21} strokeWidth={1.8} /></span>
            {label}
          </NavLink>
        ))}
      </nav>
      <Toast />
    </div>
  );
}
