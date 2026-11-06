import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Button } from "./Button";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/browse", label: "Browse", end: false },
  { to: "/cart", label: "Cart", end: false },
  { to: "/orders", label: "Orders", end: false },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-ink/10 bg-surface flex flex-col justify-between p-5">
        <div>
          <h1 className="font-display text-lg font-semibold text-ink mb-8">Delivery</h1>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-ink/5"
                  }`
                }
              >
                {item.label}
                {item.to === "/cart" && cart.itemCount > 0 && (
                  <span className="text-xs bg-primary text-white rounded-full px-2 py-0.5">{cart.itemCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-ink/10 pt-4">
          <p className="text-sm text-ink font-medium mb-2">{user?.name}</p>
          <Button variant="ghost" className="w-full" onClick={logout}>
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
