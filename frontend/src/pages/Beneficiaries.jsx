import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Trash2 } from 'lucide-react';

const Beneficiaries = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ accountNumber: '', nickname: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    const { data } = await api.get('/beneficiaries');
    setItems(data.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const add = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/beneficiaries', form);
      setForm({ accountNumber: '', nickname: '' });
      await load();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to add beneficiary';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/beneficiaries/${id}`);
    await load();
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">Beneficiaries</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold text-charcoal">Add Beneficiary</h2>
          <form onSubmit={add} className="flex flex-col gap-4">
            <Input
              label="Account number"
              name="accountNumber"
              placeholder="0000000000"
              value={form.accountNumber}
              onChange={handleChange}
              maxLength={10}
            />
            <Input
              label="Nickname (optional)"
              name="nickname"
              placeholder="e.g. Mum"
              value={form.nickname}
              onChange={handleChange}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add beneficiary'}
            </Button>
          </form>
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-charcoal">My Beneficiaries</h2>
          <div className="flex flex-col divide-y divide-border">
            {items.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-charcoal">{b.accountName}</p>
                  <p className="text-xs text-muted tabular-nums">{b.accountNumber} • {b.nickname || '—'}</p>
                </div>
                <button
                  onClick={() => remove(b.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-danger hover:bg-blush"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="py-4 text-sm text-muted">You have no saved beneficiaries yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Beneficiaries;
