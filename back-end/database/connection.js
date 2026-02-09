require("dotenv").config();

var knex = require("knex")({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: (dbPass = process.env.DB_PASS),
    database: (dbName = process.env.DB_NAME),
  },
});

module.exports = knex;
