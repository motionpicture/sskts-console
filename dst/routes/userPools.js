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
// import * as createDebug from 'debug';
const express = require("express");
const moment = require("moment");
// import * as ssktsapi from '../ssktsapi';
// const debug = createDebug('cinerino-console:routes');
const userPoolsRouter = express.Router();
userPoolsRouter.get('/:userPoolId', 
// tslint:disable-next-line:max-func-body-length
(_, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        // const userPoolService = new ssktsapi.service.UserPool({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        // const userPool = await userPoolService.findById({
        //     userPoolId: req.params.userPoolId
        // });
        // const searchUserPoolClientsResult = await userPoolService.searchClients({ userPoolId: req.params.userPoolId });
        res.render('userPools/show', {
            moment: moment,
            userPool: {},
            userPoolClients: []
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * ユーザープールの注文検索
 */
userPoolsRouter.get('/:userPoolId/orders', (_, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        // const orderService = new ssktsapi.service.Order({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        // const searchOrdersResult = await orderService.search({
        //     limit: req.query.limit,
        //     page: req.query.page,
        //     sort: { orderDate: ssktsapi.factory.sortType.Descending },
        //     orderDateFrom: moment().add(-1, 'months').toDate(),
        //     orderDateThrough: new Date(),
        //     customer: {
        //         typeOf: ssktsapi.factory.personType.Person,
        //         identifiers: [
        //             {
        //                 name: 'tokenIssuer',
        //                 value: `https://cognito-idp.ap-northeast-1.amazonaws.com/${req.params.userPoolId}`
        //             }
        //         ]
        //     }
        // });
        // debug(searchOrdersResult.totalCount, 'orders found.');
        const searchOrdersResult = { totalCount: 0, data: [] };
        res.json(searchOrdersResult);
    }
    catch (error) {
        next(error);
    }
}));
userPoolsRouter.get('/:userPoolId/clients/:clientId', 
// tslint:disable-next-line:max-func-body-length
(_, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        // const userPoolService = new ssktsapi.service.UserPool({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        // const userPoolClient = await userPoolService.findClientById({
        //     userPoolId: req.params.userPoolId,
        //     clientId: req.params.clientId
        // });
        res.render('userPools/clients/show', {
            moment: moment,
            userPoolClient: {}
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * クライアントの注文検索
 */
userPoolsRouter.get('/:userPoolId/clients/:clientId/orders', (_, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        // const orderService = new ssktsapi.service.Order({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        // const searchOrdersResult = await orderService.search({
        //     limit: req.query.limit,
        //     page: req.query.page,
        //     sort: { orderDate: ssktsapi.factory.sortType.Descending },
        //     orderDateFrom: moment().add(-1, 'months').toDate(),
        //     orderDateThrough: new Date(),
        //     customer: {
        //         typeOf: ssktsapi.factory.personType.Person,
        //         identifiers: [
        //             {
        //                 name: 'clientId',
        //                 value: req.params.clientId
        //             }
        //         ]
        //     }
        // });
        // debug(searchOrdersResult.totalCount, 'orders found.');
        const searchOrdersResult = { totalCount: 0, data: [] };
        res.json(searchOrdersResult);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = userPoolsRouter;
