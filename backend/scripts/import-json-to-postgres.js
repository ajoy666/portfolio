const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function toBool(value) {
  return value === true || value === 1 || value === '1';
}

async function insertRows(client, table, rows) {
  if (!rows.length) {
    return;
  }

  for (const row of rows) {
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const quotedColumns = columns.map((column) => `"${column}"`).join(', ');

    await client.query(
      `
        INSERT INTO "${table}" (${quotedColumns})
        VALUES (${placeholders})
        ON CONFLICT (id) DO NOTHING
      `,
      values
    );
  }
}

async function resetSequence(client, table) {
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('${table}', 'id'),
      COALESCE((SELECT MAX(id) FROM "${table}"), 1),
      true
    )
  `);
}

async function main() {
  const inputPath = process.env.EXPORT_PATH || path.resolve(__dirname, './sqlite-export.json');

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  data.projects = (data.projects || []).map((row) => ({
    ...row,
    is_featured: toBool(row.is_featured),
  }));

  data.project_screenshots = (data.project_screenshots || []).map((row) => ({
    ...row,
    is_thumbnail: toBool(row.is_thumbnail),
  }));

  data.skills = (data.skills || []).map((row) => ({
    ...row,
    is_active: toBool(row.is_active),
  }));

  data.social_links = (data.social_links || []).map((row) => ({
    ...row,
    is_active: toBool(row.is_active),
  }));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === 'false'
        ? false
        : {
            rejectUnauthorized: false,
          },
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await insertRows(client, 'users', data.users || []);
    await insertRows(client, 'abouts', data.abouts || []);
    await insertRows(client, 'contacts', data.contacts || []);
    await insertRows(client, 'skill_categories', data.skill_categories || []);
    await insertRows(client, 'skills', data.skills || []);
    await insertRows(client, 'projects', data.projects || []);
    await insertRows(client, 'project_screenshots', data.project_screenshots || []);
    await insertRows(client, 'social_links', data.social_links || []);

    await resetSequence(client, 'users');
    await resetSequence(client, 'abouts');
    await resetSequence(client, 'contacts');
    await resetSequence(client, 'skill_categories');
    await resetSequence(client, 'skills');
    await resetSequence(client, 'projects');
    await resetSequence(client, 'project_screenshots');
    await resetSequence(client, 'social_links');

    await client.query('COMMIT');

    console.log('Import completed.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
