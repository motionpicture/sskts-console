/**
 * 注文返品取引ルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

import * as ssktsapi from '../../ssktsapi';
// import validator from '../../middlewares/validator';

const debug = createDebug('cinerino-console:routes');
const returnOrderTransactionsRouter = express.Router();
/**
 * 検索
 */
returnOrderTransactionsRouter.get(
    '',
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            debug('req.query:', req.query);
            const returnOrderService = new ssktsapi.service.transaction.ReturnOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const organizationService = new ssktsapi.service.Organization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchMovieTheatersResult = await organizationService.searchMovieTheaters({});
            const transactionStatusChoices = [
                ssktsapi.factory.transactionStatusType.Canceled,
                ssktsapi.factory.transactionStatusType.Confirmed,
                ssktsapi.factory.transactionStatusType.Expired,
                ssktsapi.factory.transactionStatusType.InProgress
            ];
            const searchConditions: ssktsapi.factory.transaction.ISearchConditions<ssktsapi.factory.transactionType.ReturnOrder> = {
                limit: req.query.limit,
                page: req.query.page,
                sort: { startDate: ssktsapi.factory.sortType.Descending },
                typeOf: ssktsapi.factory.transactionType.ReturnOrder,
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
                        ? (<string>req.query.agent.ids).split(',').map((v) => v.trim())
                        : []
                },
                // seller: {
                //     typeOf: ssktsapi.factory.organizationType.MovieTheater,
                //     ids: (req.query.seller !== undefined && req.query.seller.ids !== undefined)
                //         ? req.query.seller.ids
                //         : searchMovieTheatersResult.data.map((m) => m.id)
                // },
                object: {
                    order: {
                        orderNumbers: []
                    }
                }
                // result: {
                //     order: {
                //         orderNumbers: (req.query.result !== undefined
                //             && req.query.result.order !== undefined
                //             && req.query.result.order.orderNumbers !== '')
                //             ? (<string>req.query.result.order.orderNumbers).split(',').map((v) => v.trim())
                //             : []
                //     }
                // }
            };
            if (req.query.format === 'datatable') {
                const searchScreeningEventsResult = await returnOrderService.search(searchConditions);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: searchScreeningEventsResult.totalCount,
                    recordsFiltered: searchScreeningEventsResult.totalCount,
                    data: searchScreeningEventsResult.data
                });
                // } else if (req.query.format === ssktsapi.factory.encodingFormat.Text.csv) {
                //     const stream = <NodeJS.ReadableStream>await returnOrderService.downloadReport({
                //         ...searchConditions,
                //         format: ssktsapi.factory.encodingFormat.Text.csv
                //     });
                //     const filename = 'TransactionReport';
                //     res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${encodeURIComponent(`${filename}.csv`)}`);
                //     res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
                //     stream.pipe(res);
            } else {
                res.render('transactions/returnOrder/index', {
                    moment: moment,
                    movieTheaters: searchMovieTheatersResult,
                    transactionStatusChoices: transactionStatusChoices,
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
returnOrderTransactionsRouter.get(
    '/:transactionId',
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const returnOrderService = new ssktsapi.service.transaction.ReturnOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchTransactionsResult = await returnOrderService.search({
                typeOf: ssktsapi.factory.transactionType.ReturnOrder,
                ids: [req.params.transactionId]
            });
            const transaction = searchTransactionsResult.data.shift();
            if (transaction === undefined) {
                throw new ssktsapi.factory.errors.NotFound('Transaction');
            }
            // const actionsOnTransaction = await returnOrderService.searchActionsByTransactionId({
            //     transactionId: transaction.id,
            //     sort: { endDate: ssktsapi.factory.sortType.Ascending }
            // });
            const timelines = [{
                action: {},
                agent: {
                    id: transaction.agent.id,
                    name: transaction.agent.id,
                    url: '#'
                },
                actionName: '開始',
                object: '取引',
                startDate: transaction.startDate,
                actionStatus: ssktsapi.factory.actionStatusType.CompletedActionStatus,
                result: undefined
            }];
            // tslint:disable-next-line:cyclomatic-complexity
            // timelines.push(...actionsOnTransaction.map((a) => {
            //     let agent: any;
            //     if (a.agent.typeOf === ssktsapi.factory.personType.Person) {
            //         agent = {
            //             id: a.agent.id,
            //             name: a.agent.id,
            //             url: '#'
            //         };
            //     } else if (a.agent.typeOf === ssktsapi.factory.organizationType.MovieTheater) {
            //         agent = {
            //             id: a.agent.id,
            //             name: transaction.seller.name.ja,
            //             url: `/organizations/movieTheater/${a.agent.id}`
            //         };
            //     }

            //     let actionName: string;
            //     switch (a.typeOf) {
            //         case ssktsapi.factory.actionType.AuthorizeAction:
            //             actionName = '承認';
            //             break;
            //         default:
            //             actionName = a.typeOf;
            //     }

            //     let object: string;
            //     switch (a.object.typeOf) {
            //         case ssktsapi.factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation:
            //             object = '座席予約';
            //             break;
            //         case ssktsapi.factory.action.authorize.paymentMethod.creditCard.ObjectType.CreditCard:
            //             object = 'クレジットカード決済';
            //             break;
            //         case ssktsapi.factory.action.authorize.paymentMethod.account.ObjectType.AccountPayment:
            //             object = '口座決済';
            //             break;
            //         case ssktsapi.factory.action.authorize.paymentMethod.mocoin.ObjectType.MocoinPayment:
            //             object = 'MoCoin決済';
            //             break;
            //         case ssktsapi.factory.action.authorize.award.point.ObjectType.PointAward:
            //             object = 'ポイントインセンティブ';
            //             break;
            //         default:
            //             object = a.object.typeOf;
            //     }

            //     return {
            //         action: a,
            //         agent,
            //         actionName,
            //         object,
            //         startDate: a.startDate,
            //         actionStatus: a.actionStatus,
            //         result: a.result
            //     };
            // }));
            if (transaction.endDate !== undefined) {
                switch (transaction.status) {
                    case ssktsapi.factory.transactionStatusType.Canceled:
                        timelines.push({
                            action: {},
                            agent: {
                                id: transaction.agent.id,
                                name: transaction.agent.id,
                                url: '#'
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
                                url: '#'
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
            res.render('transactions/returnOrder/show', {
                moment: moment,
                transaction: transaction,
                timelines: timelines,
                ActionStatusType: ssktsapi.factory.actionStatusType
            });
        } catch (error) {
            next(error);
        }
    }
);
export default returnOrderTransactionsRouter;
