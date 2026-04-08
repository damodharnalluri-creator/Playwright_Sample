import sql from 'msnodesqlv8';
const connectionString = "Driver={SQL Server Native Client 11.0};Server=localhost;Database=PlaywrightDB;Trusted_Connection=yes;";

sql.query(connectionString, "SELECT * FROM Users", (err, rows) => {
  if (err) {
    console.error("Error executing query:", err);
    return;
  }
  console.log("Query results:", rows);
});
