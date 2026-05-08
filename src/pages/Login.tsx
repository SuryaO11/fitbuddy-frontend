import React, { useState } from 'react';
import { useAuth } from "../lib/auth";
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, firebaseLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with email:', email);

      // Use the auth context login function
      await login(email, password);

      // Redirect to home page using React Router
      navigate("/");
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await firebaseLogin('google');
      navigate("/");
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await firebaseLogin('github');
      navigate("/");
    } catch (err: unknown) {
      console.error('GitHub login error:', err);
      setError(err instanceof Error ? err.message : 'GitHub login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await firebaseLogin('facebook');
      navigate("/");
    } catch (err: unknown) {
      console.error('Facebook login error:', err);
      setError(err instanceof Error ? err.message : 'Facebook login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await firebaseLogin('twitter');
      navigate("/");
    } catch (err: unknown) {
      console.error('Twitter login error:', err);
      setError(err instanceof Error ? err.message : 'Twitter login failed');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ backgroundColor: 'hsl(0, 0%, 96%)', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'center', minHeight: 'calc(100vh - 40px)' }}>
          {/* Left Column - Welcome Section */}
          <div style={{ flex: 1, textAlign: 'center', padding: '20px' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.2' }}>
              Welcome to <br />
              <span style={{ color: '#fd7e14' }}>FitForge Buddy</span>
            </h1>
            <p style={{ color: 'hsl(217, 10%, 50.8%)', fontSize: '1.1rem', lineHeight: '1.6' }}>
              Your personal fitness companion. Track workouts, monitor progress, and achieve your fitness goals with our comprehensive platform designed to support your journey to a healthier lifestyle.
            </p>
          </div>

          {/* Right Column - Login Form */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '10px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
              padding: '40px', 
              width: '100%', 
              maxWidth: '400px' 
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px' }}>Login</h2>
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                {error && (
                  <div style={{ 
                    color: '#dc3545', 
                    fontSize: '14px', 
                    textAlign: 'center', 
                    padding: '10px', 
                    backgroundColor: '#f8d7da', 
                    borderRadius: '5px', 
                    marginBottom: '20px' 
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    marginBottom: '20px'
                  }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ marginBottom: '15px', color: '#666' }}>or login with:</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                  <button
                    onClick={handleFacebookLogin}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1877f2',
                      fontSize: '20px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    <i className="fab fa-facebook-f"></i>
                  </button>
                  <button
                    onClick={handleTwitterLogin}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1da1f2',
                      fontSize: '20px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    <i className="fab fa-twitter"></i>
                  </button>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#db4437',
                      fontSize: '20px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    <i className="fab fa-google"></i>
                  </button>
                  {/* <button
                    onClick={handleGithubLogin}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#333',
                      fontSize: '20px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    <i className="fab fa-github"></i>
                  </button> */}
                </div>
              </div>

                              <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>
                    Don&apos;t have an account? <a href="/signup" style={{ color: '#fd7e14', textDecoration: 'none' }}>Sign up</a>
                  </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 