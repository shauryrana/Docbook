const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('--- MediSlot Database Initialization ---');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

    console.log('1. Executing schema.sql...');
    await client.query(schemaSql);
    console.log('✓ Schema created successfully.');

    console.log('2. Executing seed.sql...');
    await client.query(seedSql);
    console.log('✓ Seed data inserted successfully.');

    console.log('\nDemo accounts ready:');
    console.log(' - Admin:   rohan.admin@gmail.com   / password123 (Rohan Verma)');
    console.log(' - Doctor:  dishti7@gmail.com       / password123 (Dr. Dishti Kaushik)');
    console.log(' - Doctor:  gunjan8@gmail.com       / password123 (Dr. Gunjan Sharma)');
    console.log(' - Patient: rahul.patient@gmail.com / password123 (Rahul Verma)');
  } catch (err) {
    console.error('Error running database setup:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
