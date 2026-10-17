import { useEffect, useState } from 'react';
import api from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [recon, setRecon] = useState(null);

  const load = async () => {
    const [s, c, a, r] = await Promise.all([
      api.get('/admin/statistics'),
      api.get('/admin/customers'),
      api.get('/admin/audit-logs?limit=10'),
      api.get('/admin/reconciliation'),
    ]);
    setStats(s.data.data);
    setCustomers(c.data.data?.items || []);
    setAudit(a.data.data?.items || []);
    setRecon(r.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (accountId, currentStatus) => {
    const next = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    await api.patch(`/admin/accounts/${accountId}/status`, { status: next });
    await load();
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">Admin Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted">Customers</span>
          <span className="text-2xl font-bold text-charcoal">{stats?.customers ?? 0}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted">Active Accounts</span>
          <span className="text-2xl font-bold text-charcoal">{stats?.activeAccounts ?? 0}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted">Frozen Accounts</span>
          <span className="text-2xl font-bold text-charcoal">{stats?.frozenAccounts ?? 0}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-muted">Total Transfer Volume</span>
          <span className="text-2xl font-bold text-charcoal">{stats?.totalTransferVolumeFormatted ?? '₦0.00'}</span>
        </Card>
      </div>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-charcoal">Customers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Account No.</th>
                <th className="px-3 py-2 font-semibold">Balance</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id} className="text-sm text-charcoal">
                  <td className="px-3 py-3">{c.fullName}</td>
                  <td className="px-3 py-3 text-muted">{c.email}</td>
                  <td className="px-3 py-3 font-mono text-xs">{c.account?.accountNumber}</td>
                  <td className="px-3 py-3">{c.account?.availableBalanceFormatted}</td>
                  <td className="px-3 py-3">
                    <StatusBadge value={c.account?.status} />
                  </td>
                  <td className="px-3 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleStatus(c.account?.id, c.account?.status)}
                    >
                      {c.account?.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-charcoal">Recent Audit Logs</h2>
          <div className="flex flex-col divide-y divide-border">
            {audit.map((a) => (
              <div key={a.id} className="flex flex-col gap-1 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-charcoal">{a.action}</span>
                  <span className="text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <span className="text-xs text-muted">{a.actor?.fullName || 'System'}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-charcoal">Reconciliation</h2>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <span>Checked: {recon?.accountsChecked}</span>
            <span>Inconsistent: {recon?.accountsInconsistent}</span>
            <span>Consistent: {recon?.consistent ? 'Yes' : 'No'}</span>
            <span>Malformed Transfers: {recon?.malformedTransferCount}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
