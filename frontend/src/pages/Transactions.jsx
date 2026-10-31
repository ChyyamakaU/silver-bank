
import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

const Transactions = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [receipt, setReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/accounts/me/transactions', {
        params: { page, limit: 10 },
      });
      setItems(data.data?.items || []);
      setPagination(data.data?.pagination || null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const viewReceipt = async (reference) => {
    setReceipt(null);
    setReceiptError('');
    setReceiptLoading(true);

    try {
      const { data } = await api.get(
        `/accounts/funding/${encodeURIComponent(reference)}/receipt`
      );
      setReceipt(data.data);
    } catch (error) {
      setReceiptError(
        error.response?.data?.message ||
          'Unable to retrieve this receipt. Please try again.'
      );
    } finally {
      setReceiptLoading(false);
    }
  };

  const closeReceipt = () => {
    setReceipt(null);
    setReceiptError('');
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            .receipt-print,
            .receipt-print * {
              visibility: visible !important;
            }

            .receipt-print {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 30px !important;
              background: white !important;
              color: black !important;
            }

            .receipt-no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">
        Transaction History
      </h1>

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
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {items.map((tx) => (
                <tr key={tx.reference} className="text-sm text-charcoal">
                  <td className="whitespace-nowrap px-3 py-3 text-muted">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">
                    {tx.reference}
                  </td>

                  <td className="max-w-xs truncate px-3 py-3">
                    {tx.narration || '—'}
                  </td>

                  <td className="px-3 py-3">
                    {tx.counterparty?.accountName || '—'}
                  </td>

                  <td
                    className={`whitespace-nowrap px-3 py-3 text-right font-semibold ${
                      tx.direction === 'CREDIT'
                        ? 'text-success'
                        : 'text-charcoal'
                    }`}
                  >
                    {tx.direction === 'CREDIT' ? '+' : '-'} {tx.amountFormatted}
                  </td>

                  <td className="px-3 py-3">{tx.direction}</td>

                  <td className="px-3 py-3">
                    <StatusBadge value={tx.status} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-3">
                    {tx.type === 'FUNDING' && tx.status === 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => viewReceipt(tx.reference)}
                        className="font-semibold text-charcoal underline hover:text-muted"
                      >
                        View Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {items.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-sm text-muted"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <p className="text-center text-sm text-muted">
            Loading transactions...
          </p>
        )}

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
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {(receiptLoading || receiptError || receipt) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            {receiptLoading && (
              <p className="py-8 text-center text-muted">
                Loading receipt...
              </p>
            )}

            {receiptError && (
              <div className="py-6 text-center">
                <p className="mb-4 text-sm text-red-600">{receiptError}</p>
                <button
                  type="button"
                  onClick={closeReceipt}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            )}

            {receipt && (
              <>
                <div className="receipt-print">
                  <div className="mb-6 border-b border-border pb-5 text-center">
                    <h2 className="text-2xl font-bold text-charcoal">
                      SILVER BANK
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Account Funding Receipt
                    </p>
                    <p className="mt-3 text-lg font-bold text-success">
                      PAYMENT SUCCESSFUL
                    </p>
                  </div>

                  <div className="mb-6 text-center">
                    <p className="text-sm text-muted">Amount Funded</p>
                    <p className="mt-1 text-3xl font-bold text-charcoal">
                      {receipt.amountFormatted}
                    </p>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Receipt Number</span>
                      <span className="text-right font-semibold">
                        {receipt.receiptNumber}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Customer Name</span>
                      <span className="text-right font-semibold">
                        {receipt.customerName}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Customer ID</span>
                      <span className="text-right font-semibold">
                        {receipt.customerId}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Account Name</span>
                      <span className="text-right font-semibold">
                        {receipt.accountName}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Account Number</span>
                      <span className="text-right font-semibold">
                        {receipt.accountNumber}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Transaction Reference</span>
                      <span className="max-w-[60%] break-all text-right font-mono text-xs">
                        {receipt.transactionReference}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Payment Method</span>
                      <span className="font-semibold">
                        {receipt.paymentMethod}
                      </span>
                    </div>

                    {receipt.paymentChannel && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted">Payment Channel</span>
                        <span className="font-semibold">
                          {receipt.paymentChannel}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Transaction Date</span>
                      <span className="text-right font-semibold">
                        {new Date(receipt.transactionDate).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Status</span>
                      <span className="font-bold text-success">
                        {receipt.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
                    Thank you for banking with Silver Bank.
                  </div>
                </div>

                <div className="receipt-no-print mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeReceipt}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-charcoal hover:bg-blush"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={printReceipt}
                    className="rounded-lg bg-charcoal px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Print / Save as PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
