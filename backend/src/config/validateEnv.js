const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalEnvVars = [
  'CLIENT_URL',
  'PORT',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'AWS_REGION'
];

const validateEnv = () => {
  const missing = [];
  
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    console.error('========================================');
    console.error('MISSING REQUIRED ENVIRONMENT VARIABLES:');
    missing.forEach((envVar) => console.error(`  - ${envVar}`));
    console.error('========================================');
    console.error('Please add these to your .env file and restart the server.');
    process.exit(1);
  }

  console.log('Environment validation passed');

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CLIENT_URL) {
      console.warn('WARNING: CLIENT_URL not set in production mode');
    }
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.warn('WARNING: JWT_SECRET should be at least 32 characters in production');
    }
  }
};

module.exports = {
  validateEnv,
  requiredEnvVars,
  optionalEnvVars
};
