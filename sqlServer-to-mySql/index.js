// migrate.js
const mssql = require("mssql");
const mysql = require("mysql2/promise");

async function migrate() {
  // SQL Server connection config
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
    // 1️⃣ Connect to SQL Server
    const sqlPool = await mssql.connect(sqlServerConfig);

    // 2️⃣ Fetch data from both tables
    const [table1Results, table2Results] = await Promise.all([
      // sqlPool.request().query("SELECT  * FROM Companiezz WHERE Id > 0"),
      sqlPool.request().query("Select  * from ContactsLOL"),
    ]);

    console.log(`Fetched ${table1Results.recordset.length} rows from Table1`);
    // console.log(`Fetched ${table2Results.recordset.length} rows from Table2`);

    // 3️⃣ Connect to MySQL
    const mysqlConn = await mysql.createConnection(mysqlConfig);

    // 4️⃣ Insert into MySQL
    // NOTE: Assumes MySQL schema matches SQL Server schema
    // You may need to map columns manually if names differ

    // for (const row of table1Results.recordset) {
    //   await mysqlConn.query(`INSERT INTO Companiezz SET ?`, row);
    // }

    for (const row of table1Results.recordset) {
      await mysqlConn.query(`INSERT INTO ContactsLOL SET ?`, row);
    }

    console.log("Data migration complete!");
    await mysqlConn.end();
    await sqlPool.close();
  } catch (err) {
    console.error("Error during migration:", err);
  }
}

migrate();
