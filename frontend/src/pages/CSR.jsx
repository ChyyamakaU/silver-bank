import React from 'react';
import Card from '../components/Card';

const CSR = () => (
  <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold text-charcoal sm:text-4xl">Corporate Social Responsibility</h1>
      <p className="text-base text-muted">Driving positive impact in the communities we serve.</p>
    </div>
    <Card className="space-y-3">
      <h2 className="text-xl font-semibold text-charcoal">Our Commitment</h2>
      <p className="text-sm text-muted leading-relaxed">
        Silver Bank is committed to supporting financial literacy, digital inclusion, and sustainable development initiatives across Nigeria.
      </p>
    </Card>
  </div>
);

export default CSR;
