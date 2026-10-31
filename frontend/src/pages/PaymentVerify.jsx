
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const { refreshAccount, loading, user } = useAuth();

  const reference =
    searchParams.get('reference') || searchParams.get('trxref');

  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [receipt, setReceipt] = useState(null);
  const [receiptError, setReceiptError] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!reference) {
      setStatus('failed');
      setMessage('Payment reference not found.');
      return;
    }

    if (!user) {
      setStatus('failed');
      setMessage('Your session has expired. Please log in again.');
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        await api.get(
          `/accounts/funding/verify/${encodeURIComponent(reference)}`
        );

        await refreshAccount();

        if (cancelled) return;

        setStatus('success');
        setMessage('Your account has been funded successfully.');

        try {
          const response = await api.get(
            `/accounts/funding/${encodeURIComponent(reference)}/receipt`
          );

          if (!cancelled) {
            setReceipt(response.data.data);
          }
        } catch (error) {
          if (!cancelled) {
            setReceiptError(
              error.response?.data?.message ||
                'Your payment was successful, but we could not load the receipt.'
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('failed');
          setMessage(
            error.response?.data?.message ||
              'We could not verify your payment.'
          );
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [reference, loading, user]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';

    return new Date(date).toLocaleString('en-GB', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .receipt-container {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              box-shadow: none !important;
              border: 1px solid #ddd !important;
            }
          }
        `}
      </style>

      <div className="no-print text-center">
        <h1 className="mb-4 text-2xl font-bold text-charcoal">
          {status === 'verifying'
            ? 'Verifying Payment'
            : status === 'success'
              ? 'Payment Successful'
              : 'Payment Verification Failed'}
        </h1>

        <p className="mb-6 text-muted">{message}</p>
      </div>

      {status === 'verifying' && (
        <div className="text-center">
          <p className="text-muted">Please wait while we confirm your payment.</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="no-print text-center">
          <Link
            to="/account"
            className="font-semibold text-charcoal underline"
          >
            Return to My Account
          </Link>
        </div>
      )}

      {status === 'success' && (
        <>
          {receipt && (
            <div className="receipt-container rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 border-b border-gray-200 pb-5 text-center">
                <h2 className="text-2xl font-bold text-charcoal">
                  SILVER BANK
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Account Funding Receipt
                </p>

                <div className="mt-5">
                  <p className="text-sm text-muted">Payment Status</p>
                  <p className="mt-1 font-bold text-green-600">
                    {receipt.status}
                  </p>
                </div>

                <p className="mt-4 text-3xl font-bold text-charcoal">
                  {receipt.amountFormatted}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted">Receipt Number</p>
                  <p className="break-all font-semibold text-charcoal">
                    {receipt.receiptNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">Customer Name</p>
                  <p className="font-semibold text-charcoal">
                    {receipt.customerName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">Customer ID</p>
                  <p className="font-semibold text-charcoal">
                    {receipt.customerId}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">Account Name</p>
                  <p className="font-semibold text-charcoal">
                    {receipt.accountName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">Account Number</p>
                  <p className="font-semibold text-charcoal">
                    {receipt.accountNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">Transaction Reference</p>
                  <p className="break-all font-semibold text-charcoal">
                    {receipt.transactionReference}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted">Payment Method</p>
                  <p className="font-semibold text-charcoal">
                    {receipt.paymentMethod}
                  </p>
                </div>

                {receipt.paymentChannel && (
                  <div>
                    <p className="text-xs text-muted">Payment Channel</p>
                    <p className="font-semibold text-charcoal">
                      {receipt.paymentChannel}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted">Transaction Date</p>
                  <p className="font-semibold text-charcoal">
                    {formatDate(receipt.transactionDate)}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4 text-center">
                <p className="text-sm text-muted">
                  Thank you for banking with Silver Bank.
                </p>
              </div>
            </div>
          )}

          {receiptError && (
            <p className="no-print mb-4 text-center text-sm text-red-600">
              {receiptError}
            </p>
          )}

          <div className="no-print mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {receipt && (
              <button
                onClick={handlePrint}
                className="rounded-lg bg-charcoal px-6 py-3 font-semibold text-white hover:opacity-90"
              >
                Download / Print Receipt
              </button>
            )}

            <Link
              to="/account"
              className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-charcoal hover:bg-gray-50"
            >
              Return to My Account
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentVerify;


