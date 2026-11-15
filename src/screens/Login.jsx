import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MailCheck } from 'lucide-react';
import { useStore } from '../store.jsx';
import { frError, redirectUrl, supabase } from '../lib/supabase.js';
import { Logo } from '../components/Layout.jsx';
import { Img, Segmented } from '../components/ui.jsx';

export default function Login() {
  const { startDemo, notify } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState('in');
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Cette adresse e-mail ne semble pas valide.');
    if (pw.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (mode === 'up' && pw !== pw2) return setError('Les deux mots de passe ne correspondent pas.');
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (err) throw err;
        nav('/recettes');
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: redirectUrl() } });
        if (err) throw err;
        if (data.session) {
          notify('Compte créé. Commencez par vos allergies et régimes.');
          nav('/profil');
        } else setSent(true);
      }
    } catch (err) {
      setError(frError(err));
    } finally {
      setBusy(false);
    }
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

      {sent ? (
        <div className="login-form" role="status">
          <span className="sent-ic"><MailCheck size={26} /></span>
          <h1>Vérifiez vos e-mails</h1>
          <p className="sub">Un lien de confirmation vient de partir vers <b>{email}</b>. Ouvrez-le sur cet appareil : vous arriverez connecté, prêt à remplir votre profil.</p>
          <button type="button" className="btn btn-block" onClick={() => { setSent(false); setMode('in'); }}>Retour à la connexion</button>
          <p className="xs muted">Rien reçu ? Regardez les indésirables, puis réessayez dans quelques minutes.</p>
        </div>
      ) : (
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
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            {busy ? 'Un instant…' : mode === 'in' ? 'Se connecter' : 'Créer mon compte'}
          </button>
          <div className="or"><span>ou</span></div>
          <button type="button" className="btn btn-soft btn-block" onClick={() => { startDemo(); nav('/recettes'); }}>Essayer la démo sans compte</button>
          <p className="xs muted">La démo utilise un profil fictif et reste dans ce navigateur.</p>
        </form>
      )}
    </div>
  );
}
