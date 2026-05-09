const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://bizops:bizops_dev_password@localhost:5432/hindustan?schema=public'
});

async function run() {
  try {
    const result = await pool.query(
      `SELECT email, phone, role, name FROM "User" WHERE role IN ('ADMIN', 'STAFF', 'SUB_ADMIN') ORDER BY role`
    );
    console.log('Admin/Staff accounts:');
    result.rows.forEach(r => console.log(`  ${r.role} | ${r.email} | ${r.phone} | ${r.name}`));
    if (result.rows.length === 0) console.log('  (none found)');
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await pool.end();
  }
}

run();
