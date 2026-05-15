import { LogOutIcon, UserIcon } from "../icons";
import type { User } from "../../types/user";

type UserMenuProps = {
  user: User;
  onLogout: () => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  return (
    <div className="flex max-w-[min(100%,18rem)] items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 shadow-sm sm:max-w-none sm:gap-3 sm:py-2 sm:pl-2 sm:pr-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-semibold text-white sm:size-10 sm:text-sm"
        aria-hidden
      >
        {initials(user.name) || <UserIcon className="size-4 text-white" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{user.email}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="flex size-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Log out"
      >
        <LogOutIcon className="size-[18px]" />
      </button>
    </div>
  );
}
