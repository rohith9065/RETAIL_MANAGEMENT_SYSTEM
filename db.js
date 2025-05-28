const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // Use your actual password
  database: 'ecommerce' // Use your actual database name
});

module.exports = db;
