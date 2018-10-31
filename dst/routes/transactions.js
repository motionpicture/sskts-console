"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 取引ルーター
 */
const express = require("express");
// import placeOrderTransactionsRouter from './transactions/placeOrder';
// import returnOrderTransactionsRouter from './transactions/returnOrder';
const transactionsRouter = express.Router();
// transactionsRouter.use('/placeOrder', placeOrderTransactionsRouter);
// transactionsRouter.use('/returnOrder', returnOrderTransactionsRouter);
exports.default = transactionsRouter;
