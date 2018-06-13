/**
 * 注文ルーター
 */
import * as ssktsapi from '@motionpicture/sskts-api-nodejs-client';
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
                ssktsapi.factory.orderStatus.OrderDelivered,
                ssktsapi.factory.orderStatus.OrderPickupAvailable,
                ssktsapi.factory.orderStatus.OrderProcessing,
                ssktsapi.factory.orderStatus.OrderReturned
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
                    : new Date(),
                confirmationNumbers: (req.query.confirmationNumbers !== undefined && req.query.confirmationNumbers !== '')
                    ? (<string>req.query.confirmationNumbers).split(',').map((v) => v.trim())
                    : []
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
    async (__, res, next) => {
        try {
            res.render('orders/show', {
            });
        } catch (error) {
            next(error);
        }
    });

export default ordersRouter;
