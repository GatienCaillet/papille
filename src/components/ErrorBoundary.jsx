import { Component } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';

/** Évite la page blanche : en cas d'erreur, on affiche ce qui s'est passé et un moyen de repartir. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Papille a rencontré une erreur', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="splash" role="alert" style={{ padding: 24, textAlign: 'center' }}>
        <span className="sent-ic" style={{ background: 'var(--bad-soft)', color: 'var(--bad)' }}><TriangleAlert size={26} /></span>
        <h1 className="h2">Un problème est survenu</h1>
        <p className="sub" style={{ maxWidth: '46ch' }}>Vos données enregistrées ne sont pas perdues. Rechargez la page pour reprendre.</p>
        <code className="xs muted" style={{ maxWidth: '60ch', overflowWrap: 'anywhere' }}>{String(error?.message || error)}</code>
        <button type="button" className="btn btn-primary" onClick={() => { window.location.hash = '#/recettes'; window.location.reload(); }}>
          <RotateCcw size={16} /> Recharger
        </button>
      </div>
    );
  }
}
