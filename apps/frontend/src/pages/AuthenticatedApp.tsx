import { useState } from "react";
import type { NavItemId } from "../components/dashboard/DashboardNav";
import { DashboardLayout } from "../layouts/DashboardLayout";
import type { User } from "../types/user";
import { DashboardPage } from "./DashboardPage";
import { ProfilePage } from "./ProfilePage";

type AuthenticatedAppProps = {
  user: User;
  onLogout: () => void;
};

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:rounded-3xl">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Coming soon.</p>
    </section>
  );
}

export function AuthenticatedApp({ user, onLogout }: AuthenticatedAppProps) {
  const [route, setRoute] = useState<NavItemId>("dashboard");

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      activeId={route}
      onNavigate={setRoute}
    >
      {route === "dashboard" && <DashboardPage />}
      {route === "profile" && <ProfilePage />}
      {route === "scan" && <PlaceholderPage title="Scan Meal" />}
      {route === "history" && <PlaceholderPage title="History" />}
    </DashboardLayout>
  );
}
