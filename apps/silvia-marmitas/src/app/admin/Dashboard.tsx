"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { demoOrders } from "@/lib/demo";
import { PAYMENT_LABEL, countsAsSale } from "@/lib/orders";
import { money } from "@/lib/pricing";
import { useStore } from "@/lib/store";

type Period = "today" | "7" | "30" | "custom";
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function Dashboard() {
  const router = useRouter();
  const { orders: local, ready } = useStore();
  const [period, setPeriod] = useState<Period>("30");
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 7 * 864e5)));
  const [to, setTo] = useState(() => iso(new Date()));

  const all = useMemo(() => [...local, ...demoOrders()].sort((a, b) => b.created_at.localeCompare(a.created_at)), [local]);

  const filtered = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end = new Date(now.getTime() + 1);
    if (period === "today") start = startOfDay(now);
    else if (period === "7") start = new Date(startOfDay(now).getTime() - 6 * 864e5);
    else if (period === "30") start = new Date(startOfDay(now).getTime() - 29 * 864e5);
    else {
      start = new Date(`${from}T00:00:00`);
      end = new Date(`${to}T23:59:59.999`);
    }
    return all.filter((o) => {
      const t = new Date(o.created_at);
      return countsAsSale(o) && t >= start && t <= end;
    });
  }, [all, period, from, to]);

  const total = filtered.reduce((s, o) => s + o.total, 0);
  const avg = filtered.length ? total / filtered.length : 0;

  const tab = (p: Period, label: string) => (
    <button key={p} onClick={() => setPeriod(p)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${period === p ? "border-brand bg-brand text-white" : "border-gray-300 bg-white"}`}>
      {label}
    </button>
  );

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl space-y-4 p-3 pb-10">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-extrabold">Vendas · Silvia Marmitas</h1>
        <button
          className="text-sm font-semibold text-gray-500 underline"
          onClick={async () => {
            await fetch("/api/admin/login", { method: "DELETE" });
            router.refresh();
          }}
        >
          Sair
        </button>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {tab("today", "Hoje")}
        {tab("7", "7 dias")}
        {tab("30", "30 dias")}
        {tab("custom", "Personalizado")}
      </div>
      {period === "custom" && (
        <div className="flex gap-2">
          <input type="date" className="input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Total vendido", money(total)],
          ["Número de vendas", String(filtered.length)],
          ["Ticket médio", money(avg)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-extrabold text-brand">{ready ? value : "…"}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-extrabold">Últimos pedidos</h2>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Nenhuma venda no período.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.slice(0, 30).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    #{o.number} · {o.customer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {PAYMENT_LABEL[o.payment_method]} ·{" "}
                    {o.fulfillment === "delivery" ? "Entrega" : "Retirada"}
                  </p>
                </div>
                <p className="shrink-0 font-bold">{money(o.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-center text-xs text-gray-400">Protótipo: pedidos fictícios + pedidos feitos neste aparelho.</p>
    </main>
  );
}
