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
 * ユーザープールルーター
 */
const createDebug = require("debug");
const express = require("express");
const moment = require("moment");
const ssktsapi = require("../ssktsapi");
const debug = createDebug('cinerino-console:routes');
const userPoolsRouter = express.Router();
userPoolsRouter.get('/:userPoolId', 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const userPoolService = new ssktsapi.service.UserPool({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const userPool = yield userPoolService.findById({
            userPoolId: req.params.userPoolId
        });
        const searchUserPoolClientsResult = yield userPoolService.searchClients({ userPoolId: req.params.userPoolId });
        res.render('userPools/show', {
            moment: moment,
            userPool: userPool,
            userPoolClients: searchUserPoolClientsResult.data
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * ユーザープールの注文検索
 */
userPoolsRouter.get('/:userPoolId/orders', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchOrdersResult = yield orderService.search({
            limit: req.query.limit,
            page: req.query.page,
            sort: { orderDate: ssktsapi.factory.sortType.Descending },
            orderDateFrom: moment().add(-1, 'months').toDate(),
            orderDateThrough: new Date(),
            customer: {
                typeOf: ssktsapi.factory.personType.Person,
                identifiers: [
                    {
                        name: 'tokenIssuer',
                        value: `https://cognito-idp.ap-northeast-1.amazonaws.com/${req.params.userPoolId}`
                    }
                ]
            }
        });
        debug(searchOrdersResult.totalCount, 'orders found.');
        res.json(searchOrdersResult);
    }
    catch (error) {
        next(error);
    }
}));
userPoolsRouter.get('/:userPoolId/clients/:clientId', 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const userPoolService = new ssktsapi.service.UserPool({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const userPoolClient = yield userPoolService.findClientById({
            userPoolId: req.params.userPoolId,
            clientId: req.params.clientId
        });
        res.render('userPools/clients/show', {
            moment: moment,
            userPoolClient: userPoolClient
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * クライアントの注文検索
 */
userPoolsRouter.get('/:userPoolId/clients/:clientId/orders', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchOrdersResult = yield orderService.search({
            limit: req.query.limit,
            page: req.query.page,
            sort: { orderDate: ssktsapi.factory.sortType.Descending },
            orderDateFrom: moment().add(-1, 'months').toDate(),
            orderDateThrough: new Date(),
            customer: {
                typeOf: ssktsapi.factory.personType.Person,
                identifiers: [
                    {
                        name: 'clientId',
                        value: req.params.clientId
                    }
                ]
            }
        });
        debug(searchOrdersResult.totalCount, 'orders found.');
        res.json(searchOrdersResult);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = userPoolsRouter;
