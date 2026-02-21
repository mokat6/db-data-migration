// migrate-mysql-to-postgres.js
const mysql = require("mysql2/promise");
const { Pool } = require("pg");

const CHUNK_SIZE = 500;

const TABLE_NAME = "line";

async function migrate() {
  // MySQL connection config (source)
  const mysqlConfig = {
    host: "127.0.0.1",
    user: "root",
    password: "dontTellMom",
    database: "anyksciaibus", // your old MySQL DB
  };

  // PostgreSQL connection config (target)
  const pgConfig = {
    host: "rock5t.local",
    port: 5432,
    user: "admin",
    password: "1234",
    database: "anyksciaibus",
  };

  try {
    // Connect to MySQL
    const mysqlConn = await mysql.createConnection(mysqlConfig);

    // Connect to PostgreSQL
    const pgPool = new Pool(pgConfig);

    // Fetch data from MySQL table
    const [rows] = await mysqlConn.query(`SELECT * FROM ${TABLE_NAME}`);
    console.log(`Fetched ${rows.length} rows from MySQL`);

    // Insert in chunks to PostgreSQL
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);

      // Sequential insert (safe)
      for (const row of chunk) {
        // Build query dynamically
        const columns = Object.keys(row)
          .map((col) => `"${col}"`)
          .join(", ");
        const values = Object.values(row);
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");

        const sql = `INSERT INTO "${TABLE_NAME}" (${columns}) VALUES (${placeholders})`;
        await pgPool.query(sql, values);
      }

      console.log(`Inserted rows ${i + 1} to ${i + chunk.length} into PostgreSQL`);
    }

    console.log("Migration complete!");
    await mysqlConn.end();
    await pgPool.end();
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrate();
