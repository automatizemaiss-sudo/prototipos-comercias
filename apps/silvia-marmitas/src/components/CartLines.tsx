"use client";

import { getProduct } from "@/data/menu";
import { describeOptions, money, unitPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export default function CartLines({ editable = true }: { editable?: boolean }) {
  const { items, setQty, removeItem } = useStore();
  return (
    <ul className="divide-y divide-gray-100">
      {items.map((it) => {
        const p = getProduct(it.productId);
        if (!p) return null;
        const opts = describeOptions(p, it.selections);
        return (
          <li key={it.key} className="py-3">
            <div className="flex justify-between gap-3">
              <p className="font-semibold leading-snug">
                {it.qty}× {p.name}
              </p>
              <p className="shrink-0 font-bold">{money(unitPrice(p, it.selections) * it.qty)}</p>
            </div>
            {opts.map((g) => (
              <p key={g.group} className="text-[13px] text-gray-500">
                {g.items.join(", ")}
              </p>
            ))}
            {it.notes && <p className="text-[13px] italic text-gray-500">Obs.: {it.notes}</p>}
            {editable && (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button className="h-10 w-10 text-lg" aria-label="Menos" onClick={() => setQty(it.key, it.qty - 1)}>
                    −
                  </button>
                  <span className="w-6 text-center font-semibold">{it.qty}</span>
                  <button className="h-10 w-10 text-lg text-brand" aria-label="Mais" onClick={() => setQty(it.key, it.qty + 1)}>
                    +
                  </button>
                </div>
                <button className="h-10 px-2 text-sm font-semibold text-brand" onClick={() => removeItem(it.key)}>
                  Remover
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
