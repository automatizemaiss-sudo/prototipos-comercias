"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { GROUPS, type Product } from "@/data/menu";
import { groupCount, isGroupValid, isSelectionValid, money, unitPrice, type Selections } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export default function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem } = useStore();
  const [sel, setSel] = useState<Selections>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const valid = isSelectionValid(product, sel);
  const total = unitPrice(product, sel) * qty;

  function setOption(groupId: string, optId: string, next: number, max: number, exclusive: boolean) {
    setSel((prev) => {
      const group = { ...(prev[groupId] ?? {}) };
      if (exclusive) {
        return { ...prev, [groupId]: next > 0 ? { [optId]: 1 } : {} };
      }
      const others = Object.entries(group).reduce((s, [k, v]) => (k === optId ? s : s + v), 0);
      const clamped = Math.max(0, Math.min(next, max - others));
      if (clamped === 0) delete group[optId];
      else group[optId] = clamped;
      return { ...prev, [groupId]: group };
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto">
          <div className="relative aspect-[4/3] w-full bg-gray-100">
            <Image src={product.image} alt={product.name} fill sizes="512px" className="object-cover" priority />
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <h2 className="text-lg font-bold leading-snug">{product.name}</h2>
            <p className="mt-1 text-sm text-gray-600">{product.description}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-brand">{money(product.price)}</span>
              {product.ifoodPrice > product.price && (
                <span className="text-sm text-gray-400 line-through">No iFood: {money(product.ifoodPrice)}</span>
              )}
            </div>
          </div>

          {product.groups.map((ref) => {
            const group = GROUPS[ref.id];
            const count = groupCount(sel, ref.id);
            const required = ref.min > 0;
            const exclusive = ref.max === 1;
            const stepper = !exclusive && (group.stepper || group.allowRepeat);
            const full = count >= ref.max;
            return (
              <section key={ref.id} className="border-t-8 border-gray-100">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                  <div>
                    <h3 className="font-bold">{group.name}</h3>
                    <p className="text-xs text-gray-500">
                      {required
                        ? ref.min === ref.max
                          ? `Escolha ${ref.min}`
                          : `Escolha de ${ref.min} a ${ref.max}`
                        : `Escolha até ${ref.max}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {count}/{ref.max}
                    </span>
                    {required && (
                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold text-white ${
                          isGroupValid(ref, sel) ? "bg-green-600" : "bg-gray-800"
                        }`}
                      >
                        {isGroupValid(ref, sel) ? "✓ OK" : "OBRIGATÓRIO"}
                      </span>
                    )}
                  </div>
                </div>
                <ul>
                  {group.options.map((opt) => {
                    const n = sel[ref.id]?.[opt.id] ?? 0;
                    const price = opt.price > 0 ? `+ ${money(opt.price)}` : "";
                    return (
                      <li key={opt.id} className="flex min-h-14 items-center justify-between gap-3 border-t border-gray-100 px-4 py-2">
                        {stepper ? (
                          <>
                            <div>
                              <p className="text-[15px]">{opt.name}</p>
                              {price && <p className="text-sm text-gray-500">{price}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                              {n > 0 && (
                                <>
                                  <button
                                    aria-label="Diminuir"
                                    onClick={() => setOption(ref.id, opt.id, n - 1, ref.max, false)}
                                    className="grid h-9 w-9 place-items-center rounded-full border border-gray-300 text-lg"
                                  >
                                    −
                                  </button>
                                  <span className="w-4 text-center font-semibold">{n}</span>
                                </>
                              )}
                              <button
                                aria-label="Aumentar"
                                disabled={full}
                                onClick={() => setOption(ref.id, opt.id, n + 1, ref.max, false)}
                                className="grid h-9 w-9 place-items-center rounded-full border border-brand text-lg text-brand disabled:border-gray-200 disabled:text-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="flex w-full cursor-pointer items-center justify-between gap-3">
                            <div>
                              <p className="text-[15px]">{opt.name}</p>
                              {price && <p className="text-sm text-gray-500">{price}</p>}
                            </div>
                            <input
                              type={exclusive ? "radio" : "checkbox"}
                              name={ref.id}
                              checked={n > 0}
                              disabled={!exclusive && n === 0 && full}
                              onChange={(e) => setOption(ref.id, opt.id, e.target.checked ? 1 : 0, ref.max, exclusive)}
                              className="h-6 w-6 accent-[#ea1d2c]"
                            />
                          </label>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          <section className="border-t-8 border-gray-100 p-4">
            <label className="text-sm font-bold" htmlFor="notes">
              Algum comentário?
            </label>
            <textarea
              id="notes"
              value={notes}
              maxLength={140}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: tirar cebola, ponto da carne..."
              className="mt-2 h-20 w-full rounded-xl border border-gray-300 p-3 text-base"
            />
            <p className="text-right text-xs text-gray-400">{notes.length}/140</p>
          </section>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-200 bg-white p-3">
          <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-2">
            <button aria-label="Menos" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-9 text-xl">
              −
            </button>
            <span className="w-5 text-center font-bold">{qty}</span>
            <button aria-label="Mais" onClick={() => setQty((q) => q + 1)} className="h-12 w-9 text-xl text-brand">
              +
            </button>
          </div>
          <button
            className="btn-primary flex flex-1 items-center justify-between"
            disabled={!valid}
            onClick={() => {
              addItem({ productId: product.id, qty, selections: sel, notes: notes.trim() });
              onClose();
            }}
          >
            <span>Adicionar</span>
            <span>{money(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
