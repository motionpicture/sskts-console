/**
 * イベントルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
// tslint:disable-next-line:no-submodule-imports
// import { body } from 'express-validator/check';
// import { CREATED } from 'http-status';
import * as moment from 'moment';

// import validator from '../middlewares/validator';
import * as ssktsapi from '../ssktsapi';

const debug = createDebug('cinerino-console:routes:events');
const eventsRouter = express.Router();
/**
 * 上映イベント検索
 */
eventsRouter.get(
    '/individualScreeningEvent',
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

            const searchConditions: ssktsapi.factory.event.individualScreeningEvent.ISearchConditions = {
                superEventLocationIdentifiers: movieTheaters.map((m) => m.identifier),
                startFrom: (req.query.startRange !== undefined && req.query.startRange !== '')
                    ? moment(req.query.startRange.split(' - ')[0]).toDate()
                    : new Date(),
                startThrough: (req.query.startRange !== undefined && req.query.startRange !== '')
                    ? moment(req.query.startRange.split(' - ')[1]).toDate()
                    : moment().add(1, 'day').toDate(),
                ...req.query
            };

            if (req.query.format === 'datatable') {
                debug('searching events...', searchConditions);
                const events = await eventService.searchIndividualScreeningEvent(searchConditions);
                debug(events.length, 'events found.', events);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: events.length,
                    recordsFiltered: events.length,
                    data: events
                });
            } else {
                res.render('events/individualScreeningEvent/index', {
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
 * 上映イベント詳細
 */
eventsRouter.get(
    '/individualScreeningEvent/:identifier',
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

            res.render('events/individualScreeningEvent/show', {
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
    '/individualScreeningEvent/:identifier/orders',
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
                reservedEventIdentifiers: [event.identifier]
            });
            debug(searchOrdersResult.totalCount, 'orders found.');
            res.json(searchOrdersResult);
        } catch (error) {
            next(error);
        }
    });
export default eventsRouter;
