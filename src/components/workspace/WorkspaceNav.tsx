import { Link } from "@tanstack/react-router";
import { Bot, BriefcaseBusiness, Coins, FileText, FolderKanban, LayoutDashboard } from "lucide-react";

const ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/cases", label: "Cases", icon: FolderKanban },
  { to: "/funding", label: "Funding", icon: Coins },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { to: "/copilot", label: "Reva", icon: Bot },
] as const;

export function WorkspaceNav() {
  return (
    <div className="mb-8 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-card">
      <nav className="flex min-w-max gap-1" aria-label="DOMUREVA workspace">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary [&.active]:bg-navy [&.active]:text-navy-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
