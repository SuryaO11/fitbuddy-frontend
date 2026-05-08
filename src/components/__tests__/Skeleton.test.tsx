import * as React from 'react';
import { render } from '@testing-library/react';
import Skeleton from '../ui/skeleton';

describe('Skeleton', () => {
  it('renders with the correct className', () => {
    const { container } = render(<Skeleton className="h-4 w-4" />);
    expect(container.firstChild).toHaveClass('h-4 w-4');
  });
}); 