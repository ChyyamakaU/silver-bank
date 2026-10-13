import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { Eye, EyeOff, ArrowRightLeft, List, Copy, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatCurrency = (v) => {
  const num = Number(v || 0) / 100;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(num);
};

const Dashboard = () => {
  const { user, account } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/accounts/dashboard');
      setData(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const acc = data?.account || account;

  const copy = async () => {
    if (acc?.accountNumber) {
      await navigator.clipboard.writeText(acc.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">Welcome, {user?.fullName}</h1>
        <p className="text-sm text-muted">Here is a snapshot of your account.</p>
      </div>
      {user && user.hasPin === false && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-l-4 border-burgundy-wine bg-blush/60">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-burgundy-wine" />
            <div>
              <p className="text-sm font-semibold text-charcoal">Set your transaction PIN</p>
              <p className="text-sm text-muted">
                A 4-digit PIN authorises sensitive actions like transfers and withdrawals. Create yours to start sending money.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-lg bg-burgundy-deep px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-burgundy-wine"
          >
            Set PIN
          </Link>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2 flex flex-col gap-6 bg-gradient-to-br from-burgundy-deep to-burgundy-wine text-white border-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-white/80">Available Balance</span>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold tracking-tight sm:text-4xl tabular-nums">
                  {showBalance ? formatCurrency(acc?.availableBalance) : '**** ****'}
                </span>
                <button
                  onClick={() => setShowBalance((p) => !p)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                  aria-label="Toggle balance visibility"
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="text-xs text-white/80">
                Ledger balance: {showBalance ? formatCurrency(acc?.ledgerBalance) : '**** ****'}
              </span>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-xs text-white/80">Account status</span>
              <StatusBadge value={acc?.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-white/80">Account Number</span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
              >
                <span className="tabular-nums tracking-wide">{acc?.accountNumber}</span>
                <Copy className="h-4 w-4" />
                {copied && <span className="text-xs text-white/70">Copied</span>}
              </button>
              <span className="text-xs text-white/70">{acc?.accountName} • {acc?.accountType}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/transfer"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-burgundy-deep shadow-sm"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Send Money
              </Link>
              <Link
                to="/transactions"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                <List className="h-4 w-4" />
                Transaction History
              </Link>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-charcoal">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <Link
              to="/transfer"
              className="inline-flex items-center justify-between rounded-lg border border-border bg-blush/60 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-blush"
            >
              <span>Transfer Money</span>
              <ArrowRightLeft className="h-4 w-4 text-burgundy-wine" />
            </Link>
            <Link
              to="/transactions"
              className="inline-flex items-center justify-between rounded-lg border border-border bg-blush/60 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-blush"
            >
              <span>View Transactions</span>
              <List className="h-4 w-4 text-burgundy-wine" />
            </Link>
            <Link
              to="/beneficiaries"
              className="inline-flex items-center justify-between rounded-lg border border-border bg-blush/60 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-blush"
            >
              <span>Manage Beneficiaries</span>
              <List className="h-4 w-4 text-burgundy-wine" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center justify-between rounded-lg border border-border bg-blush/60 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-blush"
            >
              <span>Profile & Security</span>
              <List className="h-4 w-4 text-burgundy-wine" />
            </Link>
          </div>
        </Card>
      </div>
      <Card className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal">Recent Transactions</h2>
          <Link to="/transactions" className="text-sm font-semibold text-burgundy-wine hover:text-burgundy-deep">
            View all
          </Link>
        </div>
        {data?.recentTransactions?.length === 0 ? (
          <p className="text-sm text-muted">You have no recent transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Reference</th>
                  <th className="px-3 py-2 font-semibold">Narration</th>
                  <th className="px-3 py-2 font-semibold">Counterparty</th>
                  <th className="px-3 py-2 font-semibold text-right">Amount</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.recentTransactions?.map((tx) => (
                  <tr key={tx.reference} className="text-sm text-charcoal">
                    <td className="whitespace-nowrap px-3 py-3 text-muted">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{tx.reference}</td>
                    <td className="max-w-xs truncate px-3 py-3">{tx.narration || '—'}</td>
                    <td className="px-3 py-3">{tx.counterparty?.accountName || '—'}</td>
                    <td className={`whitespace-nowrap px-3 py-3 text-right font-semibold ${tx.direction === 'CREDIT' ? 'text-success' : 'text-charcoal'}`}>
                      {tx.direction === 'CREDIT' ? '+' : '-'} {tx.amountFormatted}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge value={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
