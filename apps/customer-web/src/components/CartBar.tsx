import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPeso } from "../lib/format";

/** Sticks to the bottom of the page while the cart has something in it. */
export function CartBar() {
  const { cart } = useCart();
  if (cart.itemCount === 0) return null;

  return (
    <div className="sticky bottom-4 mt-8">
      <div className="bg-ink text-white rounded-lg px-5 py-3 flex items-center justify-between shadow-lg">
        <p className="text-sm">
          <span className="font-medium">
            {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}
          </span>{" "}
          from {cart.branch?.name} · {formatPeso(cart.subtotal)}
        </p>
        <Link to="/cart" className="text-sm font-medium bg-white text-ink rounded-md px-4 py-2 hover:bg-white/90">
          View cart
        </Link>
      </div>
    </div>
  );
}
