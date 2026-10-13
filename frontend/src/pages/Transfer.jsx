import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Search, CheckCircle2 } from 'lucide-react';

const Transfer = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ recipientAccountNumber: '', amount: '', narration: '', idempotencyKey: '', pin: '' });
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pinNotSet, setPinNotSet] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setRecipient(null);
    setError(null);
  };

  const lookup = async () => {
    if (!form.recipientAccountNumber || form.recipientAccountNumber.length !== 10) {
      setError('Enter a valid 10-digit account number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/transfers/lookup-recipient', {
        accountNumber: form.recipientAccountNumber,
      });
      setRecipient(data.data);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Recipient not found';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const proceed = () => {
    if (recipient) {
      setStep('review');
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setPinNotSet(false);
    try {
      const payload = { ...form };
      if (!payload.idempotencyKey) {
        payload.idempotencyKey = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }
      const { data } = await api.post('/transfers', payload);
      setResult(data.data);
      setStep('success');
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'PIN_NOT_SET') {
        setPinNotSet(true);
        setError('You need to set a transaction PIN before sending money.');
      } else {
        setError(err?.response?.data?.error?.message || 'Transfer failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">Transfer Money</h1>
      {step === 'form' && (
        <Card className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-charcoal">Recipient Details</h2>
            <p className="text-sm text-muted">Enter the recipient’s 10-digit account number and confirm their name.</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Account number"
                name="recipientAccountNumber"
                placeholder="0000000000"
                value={form.recipientAccountNumber}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
            <Button onClick={lookup} disabled={loading} className="sm:w-auto">
              <Search className="h-4 w-4" />
              Lookup
            </Button>
          </div>
          {recipient && (
            <div className="rounded-xl border border-border bg-blush/60 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-semibold text-charcoal">{recipient.accountName}</p>
                  <p className="text-xs text-muted">{recipient.accountNumber} • {recipient.bankName}</p>
                </div>
              </div>
            </div>
          )}
          <Input
            label="Amount (NGN)"
            name="amount"
            placeholder="1000.00"
            value={form.amount}
            onChange={handleChange}
          />
          <Input
            label="Narration (optional)"
            name="narration"
            placeholder="e.g. Rent payment"
            value={form.narration}
            onChange={handleChange}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button disabled={!recipient} onClick={proceed}>
              Review transfer
            </Button>
          </div>
        </Card>
      )}
      {step === 'review' && (
        <Card className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <h2 className="text-lg font-semibold text-charcoal">Review & Confirm</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted">Recipient</span>
              <span className="font-medium text-charcoal">{recipient?.accountName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted">Account Number</span>
              <span className="font-medium text-charcoal tabular-nums">{recipient?.accountNumber}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted">Amount</span>
              <span className="font-semibold text-charcoal tabular-nums">{form.amount} NGN</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted">Narration</span>
              <span className="font-medium text-charcoal">{form.narration || '—'}</span>
            </div>
          </div>
          <Input
            label="Transaction PIN"
            type="password"
            name="pin"
            placeholder="4 digits"
            inputMode="numeric"
            maxLength={4}
            value={form.pin}
            onChange={(e) => {
              setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) });
              setError(null);
              setPinNotSet(false);
            }}
          />
          {error && (
            <p className="text-sm text-danger">
              {error}
              {pinNotSet && (
                <>
                  {' '}
                  <Link to="/profile" className="font-semibold underline">
                    Set your PIN
                  </Link>
                </>
              )}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep('form')}>
              Back
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm & Send'}
            </Button>
          </div>
        </Card>
      )}
      {step === 'success' && result && (
        <Card className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <h2 className="text-xl font-semibold text-charcoal">Transfer Successful</h2>
          <p className="text-sm text-muted">Your transfer has been processed successfully.</p>
          <div className="w-full divide-y divide-border rounded-xl border border-border text-left">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted">Reference</span>
              <span className="font-mono text-sm">{result.reference}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted">Amount</span>
              <span className="font-semibold text-charcoal">{result.amountFormatted}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted">Recipient</span>
              <span className="font-medium text-charcoal">{result.recipient?.accountName}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/transactions')}>
              View transactions
            </Button>
            <Button onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Transfer;
