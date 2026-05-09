const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://bizops:bizops_dev_password@localhost:5432/hindustan?schema=public'
});

async function run() {
  try {
    const result = await pool.query('DELETE FROM "VerificationOTP"');
    console.log('Deleted', result.rowCount, 'rows from VerificationOTP');
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await pool.end();
  }
}

run();
