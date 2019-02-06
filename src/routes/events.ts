/**
 * イベントルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED } from 'http-status';
import * as moment from 'moment';

import * as cinerinoapi from '../cinerinoapi';
import validator from '../middlewares/validator';

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
            const eventService = new cinerinoapi.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const sellerService = new cinerinoapi.service.Seller({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchSellersResult = await sellerService.search({});
            const searchConditions: cinerinoapi.factory.chevre.event.screeningEvent.ISearchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                sort: { startDate: cinerinoapi.factory.chevre.sortType.Ascending },
                superEvent: {
                    locationBranchCodes: (req.query.superEventLocationBranchCodes !== undefined)
                        ? req.query.superEventLocationBranchCodes
                        : searchSellersResult.data
                            .filter((seller) => seller.location !== undefined && seller.location.branchCode !== undefined)
                            .map((m) => (<cinerinoapi.factory.seller.ILocation>m.location).branchCode)
                },
                startFrom: (req.query.startRange !== undefined && req.query.startRange !== '')
                    ? moment(req.query.startRange.split(' - ')[0])
                        .toDate()
                    : new Date(),
                startThrough: (req.query.startRange !== undefined && req.query.startRange !== '')
                    ? moment(req.query.startRange.split(' - ')[1])
                        .toDate()
                    : moment()
                        .add(1, 'month')
                        .toDate(),
                ...req.query
            };
            if (req.query.format === 'datatable') {
                const searchScreeningEventsResult = await eventService.searchScreeningEvents(searchConditions);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: searchScreeningEventsResult.totalCount,
                    recordsFiltered: searchScreeningEventsResult.totalCount,
                    data: searchScreeningEventsResult.data
                });
            } else {
                res.render('events/screeningEvent/index', {
                    moment: moment,
                    movieTheaters: searchSellersResult.data,
                    searchConditions: searchConditions
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
        body('superEventLocationBranchCodes')
            .not()
            .isEmpty()
            .withMessage((_, options) => `${options.path} is required`)
            .isArray(),
        body('startRange')
            .not()
            .isEmpty()
            .withMessage((_, options) => `${options.path} is required`)
    ],
    validator,
    async (req, res, next) => {
        try {
            const taskService = new cinerinoapi.service.Task({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const locationBranchCodes = <string[]>req.body.superEventLocationBranchCodes;
            const startFrom = moment(req.body.startRange.split(' - ')[0])
                .toDate();
            const startThrough = moment(req.body.startRange.split(' - ')[1])
                .toDate();
            const tasks = await Promise.all(locationBranchCodes.map(async (locationBranchCode) => {
                const taskAttributes: cinerinoapi.factory.task.IAttributes<cinerinoapi.factory.taskName.ImportScreeningEvents> = {
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
            }));
            res.status(CREATED)
                .json(tasks);
        } catch (error) {
            next(error);
        }
    });
/**
 * 上映イベント詳細
 */
eventsRouter.get(
    '/screeningEvent/:id',
    async (req, res, next) => {
        try {
            const eventService = new cinerinoapi.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const event = await eventService.findScreeningEventById({
                id: req.params.id
            });
            res.render('events/screeningEvent/show', {
                message: '',
                moment: moment,
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
    '/screeningEvent/:id/orders',
    async (req, res, next) => {
        try {
            const eventService = new cinerinoapi.service.Event({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const orderService = new cinerinoapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const event = await eventService.findScreeningEventById({
                id: req.params.id
            });
            // const reservationStartDate = moment(`${event.coaInfo.rsvStartDate} 00:00:00+09:00`, 'YYYYMMDD HH:mm:ssZ').toDate();
            const searchOrdersResult = await orderService.search({
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
        } catch (error) {
            next(error);
        }
    });
export default eventsRouter;
