/**
 * イベントルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED } from 'http-status';
import * as moment from 'moment';

import validator from '../middlewares/validator';
import * as ssktsapi from '../ssktsapi';

const debug = createDebug('cinerino-console:routes:events');
const eventsRouter = express.Router();
/**
 * 上映イベント検索
 */
eventsRouter.get(
    '/screeningEvent',
    async (req, res, next) => {
        try {
            debug('req.query:', req.query);
            const eventService = new ssktsapi.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const organizationService = new ssktsapi.service.Organization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const movieTheaters = await organizationService.searchMovieTheaters({});

            const searchConditions: ssktsapi.factory.event.screeningEvent.ISearchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                sort: { startDate: ssktsapi.factory.sortType.Ascending },
                superEventLocationIdentifiers: (req.query.superEventLocationIdentifiers !== undefined)
                    ? req.query.superEventLocationIdentifiers
                    : movieTheaters.map((m) => m.identifier),
                startFrom: (req.query.startRange !== undefined && req.query.startRange !== '')
                    ? moment(req.query.startRange.split(' - ')[0]).toDate()
                    : new Date(),
                startThrough: (req.query.startRange !== undefined && req.query.startRange !== '')
                    ? moment(req.query.startRange.split(' - ')[1]).toDate()
                    : moment().add(1, 'day').toDate()
            };

            if (req.query.format === 'datatable') {
                const searchEventsResult = await eventService.searchIndividualScreeningEventWithPagination(searchConditions);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: searchEventsResult.totalCount,
                    recordsFiltered: searchEventsResult.totalCount,
                    data: searchEventsResult.data
                });
            } else {
                res.render('events/screeningEvent/index', {
                    moment: moment,
                    movieTheaters: movieTheaters,
                    searchConditions: searchConditions,
                    events: []
                });
            }
        } catch (error) {
            next(error);
        }
    });
/**
 * 上映イベントインポート
 */
eventsRouter.post(
    '/screeningEvent/import',
    ...[
        body('superEventLocationIdentifiers').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
            .isArray(),
        body('startRange').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
    ],
    validator,
    async (req, res, next) => {
        try {
            const organizationService = new ssktsapi.service.Organization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const placeService = new ssktsapi.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const taskService = new ssktsapi.service.Task({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const locationIdentifiers = <string[]>req.body.superEventLocationIdentifiers;
            let movieTheaters = await placeService.searchMovieTheaters({});
            movieTheaters = movieTheaters.filter((m) => locationIdentifiers.indexOf(m.identifier) >= 0);
            const branchCodes = movieTheaters.map((m) => m.branchCode);

            let movieTheaterOrganizations = await organizationService.searchMovieTheaters({});
            movieTheaterOrganizations = movieTheaterOrganizations.filter((m) => branchCodes.indexOf(m.location.branchCode) >= 0);

            const startFrom = moment(req.body.startRange.split(' - ')[0]).toDate();
            const startThrough = moment(req.body.startRange.split(' - ')[1]).toDate();
            const tasks = await Promise.all(movieTheaterOrganizations.map(async (movieTheater) => {
                const taskAttributes: ssktsapi.factory.task.IAttributes<ssktsapi.factory.taskName.ImportScreeningEvents> = {
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

                return taskService.create(<any>taskAttributes);
            }));
            res.status(CREATED).json(tasks);
        } catch (error) {
            next(error);
        }
    });
/**
 * 上映イベント詳細
 */
eventsRouter.get(
    '/screeningEvent/:identifier',
    async (req, res, next) => {
        try {
            debug('req.query:', req.query);
            const eventService = new ssktsapi.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const organizationService = new ssktsapi.service.Organization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const placeService = new ssktsapi.service.Place({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const movieTheaters = await organizationService.searchMovieTheaters({});

            debug('searching events...');
            const event = await eventService.findIndividualScreeningEvent({
                identifier: req.params.identifier
            });
            debug('events found.', event);

            // イベント開催の劇場取得
            const movieTheater = await placeService.findMovieTheater({
                branchCode: event.superEvent.location.branchCode
            });
            const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === event.location.branchCode);

            res.render('events/screeningEvent/show', {
                message: '',
                moment: moment,
                movieTheater: movieTheater,
                screeningRoom: screeningRoom,
                movieTheaters: movieTheaters,
                event: event,
                orders: []
            });
        } catch (error) {
            next(error);
        }
    });
/**
 * 上映イベントの注文検索
 */
eventsRouter.get(
    '/screeningEvent/:identifier/orders',
    async (req, res, next) => {
        try {
            const eventService = new ssktsapi.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const orderService = new ssktsapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const event = await eventService.findIndividualScreeningEvent({
                identifier: req.params.identifier
            });
            debug('searching orders by event...');
            const reservationStartDate = moment(`${event.coaInfo.rsvStartDate} 00:00:00+09:00`, 'YYYYMMDD HH:mm:ssZ').toDate();
            const searchOrdersResult = await orderService.search({
                limit: req.query.limit,
                page: req.query.page,
                sort: { orderDate: ssktsapi.factory.sortType.Ascending },
                orderDateFrom: reservationStartDate,
                orderDateThrough: new Date(),
                acceptedOffers: {
                    itemOffered: {
                        reservationFor: {
                            ids: [event.identifier]
                        }
                    }
                }
            });
            debug(searchOrdersResult.totalCount, 'orders found.');
            res.json(searchOrdersResult);
        } catch (error) {
            next(error);
        }
    });
export default eventsRouter;
