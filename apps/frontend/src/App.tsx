import { useState } from "react";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import type { User } from "./types/user";

const defaultUser: User = {
  name: "Eden Siterkol",
  email: "eden@example.com",
};

export function App() {
  const [screen, setScreen] = useState<"landing" | "dashboard">("landing");
  const [user, setUser] = useState<User>(defaultUser);

  if (screen === "dashboard") {
    return (
      <DashboardPage
        user={user}
        onLogout={() => setScreen("landing")}
      />
    );
  }

  return (
    <LandingPage
      onAuthenticated={(nextUser) => {
        setUser(nextUser);
        setScreen("dashboard");
      }}
    />
  );
}
