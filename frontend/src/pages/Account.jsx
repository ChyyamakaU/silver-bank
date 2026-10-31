import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Card from '../components/Card';

const formatCurrency = (v) => {
  const num = Number(v || 0) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(num);
};

const Account = () => {
  const { account: ctxAccount } = useAuth();
  const [account, setAccount] = useState(ctxAccount);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/accounts/me');
    setAccount(data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFunding = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post('/accounts/funding/initialize', {
        amount: Number(amount),
      });

      window.location.href = data.data.authorizationUrl;
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to initialize payment.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">
        My Account
      </h1>

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
          <span className="text-xl font-bold text-charcoal tabular-nums">
            {formatCurrency(account?.availableBalance)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Ledger Balance</span>
          <span className="text-xl font-bold text-charcoal tabular-nums">
            {formatCurrency(account?.ledgerBalance)}
          </span>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-charcoal">Fund Account</h2>

        <form onSubmit={handleFunding} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">
              Amount (NGN)
            </label>

            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-charcoal px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default Account;