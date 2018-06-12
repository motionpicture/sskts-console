/**
 * イベントルーター
 */
import * as ssktsapi from '@motionpicture/sskts-api-nodejs-client';
import * as sskts from '@motionpicture/sskts-domain';
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

// import redisClient from '../redis';

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

            const searchConditions: sskts.factory.event.individualScreeningEvent.ISearchConditions = {
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

            const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
            debug('searching transaction by event...');
            const transactions = await transactionRepo.transactionModel.find({
                typeOf: sskts.factory.transactionType.PlaceOrder,
                status: sskts.factory.transactionStatusType.Confirmed,
                'result.order.acceptedOffers.itemOffered.reservationFor.identifier': {
                    $exists: true,
                    $eq: event.identifier
                }
            }).sort('endDate').exec().then((docs) => docs.map((doc) => <sskts.factory.transaction.placeOrder.ITransaction>doc.toObject()));
            debug(transactions.length, 'transactions found.');

            const orderRepo = new sskts.repository.Order(sskts.mongoose.connection);
            debug('searching orders by event...');
            const orders = await orderRepo.orderModel.find({
                orderNumber: { $in: transactions.map((t) => (<sskts.factory.transaction.placeOrder.IResult>t.result).order.orderNumber) }
            }).sort('orderDate').exec().then((docs) => docs.map((doc) => doc.toObject()));
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
        } catch (error) {
            next(error);
        }
    });

export default eventsRouter;
