import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Banknote, Globe } from 'lucide-react';
import NewsCard from '../components/NewsCard';

const bankerImage = 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const newsItems = [
  {
    title: 'CBN Maintains Interest Rate as Inflation Shows Signs of Cooling',
    excerpt: 'The Central Bank of Nigeria holds its policy rate steady amid cautious optimism for price stability across key sectors.',
    source: 'Nairametrics',
    date: '2026-10-13',
    link: 'https://nairametrics.com/',
    image: 'https://images.unsplash.com/photo-1515180711443-f8685c6d6a74?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Nigerian Banks Expand Digital Lending to Drive Financial Inclusion',
    excerpt: 'Leading Nigerian banks are scaling responsible digital lending offerings to reach underserved communities nationwide.',
    source: 'BusinessDay Nigeria',
    date: '2026-10-12',
    link: 'https://businessday.ng/',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Fintech Partnerships Boost Cross-Border Payments in West Africa',
    excerpt: 'Strategic partnerships between Nigerian fintechs and regional players aim to lower fees and speed up intra-African transfers.',
    source: 'TechCabal',
    date: '2026-10-11',
    link: 'https://techcabal.com/',
    image: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Green Finance Gains Momentum Among Nigerian Financial Institutions',
    excerpt: 'Nigerian banks are increasing allocations toward sustainable projects to support climate-aligned economic growth.',
    source: 'Premium Times',
    date: '2026-10-10',
    link: 'https://www.premiumtimesng.com/',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

const Home = () => (
  <div className="flex flex-col">
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-blush px-3 py-1 text-xs font-semibold text-burgundy-wine">
              Banking built on trust
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
              Welcome to <span className="text-burgundy-wine">Silver Bank</span>
            </h1>
            <p className="max-w-xl text-lg text-muted sm:text-xl">
              Manage your money with confidence. Send transfers, track your balance, view transaction history, and enjoy secure, seamless banking every step of the way.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-burgundy-wine px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-burgundy-deep"
            >
              Open an account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-blush"
            >
              Sign in
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-2xl border border-border bg-blush/60 px-4 py-4">
              <ShieldCheck className="h-5 w-5 text-burgundy-wine" />
              <span className="text-sm font-semibold text-charcoal">Secure by design</span>
              <span className="text-xs text-muted">Multi-layered protection for your funds</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-border bg-blush/60 px-4 py-4">
              <Banknote className="h-5 w-5 text-burgundy-wine" />
              <span className="text-sm font-semibold text-charcoal">Instant transfers</span>
              <span className="text-xs text-muted">Send money to other Silver Bank customers</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-border bg-blush/60 px-4 py-4">
              <Globe className="h-5 w-5 text-burgundy-wine" />
              <span className="text-sm font-semibold text-charcoal">Built for Nigeria</span>
              <span className="text-xs text-muted">NGN currency with secure, reliable banking</span>
            </div>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-md">
            <img
              src={bankerImage}
              alt="A female banker smiling"
              className="h-[320px] w-full object-cover object-top sm:h-[420px] lg:h-[520px]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-burgundy-deep/90 via-burgundy-deep/60 to-transparent p-6 text-white">
              <p className="text-sm font-medium">Your trusted banking partner</p>
              <p className="text-lg font-semibold">Expert guidance, always at hand</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-blush">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">Latest News</h2>
            <p className="text-sm text-muted">Stay informed with the latest developments in Nigeria’s banking sector</p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {newsItems.map((item) => (
            <NewsCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Home;
