import { Link } from "@tanstack/react-router";

import logoAsset from "@/assets/domureva-logo.png.asset.json";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="DOMUREVA home">
      <img
        src={logoAsset.url}
        alt="DOMUREVA — bringing empty homes back to life"
        className="h-11 w-auto md:h-12"
        width={1187}
        height={285}
      />
    </Link>
  );
}

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid size-9 place-items-center rounded-xl bg-gradient-brand font-display text-sm font-bold text-navy-foreground ${className}`}
      aria-hidden
    >
      D
    </span>
  );
}
