import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store.jsx';
import Layout, { Logo } from './components/Layout.jsx';
import Login from './screens/Login.jsx';
import Profile from './screens/Profile.jsx';
import Swipe from './screens/Swipe.jsx';
import Tastes from './screens/Tastes.jsx';
import Recipes from './screens/Recipes.jsx';
import RecipeDetail from './screens/RecipeDetail.jsx';
import AddRecipe from './screens/AddRecipe.jsx';
import Discover from './screens/Discover.jsx';
import Journal from './screens/Journal.jsx';
import Shopping from './screens/Shopping.jsx';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Splash() {
  return <div className="splash" role="status"><Logo /><span className="small muted">Chargement de vos données…</span></div>;
}

function Guard({ children }) {
  const { state, ready } = useStore();
  if (!ready && state.mode !== 'demo') return <Splash />;
  return state.mode ? children : <Navigate to="/connexion" replace />;
}

function LoginRoute() {
  const { state, ready } = useStore();
  if (!ready && !state.mode) return <Splash />;
  return state.mode ? <Navigate to="/recettes" replace /> : <Login />;
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollTop />
        <Routes>
          <Route path="/connexion" element={<LoginRoute />} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route index element={<Navigate to="/recettes" replace />} />
            <Route path="/recettes" element={<Recipes />} />
            <Route path="/recettes/ajouter" element={<AddRecipe />} />
            <Route path="/recettes/:id" element={<RecipeDetail />} />
            <Route path="/decouvrir" element={<Discover />} />
            <Route path="/gouts" element={<Swipe />} />
            <Route path="/gouts/listes" element={<Tastes />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/courses" element={<Shopping />} />
            <Route path="/profil" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/recettes" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
