
const clickhouse = require('../database/clickhouse/clickhouse');

const query = `CREATE TABLE IF NOT EXISTS transaction (
  timestamp DateTime,
  uuid String,
  txn_status String,
  from   String,
  to   String,
  memo   String,
  amount  String,
  asset_issuer String,
  asset_code String,
  callback_url String,
  pp_response String,
  ssn_txn_hash String
) ENGINE = MergeTree() ORDER BY timestamp`;

clickhouse.query(query).toPromise();


