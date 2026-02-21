// migrate-mysql-to-postgres.js
const mysql = require("mysql2/promise");
const { Pool } = require("pg");

const CHUNK_SIZE = 500;
const TABLE_NAME = "users";

async function migrate() {
  const mysqlConfig = {
    host: "127.0.0.1",
    user: "root",
    password: "dontTellMom",
    database: "anyksciaibus",
  };

  const pgConfig = {
    host: "rock5t.local",
    port: 5432,
    user: "admin",
    password: "1234",
    database: "anyksciaibus",
  };

  try {
    const mysqlConn = await mysql.createConnection(mysqlConfig);
    const pgPool = new Pool(pgConfig);

    // ---- DISABLE FK CHECKS ----
    await pgPool.query(`SET session_replication_role = replica`);

    // Get list of columns in Postgres table
    const { rows: pgColumns } = await pgPool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [TABLE_NAME]
    );
    const pgColumnNames = pgColumns.map((r) => r.column_name);

    // Fetch all data from MySQL
    const [rows] = await mysqlConn.query(`SELECT * FROM ${TABLE_NAME}`);
    console.log(`Fetched ${rows.length} rows from MySQL`);

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);

      for (const row of chunk) {
        // Only include columns that exist in Postgres
        const filteredRow = Object.fromEntries(Object.entries(row).filter(([col]) => pgColumnNames.includes(col)));

        const columns = Object.keys(filteredRow)
          .map((col) => `"${col}"`)
          .join(", ");
        const values = Object.values(filteredRow);
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(",");

        const sql = `INSERT INTO "${TABLE_NAME}" (${columns}) VALUES (${placeholders})`;
        await pgPool.query(sql, values);
      }

      console.log(`Inserted rows ${i + 1} to ${i + chunk.length} into PostgreSQL`);
    }
    // ---- RE-ENABLE FK CHECKS ----
    await pgPool.query(`SET session_replication_role = DEFAULT`);

    console.log("Migration complete!");
    await mysqlConn.end();
    await pgPool.end();
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrate();
