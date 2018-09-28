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
 * 注文ルーター
 */
const createDebug = require("debug");
const express = require("express");
const moment = require("moment");
const ssktsapi = require("../ssktsapi");
// import redisClient from '../redis';
const debug = createDebug('sskts-console:routes:orders');
const ordersRouter = express.Router();
/**
 * 注文検索
 */
ordersRouter.get('', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        debug('req.query:', req.query);
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const organizationService = new ssktsapi.service.Organization({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const movieTheaters = yield organizationService.searchMovieTheaters({});
        const orderStatusChoices = [
            ssktsapi.factory.orderStatus.OrderDelivered,
            ssktsapi.factory.orderStatus.OrderPickupAvailable,
            ssktsapi.factory.orderStatus.OrderProcessing,
            ssktsapi.factory.orderStatus.OrderReturned
        ];
        const searchConditions = {
            sellerIds: (req.query.sellerIds !== undefined)
                ? req.query.sellerIds
                : movieTheaters.map((m) => m.id),
            customerMembershipNumbers: (req.query.customerMembershipNumbers !== undefined && req.query.customerMembershipNumbers !== '')
                ? req.query.customerMembershipNumbers.split(',').map((v) => v.trim())
                : [],
            orderNumbers: (req.query.orderNumbers !== undefined && req.query.orderNumbers !== '')
                ? req.query.orderNumbers.split(',').map((v) => v.trim())
                : [],
            orderStatuses: (req.query.orderStatuses !== undefined)
                ? req.query.orderStatuses
                : orderStatusChoices,
            orderDateFrom: (req.query.orderDateRange !== undefined && req.query.orderDateRange !== '')
                ? moment(req.query.orderDateRange.split(' - ')[0]).toDate()
                : moment().add(-1, 'day').toDate(),
            orderDateThrough: (req.query.orderDateRange !== undefined && req.query.orderDateRange !== '')
                ? moment(req.query.orderDateRange.split(' - ')[1]).toDate()
                : new Date(),
            confirmationNumbers: (req.query.confirmationNumbers !== undefined && req.query.confirmationNumbers !== '')
                ? req.query.confirmationNumbers.split(',').map((v) => v.trim())
                : []
        };
        debug('searching orders...', searchConditions);
        const orders = yield orderService.search(searchConditions);
        debug(orders.length, 'orders found.', orders);
        res.render('orders/index', {
            moment: moment,
            movieTheaters: movieTheaters,
            searchConditions: searchConditions,
            orders: orders,
            orderStatusChoices: orderStatusChoices
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 注文詳細
 */
ordersRouter.get('/:orderNumber', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const orders = yield orderService.search({
            orderNumbers: [req.params.orderNumber],
            orderDateFrom: moment('2017-04-20T00:00:00+09:00').toDate(),
            orderDateThrough: new Date()
        });
        const order = orders.shift();
        if (order === undefined) {
            throw new ssktsapi.factory.errors.NotFound('Order');
        }
        res.render('orders/show', {
            moment: moment,
            order: order
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = ordersRouter;
