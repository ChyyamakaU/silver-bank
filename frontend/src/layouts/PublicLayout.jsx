import { Link, Outlet } from 'react-router-dom';
import { Banknote, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { label: 'About Us', to: '/about' },
  { label: 'CSR', to: '/csr' },
  { label: 'Helpdesk', to: '/helpdesk' },
];

const PublicLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-blush">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-deep text-white shadow-sm">
              <Banknote className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-charcoal">Silver Bank</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-base font-semibold text-charcoal transition-colors hover:text-burgundy-wine"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-wine px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-burgundy-deep"
            >
              Open Account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-blush"
            >
              Sign In
            </Link>
          </div>

          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border bg-white md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-charcoal hover:bg-blush"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/register"
                className="mt-2 rounded-lg bg-burgundy-wine px-2 py-2 text-sm font-semibold text-white hover:bg-burgundy-deep"
                onClick={() => setOpen(false)}
              >
                Open Account
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-border bg-white px-2 py-2 text-sm font-semibold text-charcoal hover:bg-blush"
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

            <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-burgundy-deep text-white shadow-sm">
                  <Banknote className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold text-charcoal">Silver Bank</span>
              </Link>
              <p className="text-sm text-muted">Your trusted banking partner</p>
              <div className="flex items-center gap-3">
                <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-burgundy-wine" aria-label="X (formerly Twitter)">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-burgundy-wine" aria-label="Facebook">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-burgundy-wine" aria-label="Instagram">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm4.75-2.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
                </a>
                <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-burgundy-wine" aria-label="LinkedIn">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-charcoal">Personal</h3>
              <nav className="flex flex-col gap-2 text-sm text-muted">
                <a href="#" className="hover:text-burgundy-wine">Accounts</a>
                <a href="#" className="hover:text-burgundy-wine">Cards</a>
                <a href="#" className="hover:text-burgundy-wine">Loans</a>
                <a href="#" className="hover:text-burgundy-wine">E-Banking</a>
                <a href="#" className="hover:text-burgundy-wine">Savings &amp; Investments</a>
              </nav>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-charcoal">Business</h3>
              <nav className="flex flex-col gap-2 text-sm text-muted">
                <a href="#" className="hover:text-burgundy-wine">Business Accounts</a>
                <a href="#" className="hover:text-burgundy-wine">Trade &amp; Payments</a>
                <a href="#" className="hover:text-burgundy-wine">Business Loans</a>
                <a href="#" className="hover:text-burgundy-wine">Corporate Solutions</a>
                <a href="#" className="hover:text-burgundy-wine">SME Banking</a>
              </nav>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-charcoal">Quick Links</h3>
              <nav className="flex flex-col gap-2 text-sm text-muted">
                <Link to="/about" className="hover:text-burgundy-wine">About Us</Link>
                <Link to="/csr" className="hover:text-burgundy-wine">CSR</Link>
                <Link to="/helpdesk" className="hover:text-burgundy-wine">Helpdesk</Link>
                <a href="#" className="hover:text-burgundy-wine">News &amp; Media</a>
                <a href="#" className="hover:text-burgundy-wine">Careers</a>
                <a href="#" className="hover:text-burgundy-wine">Our Offices</a>
              </nav>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-charcoal">Contact Us</h3>
              <nav className="flex flex-col gap-2 text-sm text-muted">
                <span>Phone: +234 1 270 1234</span>
                <span>Phone: +234 1 270 1235</span>
                <span>Email: contact@silverbank.com</span>
                <span>Address: Plot 123, Victoria Island, Lagos, Nigeria</span>
                <a href="#" className="hover:text-burgundy-wine">Privacy Policy</a>
                <a href="#" className="hover:text-burgundy-wine">Cookies Policy</a>
                <a href="#" className="hover:text-burgundy-wine">Terms &amp; Conditions</a>
              </nav>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6">
            <p className="text-xs text-muted">&copy; {new Date().getFullYear()} Silver Bank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
