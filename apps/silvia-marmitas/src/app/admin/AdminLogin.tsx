"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (r.ok) router.refresh();
    else setError(true);
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-sm place-items-center p-4">
      <form onSubmit={submit} className="w-full space-y-3 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-extrabold">Painel do restaurante</h1>
        <input className="input" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        {error && <p className="text-sm text-red-600">Senha incorreta.</p>}
        <button className="btn-primary w-full" type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
