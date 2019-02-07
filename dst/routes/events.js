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
const createDebug = require("debug");
const express = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const moment = require("moment");
const cinerinoapi = require("../cinerinoapi");
const validator_1 = require("../middlewares/validator");
const debug = createDebug('cinerino-console:routes:events');
const eventsRouter = express.Router();
/**
 * 上映イベント検索
 */
eventsRouter.get('/screeningEvent', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        debug('req.query:', req.query);
        const eventService = new cinerinoapi.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const sellerService = new cinerinoapi.service.Seller({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchSellersResult = yield sellerService.search({});
        const searchConditions = Object.assign({ limit: req.query.limit, page: req.query.page, sort: { startDate: cinerinoapi.factory.chevre.sortType.Ascending }, superEvent: {
                locationBranchCodes: (req.query.superEventLocationBranchCodes !== undefined)
                    ? req.query.superEventLocationBranchCodes
                    : searchSellersResult.data
                        .filter((seller) => seller.location !== undefined && seller.location.branchCode !== undefined)
                        .map((m) => m.location.branchCode)
            }, startFrom: (req.query.startRange !== undefined && req.query.startRange !== '')
                ? moment(req.query.startRange.split(' - ')[0])
                    .toDate()
                : new Date(), startThrough: (req.query.startRange !== undefined && req.query.startRange !== '')
                ? moment(req.query.startRange.split(' - ')[1])
                    .toDate()
                : moment()
                    .add(1, 'month')
                    .toDate() }, req.query);
        if (req.query.format === 'datatable') {
            const searchScreeningEventsResult = yield eventService.searchScreeningEvents(searchConditions);
            res.json({
                draw: req.query.draw,
                recordsTotal: searchScreeningEventsResult.totalCount,
                recordsFiltered: searchScreeningEventsResult.totalCount,
                data: searchScreeningEventsResult.data
            });
        }
        else {
            res.render('events/screeningEvent/index', {
                moment: moment,
                movieTheaters: searchSellersResult.data,
                searchConditions: searchConditions
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 上映イベントインポート
 */
eventsRouter.post('/screeningEvent/import', ...[
    check_1.body('superEventLocationBranchCodes')
        .not()
        .isEmpty()
        .withMessage((_, options) => `${options.path} is required`)
        .isArray(),
    check_1.body('startRange')
        .not()
        .isEmpty()
        .withMessage((_, options) => `${options.path} is required`)
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const taskService = new cinerinoapi.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const locationBranchCodes = req.body.superEventLocationBranchCodes;
        const startFrom = moment(req.body.startRange.split(' - ')[0])
            .toDate();
        const startThrough = moment(req.body.startRange.split(' - ')[1])
            .toDate();
        const tasks = yield Promise.all(locationBranchCodes.map((locationBranchCode) => __awaiter(this, void 0, void 0, function* () {
            const taskAttributes = {
                name: cinerinoapi.factory.taskName.ImportScreeningEvents,
                status: cinerinoapi.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 1,
                // tslint:disable-next-line:no-null-keyword
                numberOfTried: 0,
                executionResults: [],
                data: {
                    locationBranchCode: locationBranchCode,
                    importFrom: startFrom,
                    importThrough: startThrough
                }
            };
            return taskService.create(taskAttributes);
        })));
        res.status(http_status_1.CREATED)
            .json(tasks);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 上映イベント詳細
 */
eventsRouter.get('/screeningEvent/:id', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventService = new cinerinoapi.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const event = yield eventService.findScreeningEventById({
            id: req.params.id
        });
        res.render('events/screeningEvent/show', {
            message: '',
            moment: moment,
            event: event,
            orders: []
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 上映イベントの注文検索
 */
eventsRouter.get('/screeningEvent/:id/orders', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventService = new cinerinoapi.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const orderService = new cinerinoapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const event = yield eventService.findScreeningEventById({
            id: req.params.id
        });
        // const reservationStartDate = moment(`${event.coaInfo.rsvStartDate} 00:00:00+09:00`, 'YYYYMMDD HH:mm:ssZ').toDate();
        const searchOrdersResult = yield orderService.search({
            limit: req.query.limit,
            page: req.query.page,
            sort: { orderDate: cinerinoapi.factory.sortType.Ascending },
            orderDateFrom: moment(event.startDate)
                // tslint:disable-next-line:no-magic-numbers
                .add(-3, 'months')
                .toDate(),
            orderDateThrough: new Date(),
            acceptedOffers: {
                itemOffered: {
                    reservationFor: { ids: [event.id] }
                }
            }
        });
        debug(searchOrdersResult.totalCount, 'orders found.');
        res.json(searchOrdersResult);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = eventsRouter;
