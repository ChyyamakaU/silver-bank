import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

const Transactions = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/accounts/me/transactions', { params: { page, limit: 10 } });
      setItems(data.data?.items || []);
      setPagination(data.data?.pagination || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">Transaction History</h1>
      <Card className="flex flex-col gap-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Reference</th>
                <th className="px-3 py-2 font-semibold">Narration</th>
                <th className="px-3 py-2 font-semibold">Counterparty</th>
                <th className="px-3 py-2 font-semibold text-right">Amount</th>
                <th className="px-3 py-2 font-semibold">Direction</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((tx) => (
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
                  <td className="px-3 py-3">{tx.direction}</td>
                  <td className="px-3 py-3">
                    <StatusBadge value={tx.status} />
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-charcoal hover:bg-blush disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-sm text-muted">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-charcoal hover:bg-blush disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Transactions;
