var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  res.json({status: 200, title: "ready"});
});

module.exports = router;
