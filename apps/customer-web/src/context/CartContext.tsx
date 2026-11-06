import type { Cart } from "@delivery/shared-types";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const emptyCart: Cart = { branch: null, items: [], itemCount: 0, subtotal: "0.00" };

interface CartContextValue {
  cart: Cart;
  refresh: () => Promise<void>;
  /** Sets the quantity (adds the product if it isn't in the cart). Throws on API errors so callers can react. */
  setItem: (productId: string, quantity: number, replaceCart?: boolean) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);

  const refresh = useCallback(async () => {
    const { data } = await api.get<Cart>("/cart");
    setCart(data);
  }, []);

  // Load the cart when someone signs in; drop it when they sign out.
  useEffect(() => {
    if (!user) {
      setCart(emptyCart);
      return;
    }
    refresh().catch(() => {});
  }, [user, refresh]);

  async function setItem(productId: string, quantity: number, replaceCart = false) {
    const { data } = await api.put<Cart>("/cart/items", { productId, quantity, replaceCart });
    setCart(data);
  }

  async function removeItem(productId: string) {
    const { data } = await api.delete<Cart>(`/cart/items/${productId}`);
    setCart(data);
  }

  async function clear() {
    const { data } = await api.delete<Cart>("/cart");
    setCart(data);
  }

  return (
    <CartContext.Provider value={{ cart, refresh, setItem, removeItem, clear }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
