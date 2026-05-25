const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB path relative to this script: card-processor/scripts -> ../../data/processor.db
const dbPath = path.join(__dirname, '..', '..', 'data', 'processor.db');

const args = process.argv.slice(2);
const requestId = args[0];

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

const query = requestId
  ? 'SELECT * FROM card_processor WHERE requestId = ?'
  : 'SELECT * FROM card_processor';

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
