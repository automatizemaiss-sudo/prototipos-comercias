"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, PRODUCTS, RESTAURANT, type Product } from "@/data/menu";
import { money } from "@/lib/pricing";
import FloatingBag from "@/components/FloatingBag";
import ProductModal from "@/components/ProductModal";

function ProductCard({ p, onOpen }: { p: Product; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full gap-3 rounded-2xl bg-white p-3 text-left shadow-sm active:bg-gray-50">
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug">{p.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] text-gray-500">{p.description}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-extrabold text-brand">{money(p.price)}</span>
          {p.ifoodPrice > p.price && (
            <span className="text-xs text-gray-400">
              No iFood: <s>{money(p.ifoodPrice)}</s>
            </span>
          )}
        </div>
      </div>
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <Image src={p.image} alt={p.name} fill sizes="112px" className={p.category === "bebidas" ? "bg-white object-contain p-1" : "object-cover"} />
      </div>
    </button>
  );
}

export default function Home() {
  const [open, setOpen] = useState<Product | null>(null);
  const [active, setActive] = useState<string>("destaques");
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = CATEGORIES.map((c) => document.getElementById(`cat-${c.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.replace("cat-", ""));
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`)?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active]);

  const list = (id: string) => (id === "destaques" ? (["monte-g", "monte-m", "monte-p", "dia-p"].map((x) => PRODUCTS.find((p) => p.id === x)!)) : PRODUCTS.filter((p) => p.category === id));

  return (
    <main className="mx-auto w-full max-w-5xl pb-28">
      <header className="bg-gradient-to-br from-brand to-brand-dark px-4 pb-6 pt-8 text-white md:rounded-b-3xl md:px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo-silvia.jpg" alt="Logo Silvia" width={64} height={64} className="rounded-2xl border-2 border-white/60" priority />
          <div>
            <h1 className="text-xl font-extrabold leading-tight">{RESTAURANT.name}</h1>
            <p className="text-sm text-white/80">Nova Rússia · Ponta Grossa-PR</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-brand">
          🏷️ Peça direto e pague menos que no iFood
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div ref={chipsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-3">
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              data-chip={c.id}
              href={`#cat-${c.id}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                active === c.id ? "border-brand bg-brand text-white" : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {c.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-6 px-3 pt-4">
        {CATEGORIES.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-20">
            <h2 className="mb-3 text-lg font-extrabold">{c.label}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list(c.id).map((p) => (
                <ProductCard key={`${c.id}-${p.id}`} p={p} onOpen={() => setOpen(p)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {open && <ProductModal product={open} onClose={() => setOpen(null)} />}
      <FloatingBag />
    </main>
  );
}
