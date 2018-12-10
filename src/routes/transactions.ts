/**
 * 取引ルーター
 */
import * as express from 'express';

import placeOrderTransactionsRouter from './transactions/placeOrder';
import returnOrderTransactionsRouter from './transactions/returnOrder';

const transactionsRouter = express.Router();
transactionsRouter.use('/placeOrder', placeOrderTransactionsRouter);
transactionsRouter.use('/returnOrder', returnOrderTransactionsRouter);
export default transactionsRouter;
