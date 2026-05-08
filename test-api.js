// Simple test script for FitForge Buddy API
const testAPI = async () => {
  const baseURL = 'https://fitforge-buddy-main.vercel.app/api';
  
  console.log('Testing FitForge Buddy API...\n');
  
  // Test health endpoint
  try {
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test registration endpoint
  try {
    const registerResponse = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://fitforge-buddy-main.vercel.app'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration test:', registerData);
  } catch (error) {
    console.log('❌ Registration test failed:', error.message);
  }
};

testAPI(); 