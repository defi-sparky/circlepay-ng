"use client";
// components/BottomNav.tsx
// Mobile-first bottom navigation bar

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Zap, TrendingUp, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/pay", label: "Pay Bills", icon: Zap },
  { href: "/stake", label: "Earn", icon: TrendingUp },
  { href: "/convert", label: "Convert", icon: ArrowLeftRight },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-brand-surface/95 backdrop-blur-xl border-t border-brand-border pb-safe">
      <div className="max-w-md mx-auto flex items-center">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all duration-200",
                isActive ? "text-brand-green" : "text-brand-text-muted hover:text-brand-text"
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={cn(
                    "transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-green" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide transition-all duration-200",
                  isActive ? "font-semibold" : ""
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
