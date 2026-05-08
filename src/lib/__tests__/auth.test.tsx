import * as React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth';

// Mock the API service
jest.mock('../api', () => ({
  apiService: {
    login: jest.fn().mockResolvedValue({ success: true, data: { _id: '1', name: 'Test User', email: 'test@test.com', role: 'user' } }),
    register: jest.fn().mockResolvedValue({ success: true, data: { _id: '1', name: 'Test User', email: 'test@test.com', role: 'user' } }),
    logout: jest.fn(),
    isAuthenticated: jest.fn().mockReturnValue(false),
    getCurrentUser: jest.fn().mockResolvedValue({ success: false }),
  },
}));

const TestComponent = () => {
  const { isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span>{isAuthenticated ? 'Logged in' : 'Logged out'}</span>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  it('toggles authentication state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText('Logged out')).toBeInTheDocument();
    
    await act(async () => {
      screen.getByText('Login').click();
    });
    
    expect(screen.getByText('Logged in')).toBeInTheDocument();
    
    act(() => {
      screen.getByText('Logout').click();
    });
    
    expect(screen.getByText('Logged out')).toBeInTheDocument();
  });
}); 