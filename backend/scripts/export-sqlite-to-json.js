const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const TABLES = [
  'users',
  'abouts',
  'contacts',
  'projects',
  'project_screenshots',
  'skill_categories',
  'skills',
  'social_links',
];

async function main() {
  const databasePath = process.env.SQLITE_PATH || path.resolve(__dirname, '../database.sqlite');
  const outputPath = process.env.EXPORT_PATH || path.resolve(__dirname, './sqlite-export.json');

  const db = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });

  const data = {};

  for (const table of TABLES) {
    data[table] = await db.all(`SELECT * FROM ${table} ORDER BY id ASC`);
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  await db.close();

  console.log(`Exported SQLite data to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
