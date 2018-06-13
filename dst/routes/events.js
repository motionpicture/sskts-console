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
 * イベントルーター
 */
const ssktsapi = require("@motionpicture/sskts-api-nodejs-client");
const sskts = require("@motionpicture/sskts-domain");
const createDebug = require("debug");
const express = require("express");
const moment = require("moment");
// import redisClient from '../redis';
const debug = createDebug('sskts-console:routes:events');
const eventsRouter = express.Router();
/**
 * 上映イベント検索
 */
eventsRouter.get('/individualScreeningEvent', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
        const movieTheaters = yield organizationService.searchMovieTheaters({});
        const searchConditions = Object.assign({ superEventLocationIdentifiers: movieTheaters.map((m) => m.identifier), startFrom: (req.query.startRange !== undefined && req.query.startRange !== '')
                ? moment(req.query.startRange.split(' - ')[0]).toDate()
                : new Date(), startThrough: (req.query.startRange !== undefined && req.query.startRange !== '')
                ? moment(req.query.startRange.split(' - ')[1]).toDate()
                : moment().add(1, 'day').toDate() }, req.query);
        debug('searching events...', searchConditions);
        const events = yield eventService.searchIndividualScreeningEvent(searchConditions);
        debug(events.length, 'events found.', events);
        res.render('events/individualScreeningEvent/index', {
            movieTheaters: movieTheaters,
            searchConditions: searchConditions,
            events: events
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 上映イベント詳細
 */
eventsRouter.get('/individualScreeningEvent/:identifier', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new ssktsapi.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const movieTheaters = yield organizationService.searchMovieTheaters({});
        debug('searching events...');
        const event = yield eventService.findIndividualScreeningEvent({
            identifier: req.params.identifier
        });
        debug('events found.', event);
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
        debug('searching orders by event...');
        const reservationStartDate = moment(`${event.coaInfo.rsvStartDate} 00:00:00+09:00`, 'YYYYMMDD HH:mm:ssZ').toDate();
        const orders = yield orderService.search({
            orderNumbers: (transactions.length > 0)
                ? transactions.map((t) => t.result.order.orderNumber)
                : [''],
            orderDateFrom: reservationStartDate,
            orderDateThrough: new Date()
        });
        debug(orders.length, 'orders found.');
        const seatReservationAuthorizeActions = transactions.map((transaction) => {
            return transaction.object.authorizeActions
                .filter((a) => a.actionStatus === sskts.factory.actionStatusType.CompletedActionStatus)
                .find((a) => a.object.typeOf === sskts.factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation);
        });
        res.render('events/individualScreeningEvent/show', {
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
exports.default = eventsRouter;
