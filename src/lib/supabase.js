import { createClient } from '@supabase/supabase-js';

// Clé publiable : publique par conception. La sécurité repose sur les règles RLS
// de la base (chaque utilisateur ne lit et n'écrit que ses propres lignes).
const URL = 'https://eccernutbnunvydpfybt.supabase.co';
const KEY = 'sb_publishable_otSIRx0CKtPrmp3KihgsNw_2mLT-gJl';

// Verrou de session propre à l'onglet : les demandes attendent leur tour au lieu d'échouer.
// Remplace le verrou Navigator LockManager, qui lève « … immediately failed » sur Firefox.
const queues = new Map();
async function tabLock(name, _acquireTimeout, fn) {
  const previous = queues.get(name) || Promise.resolve();
  let release;
  const mine = new Promise(resolve => { release = resolve; });
  const tail = previous.then(() => mine);
  queues.set(name, tail);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (queues.get(name) === tail) queues.delete(name);
  }
}

export const supabase = createClient(URL, KEY, {
  auth: {
    lock: tabLock,
    flowType: 'pkce', // le lien de confirmation revient avec ?code=…, sans conflit avec le routage par #
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Adresse de retour des e-mails (confirmation d'inscription). */
export const redirectUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

const MESSAGES = [
  [/invalid login credentials/i, 'E-mail ou mot de passe incorrect.'],
  [/email not confirmed/i, 'Confirmez d’abord votre e-mail : le lien est dans votre boîte de réception.'],
  [/already registered|already been registered/i, 'Un compte existe déjà avec cet e-mail. Connectez-vous.'],
  [/rate limit|too many/i, 'Trop de tentatives. Réessayez dans quelques minutes.'],
  [/password should be at least/i, 'Le mot de passe est trop court.'],
  [/failed to fetch|network/i, 'Connexion impossible. Vérifiez votre réseau.'],
];
export function frError(error) {
  const msg = error?.message || String(error || '');
  return MESSAGES.find(([re]) => re.test(msg))?.[1] || `Erreur : ${msg}`;
}
