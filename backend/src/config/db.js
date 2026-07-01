const { Pool } = require('pg');

let pool = null;
let db = null;

function convertSqlitePlaceholders(sql) {
  let index = 0;

  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function normalizeParams(params) {
  if (params === undefined || params === null) {
    return [];
  }

  return Array.isArray(params) ? params : [params];
}

function createDbClient(queryRunner) {
  return {
    async query(sql, params = []) {
      return queryRunner.query(sql, normalizeParams(params));
    },

    async get(sql, params = []) {
      const result = await queryRunner.query(
        convertSqlitePlaceholders(sql),
        normalizeParams(params)
      );

      return result.rows[0] || null;
    },

    async all(sql, params = []) {
      const result = await queryRunner.query(
        convertSqlitePlaceholders(sql),
        normalizeParams(params)
      );

      return result.rows;
    },

    async run(sql, params = []) {
      const result = await queryRunner.query(
        convertSqlitePlaceholders(sql),
        normalizeParams(params)
      );

      return {
        rowCount: result.rowCount,
        rows: result.rows,
        lastID: result.rows?.[0]?.id || null,
      };
    },

    async exec(sql) {
      return queryRunner.query(sql);
    },
  };
}

async function getDb() {
  if (db) {
    return db;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === 'false'
        ? false
        : {
            rejectUnauthorized: false,
          },
  });

  db = {
    ...createDbClient(pool),

    async transaction(callback) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const trx = createDbClient(client);
        const result = await callback(trx);

        await client.query('COMMIT');

        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };

  return db;
}

module.exports = getDb;
