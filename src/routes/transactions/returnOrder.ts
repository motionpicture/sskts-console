/**
 * 注文返品取引ルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

import * as cinerinoapi from '../../cinerinoapi';
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
            const returnOrderService = new cinerinoapi.service.txn.ReturnOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const organizationService = new cinerinoapi.service.Organization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchMovieTheatersResult = await organizationService.searchMovieTheaters({});
            const transactionStatusChoices = [
                cinerinoapi.factory.transactionStatusType.Canceled,
                cinerinoapi.factory.transactionStatusType.Confirmed,
                cinerinoapi.factory.transactionStatusType.Expired,
                cinerinoapi.factory.transactionStatusType.InProgress
            ];
            const searchConditions: cinerinoapi.factory.transaction.ISearchConditions<cinerinoapi.factory.transactionType.ReturnOrder> = {
                limit: req.query.limit,
                page: req.query.page,
                sort: { startDate: cinerinoapi.factory.sortType.Descending },
                typeOf: cinerinoapi.factory.transactionType.ReturnOrder,
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
                    typeOf: cinerinoapi.factory.personType.Person,
                    ids: (req.query.agent !== undefined && req.query.agent.ids !== '')
                        ? (<string>req.query.agent.ids).split(',').map((v) => v.trim())
                        : undefined
                },
                object: {
                    order: {
                        orderNumbers: (req.query.object !== undefined
                            && req.query.object.order !== undefined
                            && req.query.object.order.orderNumbers !== '')
                            ? (<string>req.query.object.order.orderNumbers).split(',').map((v) => v.trim())
                            : undefined
                    }
                },
                tasksExportationStatuses: (req.query.tasksExportationStatuses !== undefined)
                    ? req.query.tasksExportationStatuses
                    : Object.values(cinerinoapi.factory.transactionTasksExportationStatus)
            };
            if (req.query.format === 'datatable') {
                const searchScreeningEventsResult = await returnOrderService.search(searchConditions);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: searchScreeningEventsResult.totalCount,
                    recordsFiltered: searchScreeningEventsResult.totalCount,
                    data: searchScreeningEventsResult.data
                });
                // } else if (req.query.format === cinerinoapi.factory.encodingFormat.Text.csv) {
                //     const stream = <NodeJS.ReadableStream>await returnOrderService.downloadReport({
                //         ...searchConditions,
                //         format: cinerinoapi.factory.encodingFormat.Text.csv
                //     });
                //     const filename = 'TransactionReport';
                //     res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${encodeURIComponent(`${filename}.csv`)}`);
                //     res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
                //     stream.pipe(res);
            } else {
                res.render('transactions/returnOrder/index', {
                    moment: moment,
                    movieTheaters: searchMovieTheatersResult.data,
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
returnOrderTransactionsRouter.get(
    '/:transactionId',
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const returnOrderService = new cinerinoapi.service.txn.ReturnOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchTransactionsResult = await returnOrderService.search({
                typeOf: cinerinoapi.factory.transactionType.ReturnOrder,
                ids: [req.params.transactionId]
            });
            const transaction = searchTransactionsResult.data.shift();
            if (transaction === undefined) {
                throw new cinerinoapi.factory.errors.NotFound('Transaction');
            }
            // const actionsOnTransaction = await returnOrderService.searchActionsByTransactionId({
            //     transactionId: transaction.id,
            //     sort: { endDate: cinerinoapi.factory.sortType.Ascending }
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
                actionStatus: cinerinoapi.factory.actionStatusType.CompletedActionStatus,
                result: undefined
            }];
            // tslint:disable-next-line:cyclomatic-complexity
            // timelines.push(...actionsOnTransaction.map((a) => {
            //     let agent: any;
            //     if (a.agent.typeOf === cinerinoapi.factory.personType.Person) {
            //         agent = {
            //             id: a.agent.id,
            //             name: a.agent.id,
            //             url: '#'
            //         };
            //     } else if (a.agent.typeOf === cinerinoapi.factory.organizationType.MovieTheater) {
            //         agent = {
            //             id: a.agent.id,
            //             name: transaction.seller.name.ja,
            //             url: `/organizations/movieTheater/${a.agent.id}`
            //         };
            //     }

            //     let actionName: string;
            //     switch (a.typeOf) {
            //         case cinerinoapi.factory.actionType.AuthorizeAction:
            //             actionName = '承認';
            //             break;
            //         default:
            //             actionName = a.typeOf;
            //     }

            //     let object: string;
            //     switch (a.object.typeOf) {
            //         case cinerinoapi.factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation:
            //             object = '座席予約';
            //             break;
            //         case cinerinoapi.factory.action.authorize.paymentMethod.creditCard.ObjectType.CreditCard:
            //             object = 'クレジットカード決済';
            //             break;
            //         case cinerinoapi.factory.action.authorize.paymentMethod.account.ObjectType.AccountPayment:
            //             object = '口座決済';
            //             break;
            //         case cinerinoapi.factory.action.authorize.paymentMethod.mocoin.ObjectType.MocoinPayment:
            //             object = 'MoCoin決済';
            //             break;
            //         case cinerinoapi.factory.action.authorize.award.point.ObjectType.PointAward:
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
                    case cinerinoapi.factory.transactionStatusType.Canceled:
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
                                url: '#'
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
            res.render('transactions/returnOrder/show', {
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
export default returnOrderTransactionsRouter;
