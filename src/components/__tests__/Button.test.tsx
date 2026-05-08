import * as React from 'react';
import { render, screen } from '@testing-library/react';
import Button from '../ui/button';

describe('Button', () => {
  it('renders the button with text', () => {
    render(<Button className="bg-blue-500">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
}); 