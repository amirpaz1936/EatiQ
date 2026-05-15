import {
  CameraIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  UserIcon,
} from "../icons";

export type NavItemId = "dashboard" | "scan" | "profile" | "history";

const navItems: {
  id: NavItemId;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboardIcon;
}[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboardIcon },
  { id: "scan", label: "Scan Meal", shortLabel: "Scan", icon: CameraIcon },
  { id: "profile", label: "Profile", shortLabel: "Profile", icon: UserIcon },
  { id: "history", label: "History", shortLabel: "History", icon: HistoryIcon },
];

type DashboardNavProps = {
  variant: "sidebar" | "bottom";
  activeId?: NavItemId;
};

export function DashboardNav({ variant, activeId = "dashboard" }: DashboardNavProps) {
  if (variant === "sidebar") {
    return (
      <nav
        aria-label="Main menu"
        className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm"
      >
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === activeId} layout="sidebar" />
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Main menu" className="py-1">
      <ul className="grid grid-cols-4 gap-1">
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} active={item.id === activeId} layout="bottom" />
        ))}
      </ul>
    </nav>
  );
}

function NavButton({
  item,
  active,
  layout,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  layout: "sidebar" | "bottom";
}) {
  const Icon = item.icon;

  if (layout === "sidebar") {
    return (
      <li>
        <button
          type="button"
          className={`flex w-full touch-manipulation items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Icon className="size-5 shrink-0" />
          {item.label}
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        className={`flex w-full touch-manipulation flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition ${
          active ? "text-slate-900" : "text-slate-500"
        }`}
      >
        <span
          className={`flex size-9 items-center justify-center rounded-xl transition ${
            active ? "bg-slate-900 text-white shadow-sm" : "bg-transparent"
          }`}
        >
          <Icon className="size-5" />
        </span>
        <span className="truncate">{item.shortLabel}</span>
      </button>
    </li>
  );
}
