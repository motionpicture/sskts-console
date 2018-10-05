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
const moment = require("moment");
const ssktsapi = require("../ssktsapi");
// const debug = createDebug('sskts-console:routes');
const dashboardRouter = express.Router();
dashboardRouter.get('/countNewOrder', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchConditions = {
            // limit: 1,
            // page: 1,
            orderDateFrom: moment().add(-1, 'day').toDate(),
            orderDateThrough: moment().toDate()
        };
        const orders = yield orderService.search(searchConditions);
        res.json({
            totalCount: orders.length
        });
    }
    catch (error) {
        next(error);
    }
}));
dashboardRouter.get('/aggregateExitRate', (_, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        res.json({
            rate: 0
        });
    }
    catch (error) {
        next(error);
    }
}));
dashboardRouter.get('/countNewUser', (_, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        res.json({
            totalCount: 0
        });
    }
    catch (error) {
        next(error);
    }
}));
dashboardRouter.get('/countNewTransaction', (_, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        res.json({
            totalCount: 0
        });
    }
    catch (error) {
        next(error);
    }
}));
dashboardRouter.get('/latestOrders', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        // 直近の実売上データを
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const orders = yield orderService.search({
            // tslint:disable-next-line:no-magic-numbers
            orderDateFrom: moment().add(-1, 'days').toDate(),
            orderDateThrough: moment().toDate()
        });
        res.json(orders);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = dashboardRouter;
