import { useState } from "react";
import { AuthenticatedApp } from "./pages/AuthenticatedApp";
import { LandingPage } from "./pages/LandingPage";
import type { User } from "./types/user";

const defaultUser: User = {
  name: "name",
  email: "email@example.com",
};

export function App() {
  const [screen, setScreen] = useState<"landing" | "dashboard">("landing");
  const [user, setUser] = useState<User>(defaultUser);

  if (screen === "dashboard") {
    return <AuthenticatedApp user={user} onLogout={() => setScreen("landing")} />;
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
