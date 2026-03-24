"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NavBar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Add Lead" },
    { href: "/statuses", label: "Statuses" },
  ];

  return (
    <nav className="border-b border-stone-200 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-6 h-14">
        <span className="text-lg font-bold tracking-tight shrink-0" style={{ fontFamily: "var(--font-playfair, serif)" }}>
          Lead<span className="text-amber-500">Portal</span>
        </span>
        <div className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
