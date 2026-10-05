"use client";

import Link from "next/link";
import { money } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export default function FloatingBag() {
  const { count, subtotal, ready } = useStore();
  if (!ready || count === 0) return null;
  return (
    <Link
      href="/sacola"
      className="btn-primary fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-lg items-center justify-between rounded-2xl px-5 shadow-xl"
      style={{ minHeight: "3.5rem" }}
    >
      <span className="flex items-center gap-2">
        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-1 text-sm font-extrabold text-brand">
          {count}
        </span>
        Ver sacola
      </span>
      <span>{money(subtotal)}</span>
    </Link>
  );
}
