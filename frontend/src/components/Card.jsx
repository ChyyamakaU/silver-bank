import React from 'react';

const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-white border border-border rounded-2xl p-6 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
