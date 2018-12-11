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
const validator_1 = require("../middlewares/validator");
const ssktsapi = require("../ssktsapi");
const debug = createDebug('cinerino-console:routes:events');
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
        const searchConditions = Object.assign({ limit: req.query.limit, page: req.query.page, sort: { startDate: ssktsapi.factory.sortType.Ascending }, superEventLocationIdentifiers: movieTheaters.map((m) => m.identifier), startFrom: (req.query.startRange !== undefined && req.query.startRange !== '')
                ? moment(req.query.startRange.split(' - ')[0]).toDate()
                : new Date(), startThrough: (req.query.startRange !== undefined && req.query.startRange !== '')
                ? moment(req.query.startRange.split(' - ')[1]).toDate()
                : moment().add(1, 'day').toDate() }, req.query);
        if (req.query.format === 'datatable') {
            debug('searching events...', searchConditions);
            const searchEventsResult = yield eventService.searchIndividualScreeningEventWithPagination(searchConditions);
            res.json({
                draw: req.query.draw,
                recordsTotal: searchEventsResult.totalCount,
                recordsFiltered: searchEventsResult.totalCount,
                data: searchEventsResult.data
            });
        }
        else {
            res.render('events/individualScreeningEvent/index', {
                moment: moment,
                movieTheaters: movieTheaters,
                searchConditions: searchConditions,
                events: []
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
eventsRouter.post('/individualScreeningEvent/import', ...[
    check_1.body('superEventLocationIdentifiers').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isArray(),
    check_1.body('startRange').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const organizationService = new ssktsapi.service.Organization({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const placeService = new ssktsapi.service.Place({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const taskService = new ssktsapi.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const locationIdentifiers = req.body.superEventLocationIdentifiers;
        let movieTheaters = yield placeService.searchMovieTheaters({});
        movieTheaters = movieTheaters.filter((m) => locationIdentifiers.indexOf(m.identifier) >= 0);
        const branchCodes = movieTheaters.map((m) => m.branchCode);
        let movieTheaterOrganizations = yield organizationService.searchMovieTheaters({});
        movieTheaterOrganizations = movieTheaterOrganizations.filter((m) => branchCodes.indexOf(m.location.branchCode) >= 0);
        const startFrom = moment(req.body.startRange.split(' - ')[0]).toDate();
        const startThrough = moment(req.body.startRange.split(' - ')[1]).toDate();
        const tasks = yield Promise.all(movieTheaterOrganizations.map((movieTheater) => __awaiter(this, void 0, void 0, function* () {
            const taskAttributes = {
                name: ssktsapi.factory.taskName.ImportScreeningEvents,
                status: ssktsapi.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 1,
                lastTriedAt: null,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    locationBranchCode: movieTheater.location.branchCode,
                    importFrom: startFrom,
                    importThrough: startThrough,
                    xmlEndPoint: movieTheater.xmlEndPoint
                }
            };
            return taskService.create(taskAttributes);
        })));
        res.status(http_status_1.CREATED).json(tasks);
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
        res.render('events/individualScreeningEvent/show', {
            message: '',
            moment: moment,
            movieTheater: movieTheater,
            screeningRoom: screeningRoom,
            movieTheaters: movieTheaters,
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
eventsRouter.get('/individualScreeningEvent/:identifier/orders', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventService = new ssktsapi.service.Event({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const event = yield eventService.findIndividualScreeningEvent({
            identifier: req.params.identifier
        });
        debug('searching orders by event...');
        const reservationStartDate = moment(`${event.coaInfo.rsvStartDate} 00:00:00+09:00`, 'YYYYMMDD HH:mm:ssZ').toDate();
        const searchOrdersResult = yield orderService.search({
            limit: req.query.limit,
            page: req.query.page,
            sort: { orderDate: ssktsapi.factory.sortType.Ascending },
            orderDateFrom: reservationStartDate,
            orderDateThrough: new Date(),
            reservedEventIdentifiers: [event.identifier]
        });
        debug(searchOrdersResult.totalCount, 'orders found.');
        res.json(searchOrdersResult);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = eventsRouter;
