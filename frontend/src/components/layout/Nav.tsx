"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button";
import { logout } from "@/features/auth/api";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/appointments", label: "Citas" },
  { href: "/reports", label: "Reporte" },
];

function readUsername(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)username=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// La cookie no cambia durante la sesión: sin suscripción real.
const noopSubscribe = () => () => {};

/** Lee el username del navegador sin setState-in-effect ni mismatch de SSR. */
function useUsername(): string {
  return useSyncExternalStore(noopSubscribe, readUsername, () => "");
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const username = useUsername();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-brand-100 bg-surface">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-700">
            Citas de Entrega
          </span>
        </div>

        {/* Navegación de escritorio */}
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted hover:bg-brand-50 hover:text-brand-700",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {username && (
            <span className="text-sm text-muted">
              Hola, <strong className="text-foreground">{username}</strong>
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} loading={loggingOut}>
            Salir
          </Button>
        </div>

        {/* Botón hamburguesa (móvil) */}
        <button
          className="rounded-lg p-2 text-brand-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <span className="block h-0.5 w-6 bg-current" />
          <span className="mt-1.5 block h-0.5 w-6 bg-current" />
          <span className="mt-1.5 block h-0.5 w-6 bg-current" />
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {open && (
        <nav className="border-t border-brand-100 px-4 py-3 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname.startsWith(link.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start"
            onClick={handleLogout}
            loading={loggingOut}
          >
            Salir{username ? ` (${username})` : ""}
          </Button>
        </nav>
      )}
    </header>
  );
}
