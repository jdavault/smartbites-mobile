#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'development';
const envFile = `.env.${env}`;
const targetFile = '.env';

if (!fs.existsSync(envFile)) {
  console.error(`❌ Environment file ${envFile} not found!`);
  console.log('Available environments:');
  const envFiles = fs.readdirSync('.').filter(f => f.startsWith('.env.') && f !== '.env.example');
  envFiles.forEach(f => console.log(`  - ${f.replace('.env.', '')}`));
  process.exit(1);
}

try {
  fs.copyFileSync(envFile, targetFile);
  console.log(`✅ Switched to ${env} environment`);
  console.log(`📄 Copied ${envFile} → ${targetFile}`);
} catch (error) {
  console.error(`❌ Failed to switch environment:`, error.message);
  process.exit(1);
}