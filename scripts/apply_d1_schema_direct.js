import fs from 'fs';

const content = fs.readFileSync(process.env.APPDATA + '/xdg.config/.wrangler/config/default.toml', 'utf8');
const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
if (!match) {
  console.error('No oauth_token found in default.toml');
  process.exit(1);
}
const token = match[1];
const accountId = '767ce92674d0bd477eef696c995faf16';
const databaseId = '7da18b7d-5f22-4648-b3af-e3d9022e7fc4';
const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

const sql = fs.readFileSync('worker/schema.sql', 'utf8');
const stmts = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Starting direct D1 migration for ${stmts.length} SQL statements...`);

const BATCH_SIZE = 20;
const totalBatches = Math.ceil(stmts.length / BATCH_SIZE);

async function run() {
  for (let b = 0; b < totalBatches; b++) {
    const start = b * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, stmts.length);
    const batchStmts = stmts.slice(start, end);
    const sqlChunk = batchStmts.join(';\n') + ';';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: sqlChunk })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Batch ${b + 1}/${totalBatches} HTTP Error:`, res.status, err);
      process.exit(1);
    }

    const data = await res.json();
    if (!data.success) {
      console.error(`Batch ${b + 1}/${totalBatches} D1 Error:`, JSON.stringify(data.errors));
      process.exit(1);
    }

    console.log(`✓ Batch ${b + 1}/${totalBatches} executed (${batchStmts.length} stmts).`);
  }

  // Verify total animal count
  const verifyRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql: 'SELECT count(*) as count FROM animal;' })
  });
  const verifyData = await verifyRes.json();
  const count = verifyData.result?.[0]?.results?.[0]?.count;
  console.log(`🎉 Migration complete! Total animals in remote D1: ${count}`);
}

run();

