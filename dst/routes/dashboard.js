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
 * ダッシュボードルーター
 */
// import * as createDebug from 'debug';
const express = require("express");
const moment = require("moment-timezone");
const cinerinoapi = require("../cinerinoapi");
// const debug = createDebug('cinerino-console:routes');
const dashboardRouter = express.Router();
dashboardRouter.get('/countNewOrder', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const orderService = new cinerinoapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            limit: 1,
            page: 1,
            orderDateFrom: moment()
                .tz('Asia/Tokyo')
                .startOf('day')
                .toDate()
        };
        const { totalCount } = yield orderService.search(searchConditions);
        res.json({
            totalCount: totalCount
        });
    }
    catch (error) {
        next(error);
    }
}));
dashboardRouter.get('/aggregateExitRate', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeOrderService = new cinerinoapi.service.transaction.PlaceOrder({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            typeOf: cinerinoapi.factory.transactionType.PlaceOrder,
            limit: 1,
            page: 1,
            startFrom: moment()
                .tz('Asia/Tokyo')
                .startOf('day')
                .toDate()
        };
        const searchResult = yield placeOrderService.search(searchConditions);
        searchConditions.statuses = [
            cinerinoapi.factory.transactionStatusType.Canceled,
            cinerinoapi.factory.transactionStatusType.Expired
        ];
        const searchExitResult = yield placeOrderService.search(searchConditions);
        res.json({
            rate: (searchResult.totalCount > 0)
                // tslint:disable-next-line:no-magic-numbers
                ? Math.floor(searchExitResult.totalCount / searchResult.totalCount * 100)
                : 0
        });
    }
    catch (error) {
        next(error);
    }
}));
dashboardRouter.get('/countNewUser', (_, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        // 未実装
        res.json({
            totalCount: 0
        });
    }
    catch (error) {
        next(error);
    }
}));
dashboardRouter.get('/countNewTransaction', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeOrderService = new cinerinoapi.service.transaction.PlaceOrder({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            typeOf: cinerinoapi.factory.transactionType.PlaceOrder,
            limit: 1,
            page: 1,
            startFrom: moment()
                .tz('Asia/Tokyo')
                .startOf('day')
                .toDate()
        };
        const searchResult = yield placeOrderService.search(searchConditions);
        res.json({
            totalCount: searchResult.totalCount
        });
    }
    catch (error) {
        next(error);
    }
}));
dashboardRouter.get('/orders', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const orderService = new cinerinoapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchOrdersResult = yield orderService.search({
            limit: req.query.limit,
            page: req.query.page,
            sort: (req.query.sort !== undefined) ? req.query.sort : { orderDate: cinerinoapi.factory.sortType.Descending },
            orderDateFrom: moment(req.query.orderDateFrom)
                .toDate(),
            orderDateThrough: moment(req.query.orderDateThrough)
                .toDate()
        });
        res.json(searchOrdersResult);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = dashboardRouter;
