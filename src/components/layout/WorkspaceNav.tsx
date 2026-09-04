import { Link } from "@tanstack/react-router";
import { Bot, BriefcaseBusiness, Building2, Coins, FileCheck2, FolderKanban, Hammer, LayoutDashboard } from "lucide-react";

const ITEMS = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Cases", "/cases", FolderKanban],
  ["Funding", "/funding", Coins],
  ["Applications", "/applications", FileCheck2],
  ["Projects", "/projects", Hammer],
  ["Reva", "/copilot", Bot],
  ["Council", "/council", Building2],
  ["Provider", "/provider/offers", BriefcaseBusiness],
] as const;

export function WorkspaceNav() {
  return (
    <div className="mb-8 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-card">
      <nav className="flex min-w-max gap-1">
        {ITEMS.map(([label, to, Icon]) => (
          <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary [&.active]:bg-navy [&.active]:text-navy-foreground">
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
