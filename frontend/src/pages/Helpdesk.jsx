import React from 'react';
import Card from '../components/Card';

const Helpdesk = () => (
  <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold text-charcoal sm:text-4xl">Helpdesk</h1>
      <p className="text-base text-muted">Need assistance? We are here to help.</p>
    </div>
    <Card className="space-y-3">
      <h2 className="text-xl font-semibold text-charcoal">Contact Us</h2>
      <p className="text-sm text-muted">Email: support@silverbank.demo</p>
      <p className="text-sm text-muted">Phone: 0700-SILVERBANK</p>
      <p className="text-xs text-muted">Operating hours: 8:00 AM - 6:00 PM (Mon - Fri)</p>
    </Card>
  </div>
);

export default Helpdesk;
