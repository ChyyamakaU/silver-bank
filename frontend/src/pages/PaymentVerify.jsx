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

        if (!cancelled) {
          setStatus('success');
          setMessage('Your account has been funded successfully.');
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

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="mb-4 text-2xl font-bold text-charcoal">
        {status === 'verifying'
          ? 'Verifying Payment'
          : status === 'success'
            ? 'Payment Successful'
            : 'Payment Verification Failed'}
      </h1>

      <p className="mb-6 text-muted">{message}</p>

      {status !== 'verifying' && (
        <Link
          to="/account"
          className="font-semibold text-charcoal underline"
        >
          Return to My Account
        </Link>
      )}
    </div>
  );
};

export default PaymentVerify;