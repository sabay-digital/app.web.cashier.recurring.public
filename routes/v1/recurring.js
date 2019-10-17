var express     = require('express');
var router      = express.Router();
var querystring = require('querystring');
var axios       = require('axios');
var { decrypt } = require('sdk.nacl.ssn.digital');
var { now }     = require('ssn-utils');
var mysql       = require('mysql');
var uuidv4      = require('uuid/v4');
var controller  = require('../../app/controllers/recurring');

var Transaction   = require('../../database/clickhouse/transaction');
var { STATUS_PENDING } = require('ssn-constants');

// [POST] /v1/recurring/{payment_address}
router.post('/:payment_address', (req, res, next) => {

  // define variables  
  let network_address;

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
  .then(message => {
    // Call to SSN API for verifying trust, using network_address
    return axios.post(process.env.API_SSN_URL + '/verify/trust', 
      querystring.stringify({
        account: network_address, 
        asset_code: message.details.payment.asset_code, 
        asset_issuer: process.env.CASHIER_PK
      })
    )
    .then((result) => {
      
      if (result.data.status && result.data.status != 200) {
        return Promise.reject(result.data);
      }
      
      // Get current url port and host only ex: `http://localhost:4000`
      var localUrl = req.protocol + '://' + req.headers.host;
     
      /**
       * BELOW INFORMATION COULD BE USED TO CONSTRUCT AUTHORIZE PAYMENT OBJECT
       */
      const currency = message.details.payment.asset_code;
      const orderDate = controller.getOrderDate();
      const orderid = uuidv4(); // Reference ID
      const orderAmount = message.details.payment.amount;

      /**
       * BELOW SECTION IS FOR SPECIFIC IMPLEMENTATION OF YOUR PAYMENT PROVIDER FOR PAYMENT AUTHORIZATION
       * FROM USER AND LOG TO DATABASE OF YOUR CHOICE.
       * 
       *  Example below log to Clickhouse database and payment authorization form to be implemented
       */

      // Insert pending log of transaction into ClickHouse
      return Transaction.create([
        mysql.escape(now()), // timestamp
        mysql.escape(orderid), // uuid
        mysql.escape(STATUS_PENDING), // txn_status
        mysql.escape(process.env.CASHIER_PK), // from
        mysql.escape(network_address), // to
        mysql.escape(message.details.memo), // memo
        mysql.escape(message.details.payment.amount), // amount
        mysql.escape(process.env.CASHIER_PK), // asset_issuer
        mysql.escape(message.details.payment.asset_code), // asset_code
        mysql.escape(localUrl + '/api/notify'), // callback_url
        mysql.escape(""), // pp_response
        mysql.escape(""), // ssn_txn_hash
       
      ])
      .then(() =>  {
        return res.send('TO BE IMPLEMENTED FOR PAYMENT AUTHORIZATION');
      });

    })
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

});

module.exports = router;
