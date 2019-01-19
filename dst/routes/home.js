"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ホームルーター
 */
// import * as createDebug from 'debug';
const express = require("express");
const ssktsapi = require("../ssktsapi");
// const debug = createDebug('cinerino-console:routes');
const homeRouter = express.Router();
homeRouter.get('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const userPoolService = new ssktsapi.service.UserPool({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const organizationService = new ssktsapi.service.Organization({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const userPool = yield userPoolService.findById({
            userPoolId: process.env.DEFAULT_COGNITO_USER_POOL_ID
        });
        const searchUserPoolClientsResult = yield userPoolService.searchClients({ userPoolId: userPool.Id });
        const sellers = yield organizationService.searchMovieTheaters({});
        res.render('index', {
            message: 'Welcome to SSKTS Console!',
            userPool: userPool,
            userPoolClients: searchUserPoolClientsResult.data,
            PaymentMethodType: ssktsapi.factory.paymentMethodType,
            sellers: sellers
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = homeRouter;
