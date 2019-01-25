"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 注文取引ルーター
 */
const createDebug = require("debug");
const express = require("express");
const moment = require("moment");
const ssktsapi = require("../../ssktsapi");
// import validator from '../../middlewares/validator';
const debug = createDebug('cinerino-console:routes');
const placeOrderTransactionsRouter = express.Router();
/**
 * 検索
 */
placeOrderTransactionsRouter.get('', 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        debug('req.query:', req.query);
        const placeOrderService = new ssktsapi.service.transaction.PlaceOrder({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const organizationService = new ssktsapi.service.Organization({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchMovieTheatersResult = yield organizationService.searchMovieTheaters({});
        const transactionStatusChoices = [
            ssktsapi.factory.transactionStatusType.Canceled,
            ssktsapi.factory.transactionStatusType.Confirmed,
            ssktsapi.factory.transactionStatusType.Expired,
            ssktsapi.factory.transactionStatusType.InProgress
        ];
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            sort: { startDate: ssktsapi.factory.sortType.Descending },
            typeOf: ssktsapi.factory.transactionType.PlaceOrder,
            ids: (Array.isArray(req.query.ids)) ? req.query.ids : undefined,
            statuses: (req.query.statuses !== undefined)
                ? req.query.statuses
                : transactionStatusChoices,
            startFrom: (req.query.startRange !== undefined && req.query.startRange !== '')
                ? moment(req.query.startRange.split(' - ')[0]).toDate()
                : moment().add(-1, 'week').toDate(),
            startThrough: (req.query.startRange !== undefined && req.query.startRange !== '')
                ? moment(req.query.startRange.split(' - ')[1]).toDate()
                : moment().add(1, 'day').toDate(),
            endFrom: (req.query.endFrom !== undefined) ? moment(req.query.endFrom).toDate() : undefined,
            endThrough: (req.query.endThrough !== undefined) ? moment(req.query.endThrough).toDate() : undefined,
            agent: {
                typeOf: ssktsapi.factory.personType.Person,
                ids: (req.query.agent !== undefined && req.query.agent.ids !== '')
                    ? req.query.agent.ids.split(',').map((v) => v.trim())
                    : []
            },
            seller: {
                typeOf: ssktsapi.factory.organizationType.MovieTheater,
                ids: (req.query.seller !== undefined && req.query.seller.ids !== undefined)
                    ? req.query.seller.ids
                    : searchMovieTheatersResult.map((m) => m.id)
            },
            object: {
                customerContact: (req.query.object !== undefined
                    && req.query.object.customerContact !== undefined)
                    ? req.query.object.customerContact
                    : {}
            },
            result: {
                order: {
                    orderNumbers: (req.query.result !== undefined
                        && req.query.result.order !== undefined
                        && req.query.result.order.orderNumbers !== '')
                        ? req.query.result.order.orderNumbers.split(',').map((v) => v.trim())
                        : []
                }
            }
        };
        if (req.query.format === 'datatable') {
            const searchScreeningEventsResult = yield placeOrderService.search(Object.assign({}, searchConditions, { limit: searchConditions.limit, page: searchConditions.page, typeOf: searchConditions.typeOf, sort: searchConditions.sort, startFrom: searchConditions.startFrom, startThrough: searchConditions.startThrough, statuses: searchConditions.statuses }));
            res.json({
                draw: req.query.draw,
                recordsTotal: searchScreeningEventsResult.totalCount,
                recordsFiltered: searchScreeningEventsResult.totalCount,
                data: searchScreeningEventsResult.data
            });
            // } else if (req.query.format === ssktsapi.factory.encodingFormat.Text.csv) {
            //     const stream = <NodeJS.ReadableStream>await placeOrderService.downloadReport({
            //         ...searchConditions,
            //         format: ssktsapi.factory.encodingFormat.Text.csv
            //     });
            //     const filename = 'TransactionReport';
            //     res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${encodeURIComponent(`${filename}.csv`)}`);
            //     res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
            //     stream.pipe(res);
        }
        else {
            res.render('transactions/placeOrder/index', {
                moment: moment,
                movieTheaters: searchMovieTheatersResult,
                transactionStatusChoices: transactionStatusChoices,
                searchConditions: searchConditions
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引詳細
 */
placeOrderTransactionsRouter.get('/:transactionId', 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeOrderService = new ssktsapi.service.transaction.PlaceOrder({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchTransactionsResult = yield placeOrderService.search({
            typeOf: ssktsapi.factory.transactionType.PlaceOrder,
            ids: [req.params.transactionId]
        });
        const transaction = searchTransactionsResult.data.shift();
        if (transaction === undefined) {
            throw new ssktsapi.factory.errors.NotFound('Transaction');
        }
        const actionsOnTransaction = yield placeOrderService.searchActionsByTransactionId({
            id: transaction.id,
            sort: { endDate: ssktsapi.factory.sortType.Ascending }
        });
        const transactionAgentUrl = (transaction.agent.memberOf !== undefined)
            ? `/people/${transaction.agent.id}`
            : `/userPools/${process.env.DEFAULT_COGNITO_USER_POOL_ID}/clients/${transaction.agent.id}`;
        const timelines = [{
                action: {},
                agent: {
                    id: transaction.agent.id,
                    name: transaction.agent.id,
                    url: transactionAgentUrl
                },
                actionName: '開始',
                object: '取引',
                startDate: transaction.startDate,
                actionStatus: ssktsapi.factory.actionStatusType.CompletedActionStatus,
                result: undefined
            }];
        // tslint:disable-next-line:cyclomatic-complexity
        timelines.push(...actionsOnTransaction.map((a) => {
            let agent;
            if (a.agent.typeOf === ssktsapi.factory.personType.Person) {
                const url = (a.agent.memberOf !== undefined)
                    ? `/people/${a.agent.id}`
                    : `/userPools/${process.env.DEFAULT_COGNITO_USER_POOL_ID}/clients/${a.agent.id}`;
                agent = {
                    id: a.agent.id,
                    name: a.agent.id,
                    url: url
                };
            }
            else if (a.agent.typeOf === ssktsapi.factory.organizationType.MovieTheater) {
                agent = {
                    id: a.agent.id,
                    name: transaction.seller.name.ja,
                    url: `/organizations/movieTheater/${a.agent.id}`
                };
            }
            let actionName;
            switch (a.typeOf) {
                case ssktsapi.factory.actionType.AuthorizeAction:
                    actionName = '承認';
                    break;
                default:
                    actionName = a.typeOf;
            }
            let object;
            switch (a.object.typeOf) {
                case ssktsapi.factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation:
                    object = '座席予約';
                    break;
                case ssktsapi.factory.paymentMethodType.CreditCard:
                    object = 'クレジットカード決済';
                    break;
                case ssktsapi.factory.paymentMethodType.Account:
                    object = 'ポイント決済';
                    break;
                case ssktsapi.factory.action.authorize.award.pecorino.ObjectType.PecorinoAward:
                    object = 'ポイントインセンティブ';
                    break;
                default:
                    object = a.object.typeOf;
            }
            return {
                action: a,
                agent,
                actionName,
                object,
                startDate: a.startDate,
                actionStatus: a.actionStatus,
                result: a.result
            };
        }));
        if (transaction.endDate !== undefined) {
            switch (transaction.status) {
                case ssktsapi.factory.transactionStatusType.Canceled:
                    timelines.push({
                        action: {},
                        agent: {
                            id: transaction.agent.id,
                            name: transaction.agent.id,
                            url: transactionAgentUrl
                        },
                        actionName: '中止',
                        object: '取引',
                        startDate: transaction.endDate,
                        actionStatus: ssktsapi.factory.actionStatusType.CompletedActionStatus,
                        result: undefined
                    });
                    break;
                case ssktsapi.factory.transactionStatusType.Confirmed:
                    timelines.push({
                        action: {},
                        agent: {
                            id: transaction.agent.id,
                            name: transaction.agent.id,
                            url: transactionAgentUrl
                        },
                        actionName: '確定',
                        object: '取引',
                        startDate: transaction.endDate,
                        actionStatus: ssktsapi.factory.actionStatusType.CompletedActionStatus,
                        result: undefined
                    });
                    break;
                case ssktsapi.factory.transactionStatusType.Expired:
                    timelines.push({
                        action: {},
                        agent: {
                            id: '#',
                            name: 'システム',
                            url: '#'
                        },
                        actionName: '終了',
                        object: '取引',
                        startDate: transaction.endDate,
                        actionStatus: ssktsapi.factory.actionStatusType.CompletedActionStatus,
                        result: undefined
                    });
                    break;
                default:
            }
        }
        res.render('transactions/placeOrder/show', {
            moment: moment,
            transaction: transaction,
            timelines: timelines,
            ActionStatusType: ssktsapi.factory.actionStatusType
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = placeOrderTransactionsRouter;
