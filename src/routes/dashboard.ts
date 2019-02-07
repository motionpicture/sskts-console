/**
 * ダッシュボードルーター
 */
// import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment-timezone';

import * as cinerinoapi from '../cinerinoapi';

// const debug = createDebug('cinerino-console:routes');
const dashboardRouter = express.Router();
dashboardRouter.get(
    '/countNewOrder',
    async (req, res, next) => {
        try {
            const orderService = new cinerinoapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchConditions: cinerinoapi.factory.order.ISearchConditions = {
                limit: 1,
                page: 1,
                orderDateFrom: moment()
                    .tz('Asia/Tokyo')
                    .startOf('day')
                    .toDate()
            };
            const { totalCount } = await orderService.search(searchConditions);
            res.json({
                totalCount: totalCount
            });
        } catch (error) {
            next(error);
        }
    }
);

dashboardRouter.get(
    '/aggregateExitRate',
    async (req, res, next) => {
        try {
            const placeOrderService = new cinerinoapi.service.transaction.PlaceOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchConditions: cinerinoapi.factory.transaction.ISearchConditions<cinerinoapi.factory.transactionType.PlaceOrder> = {
                typeOf: cinerinoapi.factory.transactionType.PlaceOrder,
                limit: 1,
                page: 1,
                startFrom: moment()
                    .tz('Asia/Tokyo')
                    .startOf('day')
                    .toDate()
            };
            const searchResult = await placeOrderService.search(searchConditions);
            searchConditions.statuses = [
                cinerinoapi.factory.transactionStatusType.Canceled,
                cinerinoapi.factory.transactionStatusType.Expired
            ];
            const searchExitResult = await placeOrderService.search(searchConditions);
            res.json({
                rate: (searchResult.totalCount > 0)
                    // tslint:disable-next-line:no-magic-numbers
                    ? Math.floor(searchExitResult.totalCount / searchResult.totalCount * 100)
                    : 0
            });
        } catch (error) {
            next(error);
        }
    }
);

dashboardRouter.get(
    '/countNewUser',
    async (_, res, next) => {
        try {
            // 未実装

            res.json({
                totalCount: 0
            });
        } catch (error) {
            next(error);
        }
    }
);

dashboardRouter.get(
    '/countNewTransaction',
    async (req, res, next) => {
        try {
            const placeOrderService = new cinerinoapi.service.transaction.PlaceOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchConditions: cinerinoapi.factory.transaction.ISearchConditions<cinerinoapi.factory.transactionType.PlaceOrder> = {
                typeOf: cinerinoapi.factory.transactionType.PlaceOrder,
                limit: 1,
                page: 1,
                startFrom: moment()
                    .tz('Asia/Tokyo')
                    .startOf('day')
                    .toDate()
            };
            const searchResult = await placeOrderService.search(searchConditions);
            res.json({
                totalCount: searchResult.totalCount
            });
        } catch (error) {
            next(error);
        }
    }
);

dashboardRouter.get(
    '/orders',
    async (req, res, next) => {
        try {
            const orderService = new cinerinoapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchOrdersResult = await orderService.search({
                limit: req.query.limit,
                page: req.query.page,
                sort: (req.query.sort !== undefined) ? req.query.sort : { orderDate: cinerinoapi.factory.sortType.Descending },
                orderDateFrom: moment(req.query.orderDateFrom)
                    .toDate(),
                orderDateThrough: moment(req.query.orderDateThrough)
                    .toDate()
            });
            res.json(searchOrdersResult);
        } catch (error) {
            next(error);
        }
    }
);

export default dashboardRouter;
