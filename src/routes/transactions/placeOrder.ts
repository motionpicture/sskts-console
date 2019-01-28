/**
 * 注文取引ルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

import * as cinerinoapi from '../../cinerinoapi';
// import validator from '../../middlewares/validator';

const debug = createDebug('cinerino-console:routes');
const placeOrderTransactionsRouter = express.Router();
/**
 * 検索
 */
placeOrderTransactionsRouter.get(
    '',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            debug('req.query:', req.query);
            const placeOrderService = new cinerinoapi.service.transaction.PlaceOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const sellerService = new cinerinoapi.service.Seller({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            const searchSellersResult = await sellerService.search({});
            const transactionStatusChoices = [
                cinerinoapi.factory.transactionStatusType.Canceled,
                cinerinoapi.factory.transactionStatusType.Confirmed,
                cinerinoapi.factory.transactionStatusType.Expired,
                cinerinoapi.factory.transactionStatusType.InProgress
            ];
            const searchConditions: cinerinoapi.factory.transaction.ISearchConditions<cinerinoapi.factory.transactionType.PlaceOrder> = {
                limit: req.query.limit,
                page: req.query.page,
                sort: { startDate: cinerinoapi.factory.sortType.Descending },
                typeOf: cinerinoapi.factory.transactionType.PlaceOrder,
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
                    // typeOf: cinerinoapi.factory.personType.Person,
                    ids: (req.query.agent !== undefined && req.query.agent.ids !== undefined && req.query.agent.ids !== '')
                        ? (<string>req.query.agent.ids).split(',').map((v) => v.trim())
                        : undefined
                },
                seller: {
                    // typeOf: cinerinoapi.factory.organizationType.MovieTheater,
                    ids: (req.query.seller !== undefined && req.query.seller.ids !== undefined)
                        ? req.query.seller.ids
                        : searchSellersResult.data.map((m) => m.id)
                },
                object: {
                    customerContact: (req.query.object !== undefined
                        && req.query.object.customerContact !== undefined)
                        ? {
                            givenName: (req.query.object.customerContact.givenName !== '')
                                ? req.query.object.customerContact.givenName : undefined,
                            familyName: (req.query.object.customerContact.familyName !== '')
                                ? req.query.object.customerContact.familyName : undefined,
                            telephone: (req.query.object.customerContact.telephone !== '')
                                ? req.query.object.customerContact.telephone : undefined,
                            email: (req.query.object.customerContact.email !== '')
                                ? req.query.object.customerContact.email : undefined
                        }
                        : {}
                },
                result: {
                    order: {
                        orderNumbers: (req.query.result !== undefined
                            && req.query.result.order !== undefined
                            && req.query.result.order.orderNumbers !== '')
                            ? (<string>req.query.result.order.orderNumbers).split(',').map((v) => v.trim())
                            : undefined
                    }
                },
                tasksExportationStatuses: (req.query.tasksExportationStatuses !== undefined)
                    ? req.query.tasksExportationStatuses
                    : Object.values(cinerinoapi.factory.transactionTasksExportationStatus)
            };
            debug('searchConditions:', searchConditions);

            if (req.query.format === 'datatable') {
                const searchScreeningEventsResult = await placeOrderService.search(searchConditions);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: searchScreeningEventsResult.totalCount,
                    recordsFiltered: searchScreeningEventsResult.totalCount,
                    data: searchScreeningEventsResult.data
                });
            } else if (req.query.format === cinerinoapi.factory.encodingFormat.Text.csv) {
                const stream = <NodeJS.ReadableStream>await placeOrderService.downloadReport({
                    ...searchConditions,
                    format: cinerinoapi.factory.encodingFormat.Text.csv
                });
                const filename = 'TransactionReport';
                res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${encodeURIComponent(`${filename}.csv`)}`);
                res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
                stream.pipe(res);
            } else {
                res.render('transactions/placeOrder/index', {
                    moment: moment,
                    movieTheaters: searchSellersResult.data,
                    transactionStatusChoices: transactionStatusChoices,
                    TransactionTasksExportationStatus: cinerinoapi.factory.transactionTasksExportationStatus,
                    searchConditions: searchConditions
                });
            }
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 取引詳細
 */
placeOrderTransactionsRouter.get(
    '/:transactionId',
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const placeOrderService = new cinerinoapi.service.transaction.PlaceOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchTransactionsResult = await placeOrderService.search({
                typeOf: cinerinoapi.factory.transactionType.PlaceOrder,
                ids: [req.params.transactionId]
            });
            const transaction = searchTransactionsResult.data.shift();
            if (transaction === undefined) {
                throw new cinerinoapi.factory.errors.NotFound('Transaction');
            }

            let actionsOnTransaction: any[] = [];
            try {
                actionsOnTransaction = await placeOrderService.searchActionsByTransactionId({
                    id: transaction.id,
                    sort: { endDate: cinerinoapi.factory.sortType.Ascending }
                });
            } catch (error) {
                // no op
            }

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
                actionStatus: cinerinoapi.factory.actionStatusType.CompletedActionStatus,
                result: undefined
            }];
            // tslint:disable-next-line:cyclomatic-complexity
            timelines.push(...actionsOnTransaction.map((a) => {
                let agent: any;
                if (a.agent.typeOf === cinerinoapi.factory.personType.Person) {
                    const url = (a.agent.memberOf !== undefined)
                        ? `/people/${a.agent.id}`
                        : `/userPools/${process.env.DEFAULT_COGNITO_USER_POOL_ID}/clients/${a.agent.id}`;
                    agent = {
                        id: a.agent.id,
                        name: a.agent.id,
                        url: url
                    };
                } else if (a.agent.typeOf === cinerinoapi.factory.organizationType.MovieTheater) {
                    agent = {
                        id: a.agent.id,
                        name: transaction.seller.name.ja,
                        url: `/organizations/movieTheater/${a.agent.id}`
                    };
                }

                let actionName: string;
                switch (a.typeOf) {
                    case cinerinoapi.factory.actionType.AuthorizeAction:
                        actionName = '承認';
                        break;
                    default:
                        actionName = a.typeOf;
                }

                let object: string;
                switch (a.object.typeOf) {
                    case cinerinoapi.factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation:
                        object = '座席予約';
                        break;
                    case cinerinoapi.factory.paymentMethodType.CreditCard:
                        object = 'クレジットカード決済';
                        break;
                    case cinerinoapi.factory.paymentMethodType.Account:
                        object = '口座決済';
                        break;
                    case cinerinoapi.factory.action.authorize.award.point.ObjectType.PointAward:
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
                    case cinerinoapi.factory.transactionStatusType.Canceled:
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
                            actionStatus: cinerinoapi.factory.actionStatusType.CompletedActionStatus,
                            result: undefined
                        });
                        break;
                    case cinerinoapi.factory.transactionStatusType.Confirmed:
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
                            actionStatus: cinerinoapi.factory.actionStatusType.CompletedActionStatus,
                            result: undefined
                        });
                        break;
                    case cinerinoapi.factory.transactionStatusType.Expired:
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
                            actionStatus: cinerinoapi.factory.actionStatusType.CompletedActionStatus,
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
                ActionStatusType: cinerinoapi.factory.actionStatusType
            });
        } catch (error) {
            next(error);
        }
    }
);
export default placeOrderTransactionsRouter;
