import type { ReactNode } from "react";
import { Logo } from "../components/Logo";
import { DashboardNav, type NavItemId } from "../components/dashboard/DashboardNav";
import { UserMenu } from "../components/dashboard/UserMenu";
import type { User } from "../types/user";

type DashboardLayoutProps = {
  user: User;
  onLogout: () => void;
  activeId: NavItemId;
  onNavigate: (id: NavItemId) => void;
  children: ReactNode;
};

export function DashboardLayout({
  user,
  onLogout,
  activeId,
  onNavigate,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/80 text-slate-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <UserMenu user={user} onLogout={onLogout} />
        </header>

        <div className="mt-6 flex flex-1 flex-col gap-6 lg:mt-8 lg:flex-row lg:gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <DashboardNav variant="sidebar" activeId={activeId} onNavigate={onNavigate} />
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <DashboardNav variant="bottom" activeId={activeId} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
