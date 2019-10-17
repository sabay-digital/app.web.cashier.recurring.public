var clickhouse = require('./clickhouse');
var mysql = require('mysql');

const table = `${process.env.CH_DB_DATABASE}.transaction`;

/**
 * @param {Array} values 
 * 
 * @returns {Promise}
 */
const create = (values) => {
  // columns that would be get insert
  let columns = [
    'timestamp', 'uuid', 'txn_status', 'from',
    'to', 'memo', 'amount', 'asset_issuer', 'asset_code', 'callback_url', 'pp_response', 'ssn_txn_hash'
  ];

  // convert `columns` array to string
  columns = `(${columns.join(',')})`; // ex: (timestamp,uuid ...)

  // convert `values` array to string
  values = `(${values.join(',')})`; // ex: (1,abc ...)

  const query = `INSERT INTO ${table} ${columns} VALUES ${values};`;

  return clickhouse.query(query).toPromise();
};

/**
 * @param {string} reference_id 
 * 
 * @returns {Promise}
 */
const findByReferenceID = (reference_id) => {
  reference_id = mysql.escape(reference_id);

  const query = `SELECT * FROM ${table} WHERE uuid = ${reference_id};`;

  return clickhouse.query(query).toPromise();
}

module.exports = {
  create,
  findByReferenceID
};
