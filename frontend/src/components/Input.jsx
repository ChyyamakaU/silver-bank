import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = React.forwardRef(
  ({ label, error, className = '', id, type = 'text', ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const isPassword = type === 'password';
    const [show, setShow] = useState(false);
    const resolvedType = isPassword && show ? 'text' : type;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={`w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-burgundy-wine/30 focus:border-burgundy-wine ${isPassword ? 'pr-11' : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((prev) => !prev)}
              aria-label={show ? 'Hide password' : 'Show password'}
              aria-pressed={show}
              title={show ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-charcoal focus:outline-none focus:text-charcoal"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
