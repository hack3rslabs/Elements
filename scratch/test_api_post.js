const fetch = require('node-fetch');

async function test() {
  const payload = {
    name: "Test Roof Tile",
    sku: "TEST-ROOF-1",
    price: 100,
    mrp: 120,
    categoryName: "ROOF TILES",
    stock: 10,
    description: "test",
    images: []
  };

  try {
    const res = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'elements-admin-key-2026'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

test();
