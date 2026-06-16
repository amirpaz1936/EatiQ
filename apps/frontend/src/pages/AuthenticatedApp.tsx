import { useState } from "react";
import type { NavItemId } from "../components/dashboard/DashboardNav";
import { DashboardLayout } from "../layouts/DashboardLayout";
import type { User } from "../types/user";
import { DashboardPage } from "./DashboardPage";
import { HistoryPage } from "./HistoryPage";
import { ProfilePage } from "./ProfilePage";
import { ScanMealPage } from "./ScanMealPage";

type AuthenticatedAppProps = {
  user: User;
  onLogout: () => void;
};

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
      {route === "scan" && <ScanMealPage />}
      {route === "history" && <HistoryPage />}
    </DashboardLayout>
  );
}
