const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://bizops:bizops_dev_password@localhost:5432/hindustan?schema=public'
});
pool.query(`UPDATE "User" SET email='skceramics999@gmail.com' WHERE email='admin@elements.com' RETURNING email, role, name`)
  .then(r => { console.log('Updated:', r.rows); pool.end(); })
  .catch(e => { console.log('Error:', e.message); pool.end(); });
