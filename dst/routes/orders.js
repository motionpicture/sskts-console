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
const ssktsapi = require("@motionpicture/sskts-api-nodejs-client");
const sskts = require("@motionpicture/sskts-domain");
const createDebug = require("debug");
const express = require("express");
const moment = require("moment");
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
        const searchConditions = Object.assign({ sellerId: movieTheaters[0].id, 
            // customerMembershipNumber?: string;
            // orderNumber: '118-12345',
            // orderStatus: sskts.factory.orderStatus.OrderDelivered,
            orderDateFrom: (req.query.orderDateRange !== undefined && req.query.orderDateRange !== '')
                ? moment(req.query.orderDateRange.split(' - ')[0]).toDate()
                : moment().add(-1, 'day').toDate(), orderDateThrough: (req.query.orderDateRange !== undefined && req.query.orderDateRange !== '')
                ? moment(req.query.orderDateRange.split(' - ')[1]).toDate()
                : new Date() }, req.query);
        debug('searching orders...', searchConditions);
        const orders = yield orderService.search(searchConditions);
        debug(orders.length, 'orders found.', orders);
        res.render('orders/index', {
            moment: moment,
            movieTheaters: movieTheaters,
            searchConditions: searchConditions,
            orders: orders
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
        debug('req.query:', req.query);
        const eventService = new ssktsapi.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const organizationService = new ssktsapi.service.Organization({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new ssktsapi.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const movieTheaters = yield organizationService.searchMovieTheaters({});
        debug('searching orders...');
        const event = yield eventService.findIndividualScreeningEvent({
            identifier: req.params.identifier
        });
        debug('orders found.', event);
        // イベント開催の劇場取得
        const movieTheater = yield placeService.findMovieTheater({
            branchCode: event.superEvent.location.branchCode
        });
        const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === event.location.branchCode);
        const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
        debug('searching transaction by event...');
        const transactions = yield transactionRepo.transactionModel.find({
            typeOf: sskts.factory.transactionType.PlaceOrder,
            status: sskts.factory.transactionStatusType.Confirmed,
            'result.order.acceptedOffers.itemOffered.reservationFor.identifier': {
                $exists: true,
                $eq: event.identifier
            }
        }).sort('endDate').exec().then((docs) => docs.map((doc) => doc.toObject()));
        debug(transactions.length, 'transactions found.');
        const orderRepo = new sskts.repository.Order(sskts.mongoose.connection);
        debug('searching orders by event...');
        const orders = yield orderRepo.orderModel.find({
            orderNumber: { $in: transactions.map((t) => t.result.order.orderNumber) }
        }).sort('orderDate').exec().then((docs) => docs.map((doc) => doc.toObject()));
        debug(orders.length, 'orders found.');
        const seatReservationAuthorizeActions = transactions.map((transaction) => {
            return transaction.object.authorizeActions
                .filter((a) => a.actionStatus === sskts.factory.actionStatusType.CompletedActionStatus)
                .find((a) => a.object.typeOf === sskts.factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation);
        });
        res.render('orders/individualScreeningEvent/show', {
            moment: moment,
            movieTheater: movieTheater,
            screeningRoom: screeningRoom,
            movieTheaters: movieTheaters,
            event: event,
            transactions: transactions,
            seatReservationAuthorizeActions: seatReservationAuthorizeActions,
            orders: orders
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = ordersRouter;
