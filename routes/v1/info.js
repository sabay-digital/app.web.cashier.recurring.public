var express    = require('express');
var router     = express.Router();

router.get('/', (req, res, next) => {
  
  // preparing cashier info 
  var cashierInfo = {
    assets_issued : [
      {
        asset_issuer: process.env.CASHIER_PK,
        asset_code: "USD",
      }
    ],
    payment_provider: "{Payment Provider Name}",
    payment_type: "recurring",
    authorization: "none"
  };
  
  return res.send(cashierInfo);
 
});

module.exports = router;
