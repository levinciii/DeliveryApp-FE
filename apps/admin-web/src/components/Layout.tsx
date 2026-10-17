import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";

const navItems = [{ to: "/", label: "Merchants" }];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-ink/10 bg-surface flex flex-col justify-between p-5">
        <div>
          <h1 className="font-display text-lg font-semibold text-ink mb-8">Delivery Admin</h1>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-ink/5"
                  }`
                }
              >
                {item.label}
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
