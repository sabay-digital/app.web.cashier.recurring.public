var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var dotenv = require('dotenv');
var helmet = require('helmet');
var cors = require('cors');
var expressErrorSlack = require('express-error-slack');

var app = express();

dotenv.config();

app.set('views', __dirname + '/resources/views');
app.set('view engine', 'ejs');
app.set('trust proxy', true);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: '*'
}));
app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ===== Routes V1=====
var router = express.Router();
router.use('/status', require('./routes/v1/status'));
router.use('/info', require('./routes/v1/info'));
router.use('/recurring', require('./routes/v1/recurring'));
app.use('/v1', router);
// ==========

// error reporting to slack webhook
// app.use(expressErrorSlack({
//   webhookUri: process.env.SLACK_WEBHOOK_URL
// }));

module.exports = app;
