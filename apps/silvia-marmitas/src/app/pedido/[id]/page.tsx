"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { RESTAURANT, RULES } from "@/data/menu";
import { money } from "@/lib/pricing";
import { PAYMENT_LABEL, buildWebhookPayload, type Order } from "@/lib/orders";
import { useStore } from "@/lib/store";

const PIX_DELAY_MS = 8000; // protótipo: o Pix "confirma" sozinho após alguns segundos

function PixPanel({ order, onPaid }: { order: Order; onPaid: () => void }) {
  const code = `00020126580014BR.GOV.BCB.PIX0136demo-silvia-${order.id}5204000053039865406${order.total.toFixed(2).replace(".", "")}5802BR5925SILVIA MARMITAS E LANCHES6012PONTA GROSSA62070503***6304DEMO`;
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(code, { margin: 1, width: 280 }).then(setQr);
  }, [code]);

  // "Polling" do status: no protótipo, confirma após PIX_DELAY_MS.
  useEffect(() => {
    const left = Math.max(0, PIX_DELAY_MS - (Date.now() - new Date(order.created_at).getTime()));
    const t = setTimeout(onPaid, left);
    return () => clearTimeout(t);
  }, [order.created_at, onPaid]);

  return (
    <section className="rounded-2xl bg-white p-5 text-center">
      <h2 className="text-lg font-extrabold">Pague com Pix</h2>
      <p className="text-sm text-gray-500">Escaneie o QR Code ou use o copia-e-cola</p>
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR Code Pix" width={240} height={240} className="mx-auto my-4 rounded-xl border border-gray-200" />
      )}
      <p className="text-2xl font-extrabold text-brand">{money(order.total)}</p>
      <button
        className="btn-primary mt-3 w-full"
        onClick={() => {
          navigator.clipboard?.writeText(code).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copiado ✓" : "Copiar código Pix"}
      </button>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
        <span className="h-3 w-3 animate-pulse rounded-full bg-amber-400" /> Aguardando pagamento…
      </p>
      <button className="mt-3 text-xs text-gray-400 underline" onClick={onPaid}>
        (demo) simular pagamento agora
      </button>
    </section>
  );
}

function CardPanel({ order, onPaid }: { order: Order; onPaid: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className="rounded-2xl bg-white p-5">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Ambiente de pagamento seguro · simulado</p>
      <h2 className="mt-2 text-center text-lg font-extrabold">Cartão de crédito</h2>
      <p className="text-center text-2xl font-extrabold text-brand">{money(order.total)}</p>
      <div className="mt-4 space-y-3">
        <input className="input" placeholder="Número do cartão" defaultValue="4111 1111 1111 1111" readOnly />
        <div className="flex gap-3">
          <input className="input" defaultValue="12/30" readOnly />
          <input className="input" defaultValue="123" readOnly />
        </div>
        <input className="input" defaultValue={order.customer.name.toUpperCase()} readOnly />
      </div>
      <button
        className="btn-primary mt-4 w-full"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setTimeout(onPaid, 1500);
        }}
      >
        {busy ? "Processando…" : `Pagar ${money(order.total)}`}
      </button>
    </section>
  );
}

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const { orders, ready, updateOrder } = useStore();
  const order = orders.find((o) => o.id === id);
  const notified = useRef(false);

  function markPaid() {
    if (!order || order.status !== "pending_payment" || notified.current) return;
    notified.current = true; // idempotente: dispara o n8n uma única vez
    const paid: Order = { ...order, status: "paid" };
    updateOrder(order.id, { status: "paid" });
    fetch("/api/order-webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildWebhookPayload(paid)) }).catch(() => {});
  }

  if (!ready) return <main className="p-8 text-center text-gray-500">Carregando…</main>;
  if (!order)
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold">Pedido não encontrado neste aparelho.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex items-center">
          Voltar ao cardápio
        </Link>
      </main>
    );

  const pending = order.status === "pending_payment";
  const wa = `https://wa.me/${RESTAURANT.whatsapp}?text=${encodeURIComponent(`Olá! Sobre o pedido #${order.number}`)}`;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg space-y-3 bg-gray-50 p-3 pb-10">
      {!pending && (
        <section className="rounded-2xl bg-white p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
          <h1 className="mt-3 text-xl font-extrabold">Pedido confirmado!</h1>
          <p className="text-lg font-bold text-brand">#{order.number}</p>
          <p className="mt-2 text-sm text-gray-600">
            Previsão: <b>{RULES.etaText}</b>
          </p>
          <p className="text-sm text-gray-600">Você vai receber a confirmação no WhatsApp.</p>
        </section>
      )}

      {pending && order.payment_method === "pix" && <PixPanel order={order} onPaid={markPaid} />}
      {pending && order.payment_method === "card" && <CardPanel order={order} onPaid={markPaid} />}

      <section className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 font-extrabold">Resumo do pedido #{order.number}</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((it, i) => (
            <li key={i}>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">
                  {it.quantity}× {it.name}
                </span>
                <span>{money(it.line_total)}</span>
              </div>
              {it.options.map((g) => (
                <p key={g.group} className="text-gray-500">
                  {g.items.join(", ")}
                </p>
              ))}
              {it.notes && <p className="italic text-gray-500">Obs.: {it.notes}</p>}
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Desconto ({order.coupon_code})</span><span>−{money(order.discount)}</span></div>}
          <div className="flex justify-between"><span>Frete</span><span>{order.delivery_fee ? money(order.delivery_fee) : order.fulfillment === "pickup" ? money(0) : "Grátis"}</span></div>
          <div className="flex justify-between text-base font-extrabold"><span>Total</span><span>{money(order.total)}</span></div>
          <p className="pt-1 text-gray-500">
            {order.fulfillment === "pickup" ? "Retirada no local" : `Entrega: ${order.customer.address?.street}, ${order.customer.address?.number} — ${order.customer.address?.neighborhood}`} ·{" "}
            {PAYMENT_LABEL[order.payment_method]}
            {order.payment_method === "cash" && order.change_for ? ` (troco p/ ${money(order.change_for)})` : ""}
          </p>
        </div>
        {order.savings > 0 && !pending && (
          <p className="mt-3 rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-800">
            🎉 Você economizou {money(order.savings)} pedindo direto
          </p>
        )}
      </section>

      {!pending && (
        <>
          <a href={wa} target="_blank" rel="noreferrer" className="btn-primary flex w-full items-center justify-center">
            Falar com o restaurante
          </a>
          <Link href="/" className="block py-2 text-center text-sm font-semibold text-gray-600 underline">
            Fazer outro pedido
          </Link>
        </>
      )}
    </main>
  );
}
