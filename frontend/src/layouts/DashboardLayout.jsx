import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Banknote,
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  List,
  Users,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My Account', to: '/account', icon: CreditCard },
  { label: 'Transfer Money', to: '/transfer', icon: ArrowRightLeft },
  { label: 'Transactions', to: '/transactions', icon: List },
  { label: 'Beneficiaries', to: '/beneficiaries', icon: Users },
  { label: 'Profile', to: '/profile', icon: User },
];

const DashboardLayout = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-blush">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col bg-burgundy-deep lg:flex">
          <div className="flex h-16 items-center gap-2 px-6 border-b border-white/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-burgundy-deep">
              <Banknote className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-white">Silver Bank</span>
          </div>
          <nav className="flex-1 px-4 py-6">
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-burgundy-wine text-white shadow-sm'
                          : 'text-silver-soft hover:bg-burgundy-wine/60 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-burgundy-wine text-white shadow-sm'
                          : 'text-silver-soft hover:bg-burgundy-wine/60 hover:text-white'
                      }`
                    }
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span>Admin Dashboard</span>
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
          <div className="border-t border-white/10 px-4 py-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-silver-soft transition-colors hover:bg-burgundy-wine/60 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-deep text-white">
                <Banknote className="h-5 w-5" />
              </div>
              <span className="text-base font-semibold text-charcoal">Silver Bank</span>
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white"
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Toggle dashboard menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>
          {open && (
            <div className="border-b border-border bg-white lg:hidden">
              <nav className="flex flex-col gap-1 px-4 py-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        isActive
                          ? 'bg-blush text-burgundy-wine'
                          : 'text-charcoal hover:bg-blush'
                      }`
                    }
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-blush"
                    onClick={() => setOpen(false)}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span>Admin Dashboard</span>
                  </NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-blush"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          )}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
