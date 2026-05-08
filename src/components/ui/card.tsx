import React from 'react';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { className?: string }
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-background shadow-sm transition-all duration-150
      hover:shadow-md focus-within:shadow-lg
      focus-within:border-primary/60
      ${className}`}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';
export default Card;
