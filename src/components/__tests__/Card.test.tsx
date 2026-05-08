import * as React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../ui/card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card className="p-4">Hello Card</Card>);
    expect(screen.getByText('Hello Card')).toBeInTheDocument();
  });
}); 