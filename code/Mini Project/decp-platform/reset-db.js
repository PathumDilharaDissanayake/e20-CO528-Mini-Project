/**
 * DECP Platform — Database Reset Script
 * Clears all data from every service database (tables stay, data is wiped).
 *
 * Usage:
 *   1. Stop services:  stop.bat
 *   2. Reset data:     node reset-db.js
 *   3. Start services: start.bat
 *   4. Re-seed:        node seed.js
 */

let pg;
try { pg = require('pg'); }
catch {
  try { pg = require('./backend/auth-service/node_modules/pg'); }
  catch {
    console.error('Cannot find pg module. Run:  npm install pg  in the project root.');
    process.exit(1);
  }
}

const { Client } = pg;

const DATABASES = [
  'decp_auth',
  'decp_users',
  'decp_feed',
  'decp_jobs',
  'decp_events',
  'decp_research',
  'decp_messaging',
  'decp_notifications',
  'decp_analytics',
];

const DB_CONFIG = { host: 'localhost', port: 5432, user: 'postgres', password: '12345' };

async function resetDatabase(dbName) {
  const client = new Client({ ...DB_CONFIG, database: dbName });
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
    );
    if (rows.length === 0) {
      process.stdout.write(`  \x1b[33m⚠\x1b[0m ${dbName}: no tables yet (service hasn't started?)\n`);
      return;
    }
    const tables = rows.map((r) => `"${r.tablename}"`).join(', ');
    await client.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
    process.stdout.write(`  \x1b[32m✔\x1b[0m ${dbName} — ${rows.length} table(s) cleared\n`);
  } catch (e) {
    process.stdout.write(`  \x1b[31m✗\x1b[0m ${dbName}: ${e.message}\n`);
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  console.log('\n\x1b[1m\x1b[36m  ╔══════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[36m  ║    DECP Platform — Database Reset    ║\x1b[0m');
  console.log('\x1b[1m\x1b[36m  ╚══════════════════════════════════════╝\x1b[0m\n');
  console.log('  \x1b[1mClearing all service databases...\x1b[0m\n');

  for (const db of DATABASES) {
    await resetDatabase(db);
  }

  console.log('\n  \x1b[1m\x1b[32mAll databases reset successfully.\x1b[0m');
  console.log('  ➜  Start services: \x1b[1mstart.bat\x1b[0m');
  console.log('  ➜  Re-seed data:   \x1b[1mnode seed.js\x1b[0m\n');
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
