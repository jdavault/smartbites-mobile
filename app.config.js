const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// Only show once
if (!process.env.__CONFIG_LOADED__) {
  process.env.__CONFIG_LOADED__ = 'true';

  // Quick environment check
  console.log(
    `🚀 ${APP_ENV.toUpperCase()} | ${SUPABASE_URL.substring(0, 35)}...`
  );

  // Critical safety check
  if (APP_ENV === 'production' && SUPABASE_URL.includes('ngrok')) {
    console.error('\n❌ Production cannot point to ngrok!\n');
    process.exit(1);
  }
}

// Export app.json
module.exports = require('./app.json').expo || require('./app.json');
