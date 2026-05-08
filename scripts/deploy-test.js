#!/usr/bin/env node

/**
 * Deployment Test Script
 * Run this script to test if the application is ready for Vercel deployment
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Vercel Deployment Test...\n');

// Check if vercel.json exists
const vercelConfigPath = join(__dirname, '..', 'vercel.json');
if (existsSync(vercelConfigPath)) {
  console.log('✅ vercel.json configuration file found');
  try {
    const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
    console.log('📋 Vercel configuration:', JSON.stringify(vercelConfig, null, 2));
  } catch (error) {
    console.log('❌ Error reading vercel.json:', error.message);
  }
} else {
  console.log('❌ vercel.json not found');
}

// Check if package.json has required scripts
const packageJsonPath = join(__dirname, '..', 'package.json');
if (existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    console.log('\n📦 Package.json scripts check:');
    if (scripts.build) {
      console.log('✅ build script found');
    } else {
      console.log('❌ build script missing');
    }
    
    if (scripts.start) {
      console.log('✅ start script found');
    } else {
      console.log('❌ start script missing');
    }
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
  }
}

// Check server.js for Vercel compatibility
const serverPath = join(__dirname, '..', 'server', 'server.js');
if (existsSync(serverPath)) {
  const serverContent = readFileSync(serverPath, 'utf8');
  
  console.log('\n🚀 Server.js Vercel compatibility:');
  if (serverContent.includes('export default app')) {
    console.log('✅ Server exports app for Vercel functions');
  } else {
    console.log('❌ Server does not export app');
  }
  
  if (serverContent.includes('process.env.VERCEL')) {
    console.log('✅ Vercel environment detection implemented');
  } else {
    console.log('❌ Vercel environment detection missing');
  }
}

// Check if .env.vercel exists
const envVercelPath = join(__dirname, '..', '.env.vercel');
if (existsSync(envVercelPath)) {
  console.log('\n🔧 .env.vercel template found');
  const envContent = readFileSync(envVercelPath, 'utf8');
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} environment variable template found`);
    } else {
      console.log(`❌ ${varName} environment variable template missing`);
    }
  });
}

console.log('\n🎯 Deployment Test Summary:');
console.log('1. Add environment variables to Vercel dashboard');
console.log('2. Connect your GitHub repository to Vercel');
console.log('3. Deploy using: vercel --prod');
console.log('4. Test API endpoints after deployment');

console.log('\n📚 Check VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions');
