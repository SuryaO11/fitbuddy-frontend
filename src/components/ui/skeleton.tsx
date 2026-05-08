import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-muted-foreground/10 animate-pulse rounded ${className}`} />
);

export default Skeleton;
