"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProduct } from "@/data/menu";
import { unitPrice, round2, type CartItem } from "@/lib/pricing";
import type { Address, Order } from "@/lib/orders";

const K = { cart: "silvia:cart", orders: "silvia:orders", profile: "silvia:profile", coupon: "silvia:coupon" };

export type Profile = { name: string; phone: string; cpf: string; address: Address };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

type Store = {
  ready: boolean;
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (i: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  couponCode: string | null;
  setCouponCode: (c: string | null) => void;
  orders: Order[];
  saveOrder: (o: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  nextOrderNumber: () => number;
  profile: Profile | null;
  saveProfile: (p: Profile) => void;
  clearProfile: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couponCode, setCoupon] = useState<string | null>(null);

  useEffect(() => {
    // Hidrata do localStorage só no cliente (evita divergência com o HTML do servidor).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(read<CartItem[]>(K.cart, []));
    setOrders(read<Order[]>(K.orders, []));
    setProfile(read<Profile | null>(K.profile, null));
    setCoupon(read<string | null>(K.coupon, null));
    setReady(true);
  }, []);

  const persistItems = (next: CartItem[]) => {
    setItems(next);
    write(K.cart, next);
  };

  const addItem: Store["addItem"] = useCallback((i) => {
    setItems((prev) => {
      const next = [...prev, { ...i, key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }];
      write(K.cart, next);
      return next;
    });
  }, []);

  const value = useMemo<Store>(() => {
    const subtotal = round2(
      items.reduce((s, it) => {
        const p = getProduct(it.productId);
        return s + (p ? unitPrice(p, it.selections) * it.qty : 0);
      }, 0),
    );
    return {
      ready,
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      addItem,
      setQty: (key, qty) => persistItems(items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i))),
      removeItem: (key) => persistItems(items.filter((i) => i.key !== key)),
      clearCart: () => persistItems([]),
      couponCode,
      setCouponCode: (c) => {
        setCoupon(c);
        write(K.coupon, c);
      },
      orders,
      saveOrder: (o) => {
        const next = [o, ...orders.filter((x) => x.id !== o.id)];
        setOrders(next);
        write(K.orders, next);
      },
      updateOrder: (id, patch) => {
        const next = orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
        setOrders(next);
        write(K.orders, next);
      },
      nextOrderNumber: () => 1042 + orders.length,
      profile,
      saveProfile: (p) => {
        setProfile(p);
        write(K.profile, p);
      },
      clearProfile: () => {
        setProfile(null);
        try {
          localStorage.removeItem(K.profile);
        } catch {}
      },
    };
  }, [ready, items, orders, profile, couponCode, addItem]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore fora do StoreProvider");
  return c;
}
