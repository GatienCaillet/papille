import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store.jsx';
import { Logo } from '../components/Layout.jsx';
import { Img, Segmented } from '../components/ui.jsx';

export default function Login() {
  const { signIn, notify } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState('in');
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');

  const submit = e => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Cette adresse e-mail ne semble pas valide.');
    if (pw.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (mode === 'up' && pw !== pw2) return setError('Les deux mots de passe ne correspondent pas.');
    signIn();
    if (mode === 'up') {
      notify('Compte créé. Commencez par vos allergies et régimes.');
      nav('/profil');
    } else nav('/recettes');
  };

  return (
    <div className="login">
      <div className="login-art">
        <Img id="1490645935967-10de6ba17061" alt="Table garnie de plats colorés" w={900} eager />
        <div className="login-quote">
          <Logo />
          <p>Mangez ce que vous aimez, sans jamais risquer ce que vous ne pouvez pas manger.</p>
        </div>
      </div>

      <form className="login-form" onSubmit={submit} noValidate>
        <div className="mobile-only"><Logo /></div>
        <div>
          <h1>{mode === 'in' ? 'Bon retour' : 'Créer un compte'}</h1>
          <p className="sub" style={{ marginTop: 6 }}>{mode === 'in' ? 'Vos goûts et votre journal vous attendent.' : 'Deux minutes pour un profil sûr, ensuite on swipe.'}</p>
        </div>
        <Segmented block label="Connexion ou inscription" options={[['in', 'Connexion'], ['up', 'Inscription']]} value={mode} onChange={v => { setMode(v); setError(''); }} />
        <label className="field">
          <span>E-mail</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.fr" />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <span className="input-wrap">
            <input className="input" style={{ paddingLeft: 14, paddingRight: 46 }} type={show ? 'text' : 'password'} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="8 caractères minimum" />
            <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ position: 'absolute', right: 4 }} onClick={() => setShow(s => !s)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>
        {mode === 'up' && (
          <label className="field">
            <span>Confirmer le mot de passe</span>
            <input className="input" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} />
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-lg btn-block" type="submit">{mode === 'in' ? 'Se connecter' : 'Créer mon compte'}</button>
        <p className="xs muted">Maquette : aucune donnée n’est envoyée, tout reste dans ce navigateur.</p>
      </form>
    </div>
  );
}
