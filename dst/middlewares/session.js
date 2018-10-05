"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * セッションミドルウェア
 */
const connectRedis = require("connect-redis");
const session = require("express-session");
const redis_1 = require("../redis");
const EXPIRES = parseInt(process.env.USER_EXPIRES_IN_SECONDS, 10);
exports.default = session({
    secret: 'cinerino-console-session-secret',
    resave: false,
    rolling: true,
    saveUninitialized: false,
    store: new (connectRedis(session))({
        client: redis_1.default
    }),
    cookie: {
        secure: true,
        httpOnly: true,
        // tslint:disable-next-line:no-magic-numbers
        maxAge: EXPIRES * 1000
    }
});
