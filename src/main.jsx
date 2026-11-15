import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/figtree';
import './styles/app.css';
import './styles/screens.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { loadCiqual, loadFoods } from './data/foods.js';
import { loadRecipes } from './data/recipes.js';

const root = createRoot(document.getElementById('root'));
const render = node => root.render(<StrictMode><ErrorBoundary>{node}</ErrorBoundary></StrictMode>);

// Le référentiel d'aliments et la table CIQUAL sont nécessaires à tous les écrans (sécurité, apports).
Promise.all([loadFoods(), loadCiqual(), loadRecipes()])
  .then(() => render(<App />))
  .catch(e => render(<LoadError message={e.message} />));

function LoadError({ message }) {
  return (
    <div className="splash" role="alert" style={{ padding: 24, textAlign: 'center' }}>
      <h1 className="h2">Les données d’aliments n’ont pas pu être chargées</h1>
      <p className="sub">{message}. Vérifiez votre connexion puis rechargez la page.</p>
      <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Recharger</button>
    </div>
  );
}
