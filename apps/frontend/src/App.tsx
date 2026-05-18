import { useAuth } from "./auth/AuthContext";
import { AuthenticatedApp } from "./pages/AuthenticatedApp";
import { LandingPage } from "./pages/LandingPage";

export function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) return <LandingPage />;
  return <AuthenticatedApp user={user} onLogout={logout} />;
}
