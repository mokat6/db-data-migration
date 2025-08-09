const mssql = require("mssql");
const mysql = require("mysql2/promise");

const CHUNK_SIZE = 500; // or 1000 or whatever suits you

async function migrate() {
  // ... your configs here
  const sqlServerConfig = {
    user: "sa",
    password: "lol123@XX239",
    server: "127.0.0.1", // e.g., "localhost"
    database: "VoltoRepoBigData",
    options: {
      encrypt: false, // Set to true if using Azure SQL
      trustServerCertificate: true,
    },
  };

  // MySQL connection config
  const mysqlConfig = {
    host: "127.0.0.1",
    user: "root",
    password: "dontTellMom",
    database: "VoltoRepoBigData",
  };

  try {
    const sqlPool = await mssql.connect(sqlServerConfig);

    const tableResults = await sqlPool.request().query("SELECT * FROM ContactsLOL");

    console.log(`Fetched ${tableResults.recordset.length} rows from ContactsLOL`);

    const mysqlConn = await mysql.createConnection(mysqlConfig);

    // Split into chunks
    for (let i = 0; i < tableResults.recordset.length; i += CHUNK_SIZE) {
      const chunk = tableResults.recordset.slice(i, i + CHUNK_SIZE);

      // Insert each row in chunk sequentially or in parallel

      // Sequential (simpler, safer)
      for (const row of chunk) {
        await mysqlConn.query(`INSERT INTO ContactsLOL SET ?`, row);
      }

      // Or you can do parallel with Promise.all (faster but be careful with DB load)
      // await Promise.all(chunk.map(row => mysqlConn.query(`INSERT INTO ContactsLOL SET ?`, row)));

      console.log(`Inserted rows ${i + 1} to ${i + chunk.length}`);
    }

    console.log("Data migration complete!");
    await mysqlConn.end();
    await sqlPool.close();
  } catch (err) {
    console.error("Error during migration:", err);
  }
}

migrate();
