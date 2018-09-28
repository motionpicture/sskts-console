/**
 * Expressアプリケーション
 */
import * as middlewares from '@motionpicture/express-middleware';
import * as sskts from '@motionpicture/sskts-domain';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as createDebug from 'debug';
import * as express from 'express';
import * as expressLayouts from 'express-ejs-layouts';
// tslint:disable-next-line:no-require-imports no-var-requires
const flash = require('express-flash');
import errorHandler from './middlewares/errorHandler';
import notFoundHandler from './middlewares/notFoundHandler';
import session from './middlewares/session';

import mongooseConnectionOptions from './mongooseConnectionOptions';

const debug = createDebug('sskts-console:*');
const app = express();

app.use(middlewares.basicAuth({ // ベーシック認証
    name: process.env.BASIC_AUTH_NAME,
    pass: process.env.BASIC_AUTH_PASS
    // unauthorizedHandler: (__, res, next) => {
    //     res.setHeader('WWW-Authenticate', 'Basic realm="sskts-console Authentication"');
    //     next(new Error());
    // }
}));

app.set('trust proxy', 1); // trust first proxy
app.use(session);
app.use(flash());

// view engine setup
app.set('views', `${__dirname}/../views`);
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout extractScripts', true);

app.use(bodyParser.json());
// The extended option allows to choose between parsing the URL-encoded data
// with the querystring library (when false) or the qs library (when true).
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// 静的ファイル
app.use(express.static(`${__dirname}/../public`));
app.use('/node_modules', express.static(`${__dirname}/../node_modules`));

sskts.mongoose.connect(<string>process.env.MONGOLAB_URI, mongooseConnectionOptions)
    .then(() => { debug('MongoDB connected.'); })
    // tslint:disable-next-line:no-console
    .catch(console.error);

// routers
import router from './routes/router';
app.use('/', router);

// 404
app.use(notFoundHandler);

// error handlers
app.use(errorHandler);

export = app;
