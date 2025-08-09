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

    const [companies] = await Promise.all([
      sqlPool.request().query("SELECT TOP 10 * FROM Companiezz WHERE Id > 0 AND Id != 6;"),
      // sqlPool.request().query("SELECT * FROM ContactsLOL"),
    ]);

    console.log(`Fetched ${companies.recordset.length} rows from Companiezz`);

    const mysqlConn = await mysql.createConnection(mysqlConfig);

    // disable foreign keys and truncate tables so IDs can be reused
    await mysqlConn.query("SET FOREIGN_KEY_CHECKS=0");
    await mysqlConn.query("TRUNCATE TABLE ContactsLOL");
    await mysqlConn.query("TRUNCATE TABLE Companiezz");
    await mysqlConn.query("SET FOREIGN_KEY_CHECKS=1");

    for (const row of companies.recordset) {
      await mysqlConn.query(
        `INSERT INTO Companiezz (Id, CompanyName, Country, City, FullAddress, Website, CategoryGoogle, RatingGoogle, RatedCount, GoogleMapsUrl, BigFishScore, Classification, MarkdownNote) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.Id,
          row.CompanyName,
          row.Country,
          row.City,
          row.FullAddress,
          row.Website,
          row.CategoryGoogle,
          row.RatingGoogle,
          row.RatedCount,
          row.GoogleMapsUrl,
          row.BigFishScore,
          row.Classification,
          row.MarkdownNote,
        ]
      );
    }

    console.log("Data migration complete!");
    await mysqlConn.end();
    await sqlPool.close();
  } catch (err) {
    console.error("Error during migration:", err);
  }
}

migrate();
