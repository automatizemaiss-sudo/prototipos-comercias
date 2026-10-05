"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RESTAURANT, RULES } from "@/data/menu";
import CartLines from "@/components/CartLines";
import CouponBox, { useCoupon } from "@/components/CouponBox";
import { deliveryFee, distanceKm, money, round2, savingsVsIfood } from "@/lib/pricing";
import { isValidCpf, maskCep, maskCpf, maskPhone, onlyDigits } from "@/lib/format";
import { toOrderItems, buildWebhookPayload, type Address, type Order, type PaymentMethod } from "@/lib/orders";
import { useStore } from "@/lib/store";

const EMPTY_ADDR: Address = { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "Ponta Grossa", reference: "" };

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      {children}
      {error && <span data-error className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export default function Checkout() {
  const router = useRouter();
  const store = useStore();
  const { items, subtotal, profile, ready, couponCode, setCouponCode } = store;
  const { coupon, discount: rawDiscount, ordersByPhone } = useCoupon();

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [addr, setAddr] = useState<Address>(EMPTY_ADDR);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [changeFor, setChangeFor] = useState("");
  const [km, setKm] = useState<number | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "done">("idle");
  const [cepError, setCepError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");

  // Preenche com os dados lembrados (2ª visita).
  useEffect(() => {
    if (!ready || !profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(profile.name);
    setPhone(profile.phone);
    setCpf(profile.cpf);
    setAddr({ ...EMPTY_ADDR, ...profile.address });
  }, [ready, profile]);

  // Primeira compra: revalida o cupom pelo WhatsApp informado.
  const blockedCoupon = !!coupon?.firstOrderOnly && onlyDigits(phone).length >= 10 && ordersByPhone(phone).length > 0;
  useEffect(() => {
    if (blockedCoupon) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCouponMsg("Cupom BEMVINDO removido: válido apenas na primeira compra.");
      setCouponCode(null);
    }
  }, [blockedCoupon, setCouponCode]);

  async function lookupCep(raw: string) {
    const cep = onlyDigits(raw);
    if (cep.length !== 8) return;
    setCepError("");
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) return setCepError("CEP não encontrado. Preencha o endereço manualmente.");
      setAddr((a) => ({ ...a, street: d.logradouro || a.street, neighborhood: d.bairro || a.neighborhood, city: d.localidade || a.city }));
    } catch {
      setCepError("Não foi possível buscar o CEP. Preencha manualmente.");
    }
  }

  // Distância via Nominatim; se falhar, cobra o frete cheio (fallback seguro).
  async function geocode() {
    if (!addr.street || !addr.number) return;
    setGeoState("loading");
    try {
      const q = `${addr.street}, ${addr.number}, ${addr.neighborhood}, ${addr.city}, Paraná, Brasil`;
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
      const [hit] = await r.json();
      setKm(hit ? distanceKm(RESTAURANT.lat, RESTAURANT.lng, Number(hit.lat), Number(hit.lon)) : null);
    } catch {
      setKm(null);
    }
    setGeoState("done");
  }

  const discount = blockedCoupon ? 0 : rawDiscount;
  const fee = deliveryFee(fulfillment, km);
  const total = round2(subtotal - discount + fee);
  const saved = savingsVsIfood(items, fulfillment, fee);

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Informe seu nome.";
    if (onlyDigits(phone).length < 10) e.phone = "Informe um WhatsApp válido.";
    if (payment !== "cash" && !isValidCpf(cpf)) e.cpf = "CPF inválido (necessário para pagamento online).";
    if (fulfillment === "delivery") {
      if (!addr.street.trim()) e.street = "Informe a rua.";
      if (!addr.number.trim()) e.number = "Informe o número.";
      if (!addr.neighborhood.trim()) e.neighborhood = "Informe o bairro.";
    }
    if (payment === "cash" && changeFor && Number(changeFor.replace(",", ".")) < total) e.change = "O valor do troco deve ser maior que o total.";
    if (subtotal < RULES.minOrder) e.min = `Pedido mínimo: ${money(RULES.minOrder)}`;
    return e;
  }

  async function submit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    const change = payment === "cash" && changeFor ? Number(changeFor.replace(",", ".")) : null;
    const order: Order = {
      id: crypto.randomUUID(),
      number: store.nextOrderNumber(),
      created_at: new Date().toISOString(),
      customer: { name: name.trim(), phone, cpf: payment === "cash" ? undefined : cpf, address: fulfillment === "delivery" ? addr : undefined },
      fulfillment,
      distance_km: fulfillment === "delivery" && km !== null ? round2(km) : null,
      items: toOrderItems(items),
      subtotal,
      discount,
      delivery_fee: fee,
      total,
      savings: saved,
      coupon_code: discount > 0 ? couponCode : null,
      payment_method: payment,
      change_for: change,
      status: payment === "cash" ? "confirmed" : "pending_payment",
    };
    store.saveOrder(order);
    store.saveProfile({ name: name.trim(), phone, cpf, address: addr });
    if (order.status === "confirmed") {
      fetch("/api/order-webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildWebhookPayload(order)) }).catch(() => {});
    }
    store.clearCart();
    setCouponCode(null);
    router.push(`/pedido/${order.id}`);
  }

  if (ready && items.length === 0 && !submitting)
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold">Sua sacola está vazia.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex items-center">
          Ver cardápio
        </Link>
      </main>
    );

  const optionBtn = (active: boolean) =>
    `flex-1 rounded-xl border-2 px-3 py-3 text-center text-sm font-bold ${active ? "border-brand bg-red-50 text-brand" : "border-gray-200 bg-white text-gray-700"}`;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg bg-gray-50 pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-2">
        <Link href="/sacola" className="grid h-11 w-11 place-items-center text-xl" aria-label="Voltar">
          ←
        </Link>
        <h1 className="text-lg font-extrabold">Finalizar pedido</h1>
      </header>

      <div className="space-y-3 p-3">
        <section className="rounded-2xl bg-white p-4">
          <h2 className="mb-3 font-extrabold">1. Como quer receber?</h2>
          <div className="flex gap-2">
            <button className={optionBtn(fulfillment === "delivery")} onClick={() => setFulfillment("delivery")}>
              🛵 Entrega
            </button>
            <button className={optionBtn(fulfillment === "pickup")} onClick={() => setFulfillment("pickup")}>
              🏪 Retirada no local
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-4">
          <h2 className="font-extrabold">2. Seus dados</h2>
          {profile && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              Olá de novo, {profile.name.split(" ")[0]}! Preenchemos seus dados.{" "}
              <button
                className="font-bold underline"
                onClick={() => {
                  store.clearProfile();
                  setName("");
                  setPhone("");
                  setCpf("");
                  setAddr(EMPTY_ADDR);
                }}
              >
                Não sou eu / limpar dados
              </button>
            </p>
          )}
          <Field label="Nome" error={errors.name}>
            <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="WhatsApp" error={errors.phone}>
            <input className="input" inputMode="tel" autoComplete="tel" placeholder="(42) 99999-9999" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
          </Field>
          {payment !== "cash" && (
            <Field label="CPF (necessário para pagamento online)" error={errors.cpf}>
              <input className="input" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} />
            </Field>
          )}
        </section>

        {fulfillment === "delivery" && (
          <section className="space-y-3 rounded-2xl bg-white p-4">
            <h2 className="font-extrabold">3. Endereço de entrega</h2>
            <Field label="CEP">
              <input
                className="input"
                inputMode="numeric"
                placeholder="00000-000"
                value={addr.cep}
                onChange={(e) => {
                  const v = maskCep(e.target.value);
                  setAddr({ ...addr, cep: v });
                  if (onlyDigits(v).length === 8) lookupCep(v);
                }}
              />
              {cepError && <span className="mt-1 block text-sm text-amber-700">{cepError}</span>}
            </Field>
            <Field label="Rua" error={errors.street}>
              <input className="input" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} onBlur={geocode} />
            </Field>
            <div className="flex gap-3">
              <div className="w-28">
                <Field label="Número" error={errors.number}>
                  <input className="input" inputMode="numeric" value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} onBlur={geocode} />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Complemento">
                  <input className="input" value={addr.complement} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} />
                </Field>
              </div>
            </div>
            <Field label="Bairro" error={errors.neighborhood}>
              <input className="input" value={addr.neighborhood} onChange={(e) => setAddr({ ...addr, neighborhood: e.target.value })} onBlur={geocode} />
            </Field>
            <Field label="Ponto de referência">
              <input className="input" value={addr.reference} onChange={(e) => setAddr({ ...addr, reference: e.target.value })} />
            </Field>
            <p className="text-xs text-gray-500">
              {geoState === "loading" && "Calculando distância…"}
              {geoState === "done" && km !== null && `Distância aproximada: ${km.toFixed(1)} km`}
              {geoState === "done" && km === null && "Não conseguimos calcular a distância; frete padrão aplicado."}
            </p>
          </section>
        )}

        <section className="space-y-3 rounded-2xl bg-white p-4">
          <h2 className="font-extrabold">{fulfillment === "delivery" ? "4" : "3"}. Pagamento</h2>
          <div className="grid grid-cols-3 gap-2">
            <button className={optionBtn(payment === "pix")} onClick={() => setPayment("pix")}>
              Pix
            </button>
            <button className={optionBtn(payment === "card")} onClick={() => setPayment("card")}>
              Cartão
            </button>
            <button className={optionBtn(payment === "cash")} onClick={() => setPayment("cash")}>
              Dinheiro
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {payment === "pix" && "Você verá o QR Code na próxima tela e a confirmação é automática."}
            {payment === "card" && "Você será levado a um ambiente seguro de pagamento (nós não guardamos dados do cartão)."}
            {payment === "cash" && "Pague na entrega ou retirada."}
          </p>
          {payment === "cash" && (
            <Field label="Troco para quanto? (opcional)" error={errors.change}>
              <input className="input" inputMode="decimal" placeholder="Ex.: 50" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} />
            </Field>
          )}
        </section>

        <section className="rounded-2xl bg-white p-4">
          <h2 className="mb-1 font-extrabold">Resumo</h2>
          <CartLines editable={false} />
          <div className="mt-2 space-y-3">
            <CouponBox phone={phone} />
            {couponMsg && !couponCode && <p className="text-sm text-amber-700">{couponMsg}</p>}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-700"><span>Desconto</span><span>−{money(discount)}</span></div>}
              <div className="flex justify-between">
                <span>Frete</span>
                <span>{fee === 0 ? (fulfillment === "pickup" ? "R$ 0,00" : "Grátis") : money(fee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-extrabold"><span>Total</span><span>{money(total)}</span></div>
            </div>
            {saved > 0 && (
              <p className="rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-800">
                🎉 Você economizou {money(saved)} em relação ao iFood
              </p>
            )}
          </div>
        </section>
        {errors.min && <p data-error className="text-sm text-red-600">{errors.min}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-3">
        <div className="mx-auto max-w-lg">
          <button className="btn-primary w-full" disabled={submitting} onClick={submit}>
            {submitting ? "Enviando…" : payment === "cash" ? `Confirmar pedido · ${money(total)}` : `Ir para o pagamento · ${money(total)}`}
          </button>
        </div>
      </div>
    </main>
  );
}
