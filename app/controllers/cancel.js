var _ = require('lodash');
var { STATUS_CANCELED, STATUS_PENDING } = require('ssn-constants');

/**
 * @param {Array} transactions 
 * 
 * @returns {Promise}
 */
const shouldInsertCancelTransaction = (transactions) => {
  return new Promise(resolve => {
    let shouldInsert = false, transaction = null;

    shouldInsert = !_.some(transactions, ['txn_status', STATUS_CANCELED]);
    transaction = _.find(transactions, ['txn_status', STATUS_PENDING]);

    resolve([shouldInsert, transaction]);
  });
}

module.exports = shouldInsertCancelTransaction;
