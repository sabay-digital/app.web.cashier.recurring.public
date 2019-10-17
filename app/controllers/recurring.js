var moment = require('moment-timezone');
var crypto = require('crypto');

/**
 * @return {string}
 */
const getOrderDate = () => {
  return moment().tz('Asia/Phnom_Penh').format('YYYY-MMDDTHH:mm:ss.SSSZZ');
};


/**
 * @param {string} mid 
 * @param {string} orderid 
 * @param {string} orderAmount 
 * 
 * @returns {string}
 */
const getDigest = (mid, orderid, orderAmount) => {
  let data = `${mid}${orderid}${orderAmount}`;

  return crypto.createHash('md5').update(data).digest('hex');
};




module.exports = {
  getOrderDate,
  getDigest
};
