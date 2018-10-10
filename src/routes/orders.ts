/**
 * 注文ルーター
 */
import * as sskts from '@motionpicture/sskts-domain';
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
            const userPoolService = new ssktsapi.service.UserPool({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const movieTheaters = await organizationService.searchMovieTheaters({});
            const searchUserPoolClientsResult = await userPoolService.searchClients({
                userPoolId: <string>process.env.DEFAULT_COGNITO_USER_POOL_ID
            });

            const orderStatusChoices = [
                ssktsapi.factory.orderStatus.OrderDelivered,
                ssktsapi.factory.orderStatus.OrderPickupAvailable,
                ssktsapi.factory.orderStatus.OrderProcessing,
                ssktsapi.factory.orderStatus.OrderReturned
            ];
            const searchConditions: ssktsapi.factory.order.ISearchConditions = {
                limit: req.query.limit,
                page: req.query.page,
                seller: {
                    typeOf: ssktsapi.factory.organizationType.MovieTheater,
                    ids: (req.query.seller !== undefined && req.query.seller.ids !== undefined)
                        ? req.query.seller.ids
                        : movieTheaters.map((m) => m.id)
                },
                customer: {
                    typeOf: ssktsapi.factory.personType.Person,
                    ids: (req.query.customer !== undefined && req.query.customer.ids !== undefined && req.query.customer.ids !== '')
                        ? (<string>req.query.customer.ids).split(',').map((v) => v.trim())
                        : [],
                    membershipNumbers: (req.query.customer !== undefined
                        && req.query.customer.membershipNumbers !== undefined
                        && req.query.customer.membershipNumbers !== '')
                        ? (<string>req.query.customer.membershipNumbers).split(',').map((v) => v.trim())
                        : [],
                    identifiers: (req.query.customer !== undefined && Array.isArray(req.query.customer.userPoolClients))
                        ? req.query.customer.userPoolClients.map((userPoolClient: string) => {
                            return {
                                name: 'clientId',
                                value: userPoolClient
                            };
                        })
                        : []
                },
                orderNumbers: (req.query.orderNumbers !== undefined && req.query.orderNumbers !== '')
                    ? (<string>req.query.orderNumbers).split(',').map((v) => v.trim())
                    : [],
                orderStatuses: (req.query.orderStatuses !== undefined)
                    ? req.query.orderStatuses
                    : orderStatusChoices,
                orderDateFrom: (req.query.orderDateRange !== undefined && req.query.orderDateRange !== '')
                    ? moment(req.query.orderDateRange.split(' - ')[0]).toDate()
                    : moment().add(-1, 'month').toDate(),
                orderDateThrough: (req.query.orderDateRange !== undefined && req.query.orderDateRange !== '')
                    ? moment(req.query.orderDateRange.split(' - ')[1]).toDate()
                    : moment().add(1, 'day').toDate(),
                confirmationNumbers: (req.query.confirmationNumbers !== undefined && req.query.confirmationNumbers !== '')
                    ? (<string>req.query.confirmationNumbers).split(',').map((v) => v.trim())
                    : []
            };
            if (req.query.format === 'datatable') {
                const searchOrdersResult = await orderService.search(searchConditions);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: searchOrdersResult.totalCount,
                    recordsFiltered: searchOrdersResult.totalCount,
                    data: searchOrdersResult.data
                });
            } else {
                res.render('orders/index', {
                    moment: moment,
                    movieTheaters: movieTheaters,
                    userPoolClients: searchUserPoolClientsResult.data,
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
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const orderService = new ssktsapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchOrdersResult = await orderService.search({
                orderNumbers: [req.params.orderNumber],
                orderDateFrom: moment('2017-04-20T00:00:00+09:00').toDate(),
                orderDateThrough: new Date()
            });
            const order = searchOrdersResult.data.shift();
            if (order === undefined) {
                throw new ssktsapi.factory.errors.NotFound('Order');
            }

            // 注文取引を検索
            const actionRepo = new sskts.repository.Action(sskts.mongoose.connection);
            let actionsOnOrder = await actionRepo.findByOrderNumber(order.orderNumber);
            // startDateでソート
            actionsOnOrder = actionsOnOrder.sort((a, b) => moment(a.startDate).valueOf() - moment(b.startDate).valueOf());

            // tslint:disable-next-line:cyclomatic-complexity
            const timelines = actionsOnOrder.map((a) => {
                let agent: any;
                if (a.agent.typeOf === ssktsapi.factory.personType.Person) {
                    const url = (a.agent.memberOf !== undefined)
                        ? `/people/${a.agent.id}`
                        : `/userPools/${process.env.DEFAULT_COGNITO_USER_POOL_ID}/clients/${a.agent.id}`;
                    agent = {
                        id: a.agent.id,
                        name: order.customer.name,
                        url: url
                    };
                } else if (a.agent.typeOf === ssktsapi.factory.organizationType.MovieTheater) {
                    agent = {
                        id: a.agent.id,
                        name: order.seller.name,
                        url: `/organizations/movieTheater/${a.agent.id}`
                    };
                }

                let actionName: string;
                switch (a.typeOf) {
                    case ssktsapi.factory.actionType.OrderAction:
                        actionName = '注文';
                        break;
                    case ssktsapi.factory.actionType.GiveAction:
                        actionName = '付与';
                        break;
                    case ssktsapi.factory.actionType.SendAction:
                        if (a.object.typeOf === 'Order') {
                            actionName = '配送';
                        } else if (a.object.typeOf === ssktsapi.factory.creativeWorkType.EmailMessage) {
                            actionName = '送信';
                        } else {
                            actionName = '送信';
                        }
                        break;
                    case ssktsapi.factory.actionType.PayAction:
                        actionName = '支払';
                        break;
                    case ssktsapi.factory.actionType.ReturnAction:
                        if (a.object.typeOf === 'Order') {
                            actionName = '返品';
                        } else {
                            actionName = '返却';
                        }
                        break;
                    case ssktsapi.factory.actionType.RefundAction:
                        actionName = '返金';
                        break;
                    default:
                        actionName = a.typeOf;
                }

                let object: string;
                switch (a.object.typeOf) {
                    case 'Order':
                        object = '注文';
                        break;
                    case ssktsapi.factory.action.transfer.give.pecorinoAward.ObjectType.PecorinoAward:
                        object = 'ポイント';
                        break;
                    case ssktsapi.factory.actionType.SendAction:
                        if (a.object.typeOf === 'Order') {
                            object = '配送';
                        } else if (a.object.typeOf === ssktsapi.factory.creativeWorkType.EmailMessage) {
                            object = '送信';
                        } else {
                            object = '送信';
                        }
                        break;
                    case ssktsapi.factory.creativeWorkType.EmailMessage:
                        object = 'Eメール';
                        break;
                    case 'PaymentMethod':
                        object = a.object.paymentMethod.typeOf;
                        break;
                    case ssktsapi.factory.actionType.PayAction:
                        object = a.object.object.paymentMethod.typeOf;
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
            });

            res.render('orders/show', {
                moment: moment,
                order: order,
                timelines: timelines,
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
    async (req, res, next) => {
        try {
            // 注文取引を検索
            const transactionRepo = new sskts.repository.Transaction(sskts.mongoose.connection);
            const transaction = await transactionRepo.transactionModel.findOne({
                'result.order.orderNumber': {
                    $exists: true,
                    $eq: req.params.orderNumber
                }
            }).exec().then((doc) => {
                if (doc === null) {
                    throw new ssktsapi.factory.errors.NotFound('Transaction');
                }

                return doc.toObject();
            });

            const returnOrderService = new ssktsapi.service.transaction.ReturnOrder({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const returnOrderTransaction = await returnOrderService.start({
                expires: moment().add(1, 'minutes').toDate(),
                transactionId: transaction.id
                // object: {
                //     order: {
                //         orderNumber: req.params.orderNumber
                //     }
                // }
            });
            await returnOrderService.confirm({ transactionId: returnOrderTransaction.id });
            res.status(ACCEPTED).end();
        } catch (error) {
            next(error);
        }
    }
);
export default ordersRouter;
