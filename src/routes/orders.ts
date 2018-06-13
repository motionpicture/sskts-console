/**
 * 注文ルーター
 */
import * as ssktsapi from '@motionpicture/sskts-api-nodejs-client';
import * as sskts from '@motionpicture/sskts-domain';
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

// import redisClient from '../redis';

const debug = createDebug('sskts-console:routes:orders');
const ordersRouter = express.Router();

/**
 * 注文検索
 */
ordersRouter.get(
    '',
    async (req, res, next) => {
        try {
            debug('req.query:', req.query);
            const orderService = new ssktsapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const organizationService = new ssktsapi.service.Organization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const movieTheaters = await organizationService.searchMovieTheaters({});

            const orderStatusChoices = [
                sskts.factory.orderStatus.OrderDelivered,
                sskts.factory.orderStatus.OrderPickupAvailable,
                sskts.factory.orderStatus.OrderProcessing,
                sskts.factory.orderStatus.OrderReturned
            ];
            const searchConditions: ssktsapi.factory.order.ISearchConditions = {
                sellerIds: (req.query.sellerIds !== undefined)
                    ? req.query.sellerIds
                    : movieTheaters.map((m) => m.id),
                customerMembershipNumbers: (req.query.customerMembershipNumbers !== undefined && req.query.customerMembershipNumbers !== '')
                    ? (<string>req.query.customerMembershipNumbers).split(',').map((v) => v.trim())
                    : [],
                orderNumbers: (req.query.orderNumbers !== undefined && req.query.orderNumbers !== '')
                    ? (<string>req.query.orderNumbers).split(',').map((v) => v.trim())
                    : [],
                orderStatuses: (req.query.orderStatuses !== undefined)
                    ? req.query.orderStatuses
                    : orderStatusChoices,
                orderDateFrom: (req.query.orderDateRange !== undefined && req.query.orderDateRange !== '')
                    ? moment(req.query.orderDateRange.split(' - ')[0]).toDate()
                    : moment().add(-1, 'day').toDate(),
                orderDateThrough: (req.query.orderDateRange !== undefined && req.query.orderDateRange !== '')
                    ? moment(req.query.orderDateRange.split(' - ')[1]).toDate()
                    : new Date()
            };

            debug('searching orders...', searchConditions);
            const orders = await orderService.search(searchConditions);
            debug(orders.length, 'orders found.', orders);
            res.render('orders/index', {
                moment: moment,
                movieTheaters: movieTheaters,
                searchConditions: searchConditions,
                orders: orders,
                orderStatusChoices: orderStatusChoices
            });
        } catch (error) {
            next(error);
        }
    });

/**
 * 注文詳細
 */
ordersRouter.get(
    '/:orderNumber',
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

            debug('searching orders...');
            const event = await eventService.findIndividualScreeningEvent({
                identifier: req.params.identifier
            });
            debug('orders found.', event);

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
        } catch (error) {
            next(error);
        }
    });

export default ordersRouter;
