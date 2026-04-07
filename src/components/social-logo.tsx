import type { Route } from "next";
import Link from "next/link";

type SocialLogoProps = {
  href?: Route;
  compact?: boolean;
};

export function SocialLogo({ href = "/" as Route, compact = false }: SocialLogoProps) {
  const content = (
    <span className="inline-flex items-center gap-2 text-white">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="social-logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="11" cy="11" r="10" fill="url(#social-logo-gradient)" opacity="0.2" />
        <circle cx="11" cy="11" r="5" fill="url(#social-logo-gradient)" />
      </svg>
      {!compact ? <span className="text-lg font-semibold tracking-tight">SocialConnect</span> : null}
    </span>
  );

  return <Link href={href}>{content}</Link>;
}
