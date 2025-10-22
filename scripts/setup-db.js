/**
 * Database Setup Script
 * Run this to create the database migration and push the schema
 */

const { execSync } = require('child_process');

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Push schema to database (for development)
    console.log('🗄️  Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log('✅ Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with the correct DATABASE_URL');
    console.log('2. Run: npm run dev');
    console.log('3. Test the authentication flow');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your DATABASE_URL in .env');
    console.log('3. Ensure the database exists');
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabase();
}
