var dotenv = require('dotenv');
var { ClickHouse } = require('clickhouse');

dotenv.config();

// setup connection
const clickhouse = new ClickHouse({
  url: process.env.CH_DB_HOST,
  port: process.env.CH_DB_PORT,
  database: process.env.CH_DB_DATABASE,
  basicAuth: {
    username: process.env.CH_DB_USERNAME,
    password: process.env.CH_DB_PASSWORD,
  }
});

module.exports = clickhouse;
