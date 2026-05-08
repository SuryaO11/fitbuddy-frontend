// Test MongoDB connection
import mongoose from 'mongoose';

const testMongoDB = async () => {
  const mongoURI = 'mongodb+srv://sourav2000ranjan:Sourav%40999@srvcluster.foibe.mongodb.net/fitforge-buddy?retryWrites=true&w=majority&appName=srvcluster';
  
  console.log('Testing MongoDB connection...\n');
  console.log('MongoDB URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
  
  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    console.log('Ready State:', conn.connection.readyState);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.log('❌ MongoDB Connection Failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔑 Authentication Error - Check your username and password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 Network Error - Check your cluster URL');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🚫 Connection Refused - Check network access settings');
    }
  }
};

testMongoDB(); 