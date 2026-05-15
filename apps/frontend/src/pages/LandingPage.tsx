import { useState, type ReactNode } from "react";
import { GoogleIcon } from "../components/GoogleIcon";
import { Logo } from "../components/Logo";
import { TextField } from "../components/TextField";
import { AppLayout } from "../layouts/AppLayout";

type MobileAuthTab = "login" | "register";

const navButtonClass =
  "inline-flex min-h-11 min-w-[4.5rem] touch-manipulation items-center justify-center rounded-lg px-3 text-sm font-medium transition sm:px-4";

export function LandingPage() {
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
              <LoginForm />
            </AuthCard>

            <AuthCard
              title="Create account"
              className={mobileTab === "register" ? "block" : "hidden md:block"}
            >
              <RegisterForm />
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

function LoginForm() {
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <TextField
        id="login-email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
      />
      <TextField
        id="login-password"
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
        className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  );
}

function RegisterForm() {
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <TextField
        id="register-name"
        label="Full name"
        type="text"
        placeholder="name"
        autoComplete="name"
      />
      <TextField
        id="register-email"
        label="Email"
        type="email"
        placeholder="email@example.com"
        autoComplete="email"
      />
      <TextField
        id="register-password"
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
