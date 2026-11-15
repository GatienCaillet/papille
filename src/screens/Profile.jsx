import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, RotateCcw, ShieldCheck } from 'lucide-react';
import { useStore } from '../store.jsx';
import { ACTIVITIES, ALLERGENS, bmr, catalog, fmt, needs, NUTRIENTS, outOfRange, profileComplete, RANGES, REGIMES } from '../lib/logic.js';
import { Chip, PageHeader, Segmented } from '../components/ui.jsx';

function Num({ label, field, value, unit, onChange }) {
  const [min, max] = RANGES[field];
  const bad = outOfRange(field, value);
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        <input className={`input num ${bad ? 'is-bad' : ''}`} style={{ paddingLeft: 14 }} type="number" inputMode="numeric" min={min} max={max} value={value}
          aria-invalid={bad} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
        <span className="suffix">{unit}</span>
      </span>
      {bad && <em className="field-hint">Entre {min} et {max} {unit}</em>}
    </label>
  );
}

export default function Profile() {
  const store = useStore();
  const { state, toggleProfile, setProfile, signOut, resetDemo, notify } = store;
  const p = state.profile;
  const nav = useNavigate();
  const [forb, setForb] = useState('');
  const ok = profileComplete(p);
  const ref = ok ? needs(p) : null;
  const act = ACTIVITIES.find(a => a.id === p.activity);
  const { excluded } = catalog(state);

  const addForbidden = () => {
    const v = forb.trim();
    if (!v) return;
    if (!p.forbidden.some(f => f.toLowerCase() === v.toLowerCase())) setProfile({ forbidden: [...p.forbidden, v[0].toUpperCase() + v.slice(1)] });
    setForb('');
  };

  return (
    <>
      <PageHeader title="Profil" sub="Ce que vous ne mangez jamais, et ce dont votre corps a besoin." />

      <div className="profile-grid">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card card-pad stack">
            <div className="row between"><h2>Allergies</h2><span className="small muted num">{p.allergens.length} sur 14</span></div>
            <div className="row row-wrap" style={{ gap: 6 }}>
              {ALLERGENS.map(a => <Chip key={a} on={p.allergens.includes(a)} onClick={() => toggleProfile('allergens', a)}>{a}</Chip>)}
            </div>
          </section>

          <section className="card card-pad stack">
            <h2>Régimes</h2>
            <div className="row row-wrap" style={{ gap: 6 }}>
              {REGIMES.map(a => <Chip key={a} on={p.regimes.includes(a)} onClick={() => toggleProfile('regimes', a)}>{a}</Chip>)}
            </div>
          </section>

          <section className="card card-pad stack">
            <h2>Aliments interdits</h2>
            <form className="row" onSubmit={e => { e.preventDefault(); addForbidden(); }}>
              <input className="input grow" value={forb} onChange={e => setForb(e.target.value)} placeholder="Un aliment : céleri, kiwi…" aria-label="Ajouter un aliment interdit" />
              <button className="btn" type="submit" disabled={!forb.trim()}>Ajouter</button>
            </form>
            {p.forbidden.length > 0 && (
              <div className="row row-wrap" style={{ gap: 6 }}>
                {p.forbidden.map(f => <Chip key={f} removable onClick={() => setProfile({ forbidden: p.forbidden.filter(x => x !== f) })}>{f}</Chip>)}
              </div>
            )}
          </section>

          <div className="safety-note">
            <ShieldCheck size={20} />
            <div>
              <b>{excluded.length} recette{excluded.length > 1 ? 's' : ''} exclue{excluded.length > 1 ? 's' : ''} par ce profil</b>, ingrédients cachés compris (pesto, tahini, bouillon…).
              <span className="block muted small">En cas d’allergie, vérifiez toujours l’étiquette : un produit peut contenir des traces.</span>
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <section className="card card-pad stack" style={{ gap: 14 }}>
            <h2>Mon corps</h2>
            <div className="body-grid">
              <Num label="Âge" field="age" value={p.age} unit="ans" onChange={v => setProfile({ age: v })} />
              <div className="field"><span>Sexe</span><Segmented block label="Sexe" options={[['F', 'Femme'], ['H', 'Homme']]} value={p.sex} onChange={v => setProfile({ sex: v })} /></div>
              <Num label="Poids" field="weight" value={p.weight} unit="kg" onChange={v => setProfile({ weight: v })} />
              <Num label="Taille" field="height" value={p.height} unit="cm" onChange={v => setProfile({ height: v })} />
            </div>
            <fieldset className="activity">
              <legend>Activité</legend>
              {ACTIVITIES.map(a => (
                <label key={a.id} className={`act ${p.activity === a.id ? 'is-on' : ''}`}>
                  <input type="radio" name="activity" checked={p.activity === a.id} onChange={() => setProfile({ activity: a.id })} />
                  <b>{a.label}</b><span>{a.hint}</span>
                </label>
              ))}
            </fieldset>
            {ok ? (
              <div className="need">
                <span className="need-num num">{fmt(ref[0])} <small>kcal par jour</small></span>
                <span className="small">Mifflin-St Jeor : {fmt(bmr(p))} kcal au repos × {String(act.k).replace('.', ',')} pour l’activité.</span>
              </div>
            ) : <p className="form-error">Renseignez âge, poids et taille pour calculer vos besoins.</p>}
          </section>

          {ok && (
            <section className="card card-pad stack">
              <h2>Mes références par jour</h2>
              <table className="tbl">
                <tbody>
                  {NUTRIENTS.slice(1).map(n => <tr key={n.key}><td>{n.label}</td><td className="num right b">{fmt(ref[n.i])} {n.unit}</td></tr>)}
                </tbody>
              </table>
              <p className="xs muted">Base des couleurs du journal. Repères ANSES pour un adulte.</p>
            </section>
          )}

          <section className="card card-pad stack" style={{ gap: 12 }}>
            <h2>Compte</h2>
            <p className="small" style={{ color: 'var(--ink-2)' }}>
              {state.mode === 'cloud'
                ? <>Connecté avec <b>{state.user.email}</b>. Vos réponses sont enregistrées sur votre compte.</>
                : 'Mode démo : profil fictif, enregistré seulement dans ce navigateur.'}
            </p>
            <div className="row row-wrap" style={{ gap: 8 }}>
              <button className="btn" type="button" onClick={async () => { await signOut(); nav('/connexion'); }}><LogOut size={16} /> {state.mode === 'cloud' ? 'Se déconnecter' : 'Quitter la démo'}</button>
              {state.mode === 'demo' && <button className="btn btn-ghost" type="button" onClick={() => { resetDemo(); notify('Démo remise à zéro.'); }}><RotateCcw size={16} /> Réinitialiser la démo</button>}
            </div>
            <Link to="/credits" className="small link">Crédits des données et des photos</Link>
          </section>
        </div>
      </div>
    </>
  );
}
