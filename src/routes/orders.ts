/**
 * 注文ルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
import { ACCEPTED } from 'http-status';
import * as moment from 'moment';

import * as ssktsapi from '../ssktsapi';

const debug = createDebug('cinerino-console:routes');
const ordersRouter = express.Router();
/**
 * 注文検索
 */
ordersRouter.get(
    '',
    // tslint:disable-next-line:cyclomatic-complexity
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
            if (req.query.format === 'datatable') {
                debug('searching orders...', searchConditions);
                const orders = await orderService.search(searchConditions);
                debug(orders.length, 'orders found.');
                res.json({
                    draw: req.query.draw,
                    recordsTotal: orders.length,
                    recordsFiltered: orders.length,
                    data: orders
                });
            } else {
                res.render('orders/index', {
                    moment: moment,
                    movieTheaters: movieTheaters,
                    searchConditions: searchConditions,
                    orderStatusChoices: orderStatusChoices
                });
            }
        } catch (error) {
            next(error);
        }
    }
);
/**
 * 注文詳細
 */
ordersRouter.get(
    '/:orderNumber',
    async (req, res, next) => {
        try {
            const orderService = new ssktsapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const orders = await orderService.search({
                orderNumbers: [req.params.orderNumber],
                orderDateFrom: moment('2017-04-20T00:00:00+09:00').toDate(),
                orderDateThrough: new Date()
            });
            const order = orders.shift();
            if (order === undefined) {
                throw new ssktsapi.factory.errors.NotFound('Order');
            }

            res.render('orders/show', {
                moment: moment,
                order: order,
                timelines: [],
                ActionStatusType: ssktsapi.factory.actionStatusType
            });
        } catch (error) {
            next(error);
        }
    }
);
/**
 * 注文返品
 */
ordersRouter.post(
    '/:orderNumber/return',
    async (_, res, next) => {
        try {
            // const returnOrderService = new ssktsapi.service.transaction.ReturnOrder({
            //     endpoint: <string>process.env.API_ENDPOINT,
            //     auth: req.user.authClient
            // });
            // const returnOrderTransaction = await returnOrderService.start({
            //     expires: moment().add(1, 'minutes').toDate(),
            //     object: {
            //         order: {
            //             orderNumber: req.params.orderNumber
            //         }
            //     }
            // });
            // await returnOrderService.confirm({ transactionId: returnOrderTransaction.id });
            res.status(ACCEPTED).end();
        } catch (error) {
            next(error);
        }
    }
);
export default ordersRouter;
