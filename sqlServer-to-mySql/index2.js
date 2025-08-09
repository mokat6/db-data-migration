const mssql = require("mssql");
const mysql = require("mysql2/promise");

async function migrate() {
  const sqlServerConfig = {
    user: "sa",
    password: "lol123@XX239",
    server: "127.0.0.1",
    database: "VoltoRepoBigData",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  const mysqlConfig = {
    host: "127.0.0.1",
    user: "root",
    password: "dontTellMom",
    database: "VoltoRepoBigData",
  };

  try {
    const sqlPool = await mssql.connect(sqlServerConfig);
    const mysqlConn = await mysql.createConnection(mysqlConfig);

    // Clear MySQL tables first
    // await mysqlConn.query("TRUNCATE TABLE Companiezz");
    // await mysqlConn.query("TRUNCATE TABLE ContactsLOL");

    // Fetch all rows (remove TOP 10 for real migration)
    const [table1Results, table2Results] = await Promise.all([
      sqlPool.request().query("SELECT top 10 * FROM Companiezz"),
      sqlPool.request().query("SELECT top 10 * FROM ContactsLOL"),
    ]);

    console.log(`Fetched ${table1Results.recordset.length} rows from Companiezz`);
    console.log(`Fetched ${table2Results.recordset.length} rows from ContactsLOL`);

    // Helper to batch insert
    async function batchInsert(tableName, rows, batchSize = 1000) {
      if (rows.length === 0) return;
      const keys = Object.keys(rows[0]);
      const placeholders = "(" + keys.map(() => "?").join(",") + ")";
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const values = batch.flatMap((row) => keys.map((k) => row[k]));
        const sql = `INSERT INTO ${tableName} (${keys.join(",")}) VALUES ${Array(batch.length)
          .fill(placeholders)
          .join(",")}`;
        await mysqlConn.query(sql, values);
        console.log(`Inserted ${i + batch.length} / ${rows.length} rows into ${tableName}`);
      }
    }

    // Insert data in batches
    await batchInsert("Companiezz", table1Results.recordset);
    await batchInsert("ContactsLOL", table2Results.recordset);

    console.log("Data migration complete!");
    await mysqlConn.end();
    await sqlPool.close();
  } catch (err) {
    console.error("Error during migration:", err);
  }
}

migrate();
