const fs = require('fs');

const content = fs.readFileSync('c:\\Hindustan-elements\\Elements\\src\\constants\\categories.ts', 'utf8');
const slugs = [];
const regex = /slug:\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  slugs.push(match[1]);
}

const counts = {};
slugs.forEach(s => counts[s] = (counts[s] || 0) + 1);

const duplicates = Object.keys(counts).filter(s => counts[s] > 1);
if (duplicates.length > 0) {
  console.log('Duplicates found:');
  duplicates.forEach(s => console.log(`- ${s} (${counts[s]} times)`));
} else {
  console.log('No duplicates found.');
}
