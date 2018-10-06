/**
 * ダッシュボードルーター
 */
// import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

import * as ssktsapi from '../ssktsapi';

// const debug = createDebug('cinerino-console:routes');
const dashboardRouter = express.Router();
dashboardRouter.get(
    '/countNewOrder',
    async (req, res, next) => {
        try {
            const orderService = new ssktsapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchConditions: ssktsapi.factory.order.ISearchConditions = {
                limit: 1,
                page: 1,
                orderDateFrom: moment().add(-1, 'day').toDate(),
                orderDateThrough: moment().toDate()
            };
            const searchResult = await orderService.search(searchConditions);
            res.json({
                totalCount: searchResult.totalCount
            });
        } catch (error) {
            next(error);
        }
    }
);
dashboardRouter.get(
    '/aggregateExitRate',
    async (_, res, next) => {
        try {
            res.json({
                rate: 0
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
    async (_, res, next) => {
        try {
            res.json({
                totalCount: 0
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
            const orderService = new ssktsapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchOrdersResult = await orderService.search({
                limit: req.query.limit,
                page: req.query.page,
                sort: (req.query.sort !== undefined) ? req.query.sort : { orderDate: ssktsapi.factory.sortType.Descending },
                // tslint:disable-next-line:no-magic-numbers
                orderDateFrom: moment(req.query.orderDateFrom).toDate(),
                orderDateThrough: moment(req.query.orderDateThrough).toDate()
            });
            res.json(searchOrdersResult);
        } catch (error) {
            next(error);
        }
    }
);
export default dashboardRouter;
