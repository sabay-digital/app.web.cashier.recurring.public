var _ = require('lodash');
var axios = require('axios');
var { STATUS_COMPLETED, STATUS_PENDING } = require('ssn-constants');

/**
 * @param {Array} transactions 
 * 
 * @returns {Promise}
 */
const transactionIsPending = (transactions) => {
  return new Promise((resolve, reject) => {
    // If there are more than 1 transaction records,
    // check if transaction with this `reference_id`
    // is already completed.
    if (transactions.length > 1) {
      _.forEach(transactions, transaction => {
        if (transaction.txn_status == STATUS_COMPLETED) {
          return reject({ status: 403, message: 'Transaction is already completed.' });
        }
      });
    }

    const transaction = _.find(transactions, ['txn_status', STATUS_PENDING]);

    if (transaction && (transaction.txn_status == STATUS_PENDING)) {
      return resolve(transaction);
    }

    return reject({ status: 403, message: 'Transaction is invalid.' });
  });
}


/**
 * @param {Object} cashierInfo 
 * @param {Object} req 
 * 
 * @returns {Promise}
 */
const verifyTransaction = (req) => {
  return new Promise((resolve, reject) => {
    const url = process.env.PP_URL + '/rest-api/verifyTransaction';

    const formParams = {
      data: {
        orderID: req.query.orderID,
        processorID: req.query.processorID,
      }
    };

    axios({
      method: 'POST',
      url,
      headers: { 'Content-Type': 'application/json' },
      data: formParams
    }).then(({ data: response_data }) => {
      if (
        response_data.resultCode == '0000' && 
        response_data.data.processorID == req.query.processorID
      ) {
        return resolve();
      }

      const error = new Error(`Transaction failed with resultCode: ${data.resultCode}`);
      error.status = 403;

      reject(error);
    }).catch(reject);
  });
}


module.exports = {
  transactionIsPending,
  verifyTransaction
};
