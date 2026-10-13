import React from 'react';

const styles = {
  COMPLETED: 'bg-success/10 text-success border border-success/20',
  PENDING: 'bg-pending/10 text-pending border border-pending/20',
  FAILED: 'bg-danger/10 text-danger border border-danger/20',
  REVERSED: 'bg-muted/10 text-muted border border-muted/20',
  CREDIT: 'bg-success/10 text-success border border-success/20',
  DEBIT: 'bg-danger/10 text-danger border border-danger/20',
};

const StatusBadge = ({ value, className = '' }) => {
  const key = String(value || '').toUpperCase();
  const cls = styles[key] || 'bg-muted/10 text-muted border border-muted/20';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls} ${className}`}>
      {key}
    </span>
  );
};

export default StatusBadge;
