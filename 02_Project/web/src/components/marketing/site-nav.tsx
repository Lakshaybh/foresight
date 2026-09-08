"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { CtaButton } from "@/components/marketing/cta-button";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#evidence", label: "Evidence" },
  { href: "#who-its-for", label: "Who it's for" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-2xl items-center justify-between gap-4 rounded-full border border-[var(--line)] bg-[var(--void-2)]/70 px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_20px_50px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 pl-1 font-mono text-sm font-medium tracking-tight text-[var(--bone)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
            Foresight
          </Link>

          <div className="hidden items-center gap-6 text-sm text-[var(--bone-dim)] sm:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors duration-300 hover:text-[var(--bone)]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-sm text-[var(--bone-dim)] transition-colors duration-300 hover:text-[var(--bone)]"
            >
              Sign in
            </Link>
            <CtaButton href="/login" size="sm">
              Request access
            </CtaButton>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="relative flex h-8 w-8 items-center justify-center sm:hidden"
          >
            <span
              className={cn(
                "absolute h-[1.5px] w-4 bg-[var(--bone)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                open ? "rotate-45" : "-translate-y-1.5"
              )}
            />
            <span
              className={cn(
                "absolute h-[1.5px] w-4 bg-[var(--bone)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                open ? "-rotate-45" : "translate-y-1.5"
              )}
            />
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-[var(--void)]/95 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {[...LINKS, { href: "/login", label: "Sign in" }].map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${100 + i * 80}ms` : "0ms" }}
            className={cn(
              "text-2xl font-medium tracking-tight text-[var(--bone)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}
