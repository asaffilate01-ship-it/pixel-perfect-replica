import { Link } from "@tanstack/react-router";

const PILLARS = ["Sustainable homes", "Stronger communities", "Greener futures", "Real impact"];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-display text-2xl font-bold tracking-tight">
            DOMU<span className="text-leaf-soft">REVA</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-navy-foreground/70">
            Bringing empty homes back to life — find, fund, restore, home.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-navy-foreground/60">
            {PILLARS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="text-sm">
          <h2 className="eyebrow text-leaf-soft">Platform</h2>
          <ul className="mt-3 grid gap-2 text-navy-foreground/80">
            <li><Link to="/funding">Funding finder</Link></li>
            <li><Link to="/applications">Applications</Link></li>
            <li><Link to="/contractors">Contractors</Link></li>
            <li><Link to="/providers">Housing providers</Link></li>
            <li><Link to="/council">Councils</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h2 className="eyebrow text-leaf-soft">Trust</h2>
          <ul className="mt-3 grid gap-2 text-navy-foreground/80">
            <li><Link to="/legal/privacy">Privacy notice</Link></li>
            <li><Link to="/legal/cookies">Cookies</Link></li>
            <li><Link to="/settings/privacy">Your data</Link></li>
            <li><Link to="/review">Rule review</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-foreground/10 py-5 text-center text-xs text-navy-foreground/55">
        © {new Date().getFullYear()} DOMUREVA. Funding eligibility remains subject to the
        administering authority's final decision.
      </div>
    </footer>
  );
}
