import * as React from 'react';

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
>(({ className = '', children, ...props }, ref) => (
  <button
    ref={ref}
    className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded font-semibold transition-all duration-150
      bg-primary text-black shadow-sm
      hover:bg-primary/90 hover:shadow-md
      focus:outline-none focus:ring-2 focus:ring-primary/50
      active:bg-primary/80 active:shadow-inner
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}`}
    {...props}
  >
    {children}
  </button>
));

Button.displayName = 'Button';
export default Button;
