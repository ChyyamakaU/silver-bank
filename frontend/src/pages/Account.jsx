import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Card from '../components/Card';

const formatCurrency = (v) => {
  const num = Number(v || 0) / 100;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(num);
};

const Account = () => {
  const { account: ctxAccount } = useAuth();
  const [account, setAccount] = useState(ctxAccount);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/accounts/me');
      setAccount(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">My Account</h1>
      <Card className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Account Name</span>
          <span className="text-base font-semibold text-charcoal">{account?.accountName}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Account Number</span>
          <span className="text-base font-semibold text-charcoal tabular-nums">{account?.accountNumber}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Account Type</span>
          <span className="text-base font-semibold text-charcoal">{account?.accountType}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Status</span>
          <span className="text-base font-semibold text-charcoal">{account?.status}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Available Balance</span>
          <span className="text-xl font-bold text-charcoal tabular-nums">{formatCurrency(account?.availableBalance)}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Ledger Balance</span>
          <span className="text-xl font-bold text-charcoal tabular-nums">{formatCurrency(account?.ledgerBalance)}</span>
        </div>
      </Card>
    </div>
  );
};

export default Account;
