import * as React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { AuthContextType, AuthProvider, AuthContext } from '../lib/auth';

const TestAuthProvider: React.FC<{ value: Partial<AuthContextType>; children: React.ReactNode }> = ({ value, children }) => {
  const defaultValue: AuthContextType = {
    user: value.user ?? null,
    login: value.login ?? (async () => {}),
    register: value.register ?? (async () => {}),
    logout: value.logout ?? (() => {}),
    isAuthenticated: value.isAuthenticated ?? false,
    role: value.role ?? null,
    loading: value.loading ?? false,
  };
  return (
    <AuthContext.Provider value={defaultValue}>
      {children}
    </AuthContext.Provider>
  );
};

describe('App', () => {
  it('renders the dashboard when authenticated', () => {
    render(
      <TestAuthProvider value={{ isAuthenticated: true, role: 'user' }}>
        <App />
      </TestAuthProvider>
    );
    expect(screen.getByText(/FitForge Buddy/i)).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    render(
      <TestAuthProvider value={{ isAuthenticated: false, role: null }}>
        <App />
      </TestAuthProvider>
    );
    expect(screen.getByText(/Email/i)).toBeInTheDocument();
  });
}); 