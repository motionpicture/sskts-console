/**
 * イベントルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

import * as ssktsapi from '../ssktsapi';

const debug = createDebug('sskts-console:routes:events');
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

            debug('searching events...', searchConditions);
            const events = await eventService.searchIndividualScreeningEvent(searchConditions);
            debug(events.length, 'events found.', events);
            res.render('events/individualScreeningEvent/index', {
                movieTheaters: movieTheaters,
                searchConditions: searchConditions,
                events: events
            });
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
            const orderService = new ssktsapi.service.Order({
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

            debug('searching orders by event...');
            const reservationStartDate = moment(`${event.coaInfo.rsvStartDate} 00:00:00+09:00`, 'YYYYMMDD HH:mm:ssZ').toDate();
            const orders = await orderService.search({
                // orderNumbers: (transactions.length > 0)
                //     ? transactions.map((t) => (<ssktsapi.factory.transaction.placeOrder.IResult>t.result).order.orderNumber)
                //     : [''],
                orderDateFrom: reservationStartDate,
                orderDateThrough: new Date(),
                reservedEventIdentifiers: [event.identifier]
            });
            debug(orders.length, 'orders found.');

            res.render('events/individualScreeningEvent/show', {
                moment: moment,
                movieTheater: movieTheater,
                screeningRoom: screeningRoom,
                movieTheaters: movieTheaters,
                event: event,
                orders: orders
            });
        } catch (error) {
            next(error);
        }
    });

export default eventsRouter;
