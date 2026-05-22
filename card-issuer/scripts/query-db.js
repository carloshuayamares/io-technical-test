const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB path relative to this script: card-issuer/scripts -> ../../data/issuer.db
const dbPath = path.join(__dirname, '..', '..', 'data', 'issuer.db');

const args = process.argv.slice(2);
const requestId = args[0];

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

const query = requestId
  ? 'SELECT * FROM card_issues WHERE requestId = ?'
  : 'SELECT * FROM card_issues';

const params = requestId ? [requestId] : [];

db.all(query, params, (err, rows) => {
  if (err) {
    console.error('Query error:', err);
    db.close();
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No rows found.');
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }

  db.close();
});
