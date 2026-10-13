import React from 'react';

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-burgundy-wine text-white hover:bg-burgundy-deep focus-visible:outline-burgundy-wine shadow-sm',
  secondary:
    'bg-white text-charcoal border border-border hover:bg-blush focus-visible:outline-burgundy-wine',
  ghost: 'text-burgundy-wine hover:bg-blush',
  danger: 'bg-danger text-white hover:brightness-95 focus-visible:outline-danger',
};

const Button = React.forwardRef(
  ({ className = '', variant = 'primary', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';

export default Button;
