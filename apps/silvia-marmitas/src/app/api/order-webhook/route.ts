import { NextResponse } from "next/server";

// Repassa o pedido confirmado para o n8n. Sem N8N_ORDER_WEBHOOK_URL, só faz log (modo demo).
export async function POST(req: Request) {
  const payload = await req.json();
  const url = process.env.N8N_ORDER_WEBHOOK_URL;
  if (!url) {
    console.log("[demo] N8N_ORDER_WEBHOOK_URL vazio — payload do pedido:\n", JSON.stringify(payload, null, 2));
    return NextResponse.json({ ok: true, demo: true });
  }
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return NextResponse.json({ ok: r.ok });
  } catch (err) {
    console.error("Falha ao chamar o n8n:", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
