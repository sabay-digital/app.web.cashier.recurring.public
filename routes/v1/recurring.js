var express     = require('express');
var router      = express.Router();
var querystring = require('querystring');
var axios       = require('axios');
var StellarSDK  = require('stellar-sdk');

var { decrypt }         = require('sdk.nacl.ssn.digital');
var { verifySignature } = require('ssn-utils');

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
    return decrypt(result.data.public_key, process.env.CASHIER_LOCAL_SIGNER_SK, result.data.encrypted);

  })
  .then((message) => {

    // CALL TO SSN API FOR CHECK TRUSTLINE
    return axios.post(process.env.API_SSN_URL + '/verify/trust', 
      querystring.stringify({
        account: network_address, 
        asset_code: message.details.payment.asset_code, 
        asset_issuer: process.env.CASHIER_PK
      })
    )
    .then((result) => {

      // REJECT IF TRUSTLINE NOT APPROVE
      if (result.data.status && result.data.status != 200) {
        return Promise.reject(result.data);
      }
     console.log(message.details.memo)
      // Create transaction channel accounts on the ssn api
      // Sample submit transaction to network between smart@home and soyo
      return axios.post(process.env.API_SSN_URL + '/create/transaction', 
        querystring.stringify({
          from: process.env.CASHIER_PK, // Smart@home Master Account
          to: "GA3336CDCBKOFJUOHZA3EYDHML7WNB5TJKA4OYF52RVZ2SITNEN2NWKT", // Recurring Master Account
          amount: message.details.payment.amount,
          memo: message.details.memo, 
          asset_code: message.details.payment.asset_code, 
          asset_issuer: process.env.CASHIER_PK
        })
      )
      .then(result => {
      
        if (result.data.status == 200) {
          // Load Transaction 
          const transaction = new StellarSDK.Transaction(result.data.envelope_xdr, process.env.NETWORK_PASSPHRASE);
          
          // Generate keypair
          const localSignerKeypair = StellarSDK.Keypair.fromSecret(process.env.CASHIER_LOCAL_SIGNER_SK);
        
          // get signature on transaction from keypair
          const signature = transaction.getKeypairSignature(localSignerKeypair);

          // sign transaction
          transaction.addSignature(localSignerKeypair.publicKey(), signature);

          // convert transaction to XDRString
          const xdrString = transaction.toEnvelope().toXDR('base64');
          
          return Promise.resolve(xdrString)
          .then((transactionXdr) => {

            const formParams = { xdr_string: transactionXdr };
            // make an API call to first sign's service to sign transaction.
            // on success will return response's data:
            // - xdr_string
            return axios.post(process.env.SIGN_1_ENDPOINT, formParams);
          })
          .then(({data}) => {
            return axios.post(process.env.SIGN_2_ENDPOINT, data);
          })
          .then(({data}) => {
              
            return axios.post(process.env.API_SSN_URL + '/transactions', 
              querystring.stringify({
                tx: data.xdr_string
              })
            )
            .then((result) => {
              console.log(result);
                /**
               * BELOW SECTION IS FOR SPECIFIC IMPLEMENTATION OF YOUR PAYMENT PROVIDER FOR PAYMENT AUTHORIZATION
               * FROM USER AND LOG TO DATABASE OF YOUR CHOICE.
               * 
               *  Example below log to Clickhouse database and payment authorization form to be implemented
              */
             return res.send({status: 200, title: "Transaction is successful.", transaction_hash: result.data.hash});
            })       
          })
          .then(() => {
            
          });
        }
      });
      
    });
  })
  .catch(error => {
    console.log(error);

    // UNEXPECTED SYSTEM ERROR
    if (error) {
      return res.status(500).json({status: 500, title: "Internal System Error"});
    }
    // no error's response has found
    next(error);
  });
});


// [DELETE] /v1/recurring/{payment_address}
router.delete('/:payment_address', (req, res, next) => {
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
      return verifySignature(req.params.payment_address, result.data.signature, result.data.network_address);
    })
    .then((isVerify) => {
      let payment_addresss = req.params.payment_address.split('*');
      if (isVerify) {
        // DELETE TRANSACTION FROM DB AND STOP RECURRING CHARGE
        console.log('Transaction for ' + payment_addresss[0] + ' dropped succesfully!');

        return res.status(200).json({status: 200, title: "recurring payment deleted"});
      } else {
        console.log('Transaction for ' + payment_addresss[0] + ' dropped fail!' ); // log the result
        return res.status(401).json({status: 401, title: "not authorized to delete subscription"});
      }
    })
    .catch(error => {
      console.log(error);

      // UNEXPECTED SYSTEM ERROR
      if (error) {
        return res.status(500).json({status: 500, title: "Internal System Error"});
      }

      // no error's response has found
      next(error);
    });
});

module.exports = router;
