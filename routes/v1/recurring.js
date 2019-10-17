var express     = require('express');
var router      = express.Router();
var querystring = require('querystring');
var axios       = require('axios');
var mysql       = require('mysql');
var uuidv4      = require('uuid/v4');
var controller  = require('../../app/controllers/recurring');
var Transaction   = require('../../database/clickhouse/transaction');
var { now, verifySignature,signSignature } = require('ssn-utils');
var { STATUS_COMPLETED } = require('ssn-constants');

// [POST] /v1/recurring/{payment_address}
router.post('/:payment_address', (req, res, next) => {

  // define variables  
  let network_address;

  // resolve network address from payment address
  return axios.post(process.env.PAYMENT_ADDRESS_URL, 
    querystring.stringify({
      payment_address: req.params.payment_address,
      asset_issuer: process.env.CASHIER_PK,
      public_key: process.env.CASHIER_LOCAL_SIGNER_PK
    })
  ).then(result => {
    if (result.data.status && result.data.status != 200) {
      return Promise.reject(result.data);
    }
    // successfully get network_address
    network_address = result.data.network_address;
    console.log(result.data);
    /**
     * BELOW INFORMATION COULD BE USED TO CONSTRUCT AUTHORIZE PAYMENT OBJECT
     */
    const currency = result.data.asset_code;
    const orderDate = controller.getOrderDate();
    const orderAmount = '1';

  })
  .then((result) => {
    // CHECK AUTH_REQUIRED FROM ACCOUNT
    console.log('Init transaction for ' + req.params.payment_address + ' with na: ' + network_address);

    const orderid = uuidv4(); // Reference ID
    /**
     * BELOW SECTION IS FOR SPECIFIC IMPLEMENTATION OF YOUR PAYMENT PROVIDER FOR PAYMENT AUTHORIZATION
     * FROM USER AND LOG TO DATABASE OF YOUR CHOICE.
     * 
     *  Example below log to Clickhouse database and payment authorization form to be implemented
     */

    // Insert pending log of transaction into ClickHouse
    // return Transaction.create([
    //   mysql.escape(now()), // timestamp
    //   mysql.escape(orderid), // uuid
    //   mysql.escape(STATUS_COMPLETED), // txn_status
    //   mysql.escape(process.env.CASHIER_PK), // from
    //   mysql.escape(network_address), // to
    //   mysql.escape(message.details.memo), // memo
    //   mysql.escape(message.details.payment.amount), // amount
    //   mysql.escape(process.env.CASHIER_PK), // asset_issuer
    //   mysql.escape(message.details.payment.asset_code), // asset_code
    //   mysql.escape(""), // callback_url
    //   mysql.escape(""), // pp_response
    //   mysql.escape(""), // ssn_txn_hash
    // ])
    // .then(() =>  {
    //   return res.send('TO BE IMPLEMENTED FOR PAYMENT AUTHORIZATION');
    // });
    return res.send('TO BE IMPLEMENTED FOR PAYMENT AUTHORIZATION');
  })
  .catch(error => {
    console.log(error);
    if (error) {
      return res.send(error);
    }
    // no error's response has found
    next(error);
  });
});


// [DELETE] /v1/recurring/{payment_address}
router.delete('/:payment_address', (req, res, next) => {
  // RESOLVE PAYMENT ADDRESS
    // define variables  
    let network_address, msg;

    // resolve network address from payment address
    return axios.post(process.env.PAYMENT_ADDRESS_URL, 
      querystring.stringify({
        payment_address: req.params.payment_address
      })
    ).then(result => {
      if (result.data.status && result.data.status != 200) {
        return Promise.reject(result.data);
      }
      // successfully get network_address
      network_address = result.data.network_address;
    })
    .then(data => {
      // VERIFY TRUST
      msg = req.protocol + '://' + req.get('host') + req.originalUrl;

      // sign message with local signer secret key
      return signSignature(msg, process.env.CASHIER_LOCAL_SIGNER_SK);
    })
    .then((signature) => {
      return verifySignature(msg, signature, network_address);
    })
    .then((isVerify) => {
      let payment_addresss = req.params.payment_address.split('*');
      if (isVerify) {
        console.log('Transaction for ' + payment_addresss[0] + ' dropped succesfully!' )
        // DELETE TRANSACTION FROM DB AND STOP RECURRING CHARGE
      } else {
        console.log('Transaction for ' + payment_addresss[0] + ' dropped fail!' )
      }
    });
});

module.exports = router;
