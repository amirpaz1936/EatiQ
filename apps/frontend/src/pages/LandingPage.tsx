import { useState, type FormEvent, type ReactNode } from "react";
import { GoogleIcon } from "../components/GoogleIcon";
import { Logo } from "../components/Logo";
import { TextField } from "../components/TextField";
import { AppLayout } from "../layouts/AppLayout";
import type { User } from "../types/user";

type MobileAuthTab = "login" | "register";

const navButtonClass =
  "inline-flex min-h-11 min-w-[4.5rem] touch-manipulation items-center justify-center rounded-lg px-3 text-sm font-medium transition sm:px-4";

type LandingPageProps = {
  onAuthenticated: (user: User) => void;
};

export function LandingPage({ onAuthenticated }: LandingPageProps) {
  const [mobileTab, setMobileTab] = useState<MobileAuthTab>("login");

  return (
    <AppLayout>
      <header className="flex items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            className={`${navButtonClass} border border-slate-200 bg-white text-slate-900 hover:bg-slate-50`}
          >
            Login
          </button>
          <button
            type="button"
            className={`${navButtonClass} bg-slate-900 text-white hover:bg-slate-800`}
          >
            Register
          </button>
        </nav>
      </header>

      <main className="mt-6 flex flex-1 flex-col sm:mt-8">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8 lg:p-10">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
              Welcome to EatiQ
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
              Sign in to track meals, scan food images, and get personalized
              recommendations.
            </p>
          </div>

          <div
            className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 md:hidden"
            role="tablist"
            aria-label="Authentication"
          >
            <MobileTabButton
              active={mobileTab === "login"}
              onClick={() => setMobileTab("login")}
            >
              Login
            </MobileTabButton>
            <MobileTabButton
              active={mobileTab === "register"}
              onClick={() => setMobileTab("register")}
            >
              Create account
            </MobileTabButton>
          </div>

          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <AuthCard
              title="Login"
              className={mobileTab === "login" ? "block" : "hidden md:block"}
            >
              <LoginForm onAuthenticated={onAuthenticated} />
            </AuthCard>

            <AuthCard
              title="Create account"
              className={mobileTab === "register" ? "block" : "hidden md:block"}
            >
              <RegisterForm onAuthenticated={onAuthenticated} />
            </AuthCard>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}

function MobileTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-11 touch-manipulation rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function LoginForm({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim() || "eden@example.com";
    const localPart = email.split("@")[0] ?? "User";
    const name = localPart
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    onAuthenticated({ name: name || "Eden Siterkol", email });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField
        id="login-email"
        name="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
      />
      <TextField
        id="login-password"
        name="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
      />
      <button
        type="submit"
        className="mt-1 min-h-11 w-full touch-manipulation rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Login
      </button>
      <button
        type="button"
        onClick={() =>
          onAuthenticated({ name: "Eden Siterkol", email: "eden@example.com" })
        }
        className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  );
}

function RegisterForm({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim() || "Eden Siterkol";
    const email = String(data.get("email") ?? "").trim() || "eden@example.com";
    onAuthenticated({ name, email });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField
        id="register-name"
        name="name"
        label="Full name"
        type="text"
        placeholder="Eden S."
        autoComplete="name"
      />
      <TextField
        id="register-email"
        name="email"
        label="Email"
        type="email"
        placeholder="eden@example.com"
        autoComplete="email"
      />
      <TextField
        id="register-password"
        name="password"
        label="Password"
        type="password"
        placeholder="Min 6 chars"
        autoComplete="new-password"
      />
      <button
        type="submit"
        className="mt-1 min-h-11 w-full touch-manipulation rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Register
      </button>
    </form>
  );
}

function AuthCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 ${className}`}
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </article>
  );
}
