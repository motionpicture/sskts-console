"use strict";
/**
 * Expressアプリケーション
 */
const middlewares = require("@motionpicture/express-middleware");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
// tslint:disable-next-line:no-require-imports no-var-requires
const flash = require('express-flash');
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const session_1 = require("./middlewares/session");
const app = express();
app.use(middlewares.basicAuth({
    name: process.env.BASIC_AUTH_NAME,
    pass: process.env.BASIC_AUTH_PASS
    // unauthorizedHandler: (__, res, next) => {
    //     res.setHeader('WWW-Authenticate', 'Basic realm="cinerino-console Authentication"');
    //     next(new Error());
    // }
}));
app.set('trust proxy', 1); // trust first proxy
app.use(session_1.default);
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
// routers
const router_1 = require("./routes/router");
app.use('/', router_1.default);
// 404
app.use(notFoundHandler_1.default);
// error handlers
app.use(errorHandler_1.default);
module.exports = app;
