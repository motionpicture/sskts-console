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
 * 注文ルーター
 */
const createDebug = require("debug");
const express = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const cinerinoapi = require("../cinerinoapi");
const debug = createDebug('cinerino-console:routes');
const ordersRouter = express.Router();
/**
 * 注文検索
 */
ordersRouter.get('', 
// tslint:disable-next-line:cyclomatic-complexity
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        debug('req.query:', req.query);
        const orderService = new cinerinoapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const sellerService = new cinerinoapi.service.Seller({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const userPoolService = new cinerinoapi.service.UserPool({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchSellersResult = yield sellerService.search({});
        let userPoolClients = [];
        let adminUserPoolClients = [];
        try {
            const searchUserPoolClientsResult = yield userPoolService.searchClients({
                userPoolId: process.env.DEFAULT_COGNITO_USER_POOL_ID
            });
            const searchAdminUserPoolClientsResult = yield userPoolService.searchClients({
                userPoolId: process.env.ADMIN_COGNITO_USER_POOL_ID
            });
            userPoolClients = searchUserPoolClientsResult.data;
            adminUserPoolClients = searchAdminUserPoolClientsResult.data;
        }
        catch (error) {
            // no op
        }
        const orderStatusChoices = [
            cinerinoapi.factory.orderStatus.OrderDelivered,
            cinerinoapi.factory.orderStatus.OrderPickupAvailable,
            cinerinoapi.factory.orderStatus.OrderProcessing,
            cinerinoapi.factory.orderStatus.OrderReturned
        ];
        const searchConditions = {
            limit: req.query.limit,
            page: req.query.page,
            seller: {
                // typeOf: cinerinoapi.factory.organizationType.MovieTheater,
                ids: (req.query.seller !== undefined && req.query.seller.ids !== undefined)
                    ? req.query.seller.ids
                    : undefined
            },
            customer: {
                // typeOf: cinerinoapi.factory.personType.Person,
                ids: (req.query.customer !== undefined && req.query.customer.ids !== undefined && req.query.customer.ids !== '')
                    ? req.query.customer.ids.split(',').map((v) => v.trim())
                    : undefined,
                membershipNumbers: (req.query.customer !== undefined
                    && req.query.customer.membershipNumbers !== undefined
                    && req.query.customer.membershipNumbers !== '')
                    ? req.query.customer.membershipNumbers.split(',').map((v) => v.trim())
                    : undefined,
                identifiers: (req.query.customer !== undefined && Array.isArray(req.query.customer.userPoolClients))
                    ? req.query.customer.userPoolClients.map((userPoolClient) => {
                        return {
                            name: 'clientId',
                            value: userPoolClient
                        };
                    })
                    : undefined,
                // : [
                //     ...searchUserPoolClientsResult.data.map((userPoolClient) => {
                //         return {
                //             name: 'clientId',
                //             value: <string>userPoolClient.ClientId
                //         };
                //     }),
                //     ...searchAdminUserPoolClientsResult.data.map((userPoolClient) => {
                //         return {
                //             name: 'clientId',
                //             value: <string>userPoolClient.ClientId
                //         };
                //     })
                // ],
                givenName: (req.query.customer !== undefined && req.query.customer.givenName !== '')
                    ? req.query.customer.givenName
                    : undefined,
                familyName: (req.query.customer !== undefined && req.query.customer.familyName !== '')
                    ? req.query.customer.familyName
                    : undefined,
                email: (req.query.customer !== undefined && req.query.customer.email !== '')
                    ? req.query.customer.email
                    : undefined,
                telephone: (req.query.customer !== undefined && req.query.customer.telephone !== '')
                    ? req.query.customer.telephone
                    : undefined
            },
            orderNumbers: (req.query.orderNumbers !== undefined && req.query.orderNumbers !== '')
                ? req.query.orderNumbers.split(',').map((v) => v.trim())
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
                ? req.query.confirmationNumbers.split(',').map((v) => v.trim())
                : [],
            acceptedOffers: {
                itemOffered: {
                    reservationFor: {
                        ids: (req.query.acceptedOffers !== undefined
                            && req.query.acceptedOffers.itemOffered !== undefined
                            && req.query.acceptedOffers.itemOffered.reservationFor !== undefined
                            && req.query.acceptedOffers.itemOffered.reservationFor.ids !== '')
                            ? req.query.acceptedOffers.itemOffered.reservationFor.ids.split(',').map((v) => v.trim())
                            : [],
                        superEvent: {
                            ids: (req.query.acceptedOffers !== undefined
                                && req.query.acceptedOffers.itemOffered !== undefined
                                && req.query.acceptedOffers.itemOffered.reservationFor !== undefined
                                && req.query.acceptedOffers.itemOffered.reservationFor.superEvent !== undefined
                                && req.query.acceptedOffers.itemOffered.reservationFor.superEvent.ids !== '')
                                ? req.query.acceptedOffers.itemOffered.reservationFor.superEvent.ids
                                    .split(',').map((v) => v.trim())
                                : [],
                            workPerformed: {
                                identifiers: (req.query.acceptedOffers !== undefined
                                    && req.query.acceptedOffers.itemOffered !== undefined
                                    && req.query.acceptedOffers.itemOffered.reservationFor !== undefined
                                    && req.query.acceptedOffers.itemOffered.reservationFor.superEvent !== undefined
                                    && req.query.acceptedOffers.itemOffered.reservationFor.superEvent.workPerformed !== undefined
                                    && req.query.acceptedOffers.itemOffered.reservationFor.superEvent.workPerformed.identifiers !== '')
                                    ? req.query.acceptedOffers.itemOffered.reservationFor.superEvent.workPerformed.identifiers
                                        .split(',').map((v) => v.trim())
                                    : []
                            }
                        }
                    }
                }
            },
            paymentMethods: {
                typeOfs: (req.query.paymentMethods !== undefined
                    && req.query.paymentMethods.typeOfs !== undefined)
                    ? req.query.paymentMethods.typeOfs
                    : undefined,
                // : Object.values(cinerinoapi.factory.paymentMethodType),
                paymentMethodIds: (req.query.paymentMethods !== undefined
                    && req.query.paymentMethods.paymentMethodIds !== undefined
                    && req.query.paymentMethods.paymentMethodIds !== '')
                    ? req.query.paymentMethods.paymentMethodIds.split(',').map((v) => v.trim())
                    : []
            }
        };
        if (req.query.format === 'datatable') {
            const searchOrdersResult = yield orderService.search({
                limit: searchConditions.limit,
                page: searchConditions.page,
                orderDateFrom: searchConditions.orderDateFrom,
                orderDateThrough: searchConditions.orderDateThrough,
                seller: searchConditions.seller,
                customer: searchConditions.customer,
                orderNumbers: searchConditions.orderNumbers,
                orderStatuses: searchConditions.orderStatuses,
                confirmationNumbers: searchConditions.confirmationNumbers,
                acceptedOffers: searchConditions.acceptedOffers,
                paymentMethods: searchConditions.paymentMethods
            });
            res.json({
                draw: req.query.draw,
                recordsTotal: searchOrdersResult.totalCount,
                recordsFiltered: searchOrdersResult.totalCount,
                data: searchOrdersResult.data
            });
        }
        else {
            res.render('orders/index', {
                moment: moment,
                movieTheaters: searchSellersResult.data,
                userPoolClients: userPoolClients,
                adminUserPoolClients: adminUserPoolClients,
                searchConditions: searchConditions,
                orderStatusChoices: orderStatusChoices,
                PaymentMethodType: cinerinoapi.factory.paymentMethodType
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 注文詳細
 */
ordersRouter.get('/:orderNumber', 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const orderService = new cinerinoapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchOrdersResult = yield orderService.search({
            orderNumbers: [req.params.orderNumber],
            orderDateFrom: moment('2017-04-20T00:00:00+09:00').toDate(),
            orderDateThrough: new Date()
        });
        const order = searchOrdersResult.data.shift();
        if (order === undefined) {
            throw new cinerinoapi.factory.errors.NotFound('Order');
        }
        let actionsOnOrder = [];
        let timelines = [];
        try {
            actionsOnOrder = yield orderService.searchActionsByOrderNumber({
                orderNumber: order.orderNumber,
                sort: { endDate: cinerinoapi.factory.sortType.Ascending }
            });
            // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
            timelines = actionsOnOrder.map((a) => {
                let agent;
                if (a.agent.typeOf === cinerinoapi.factory.personType.Person) {
                    const url = (a.agent.memberOf !== undefined)
                        ? `/people/${a.agent.id}`
                        : `/userPools/${process.env.DEFAULT_COGNITO_USER_POOL_ID}/clients/${a.agent.id}`;
                    agent = {
                        id: a.agent.id,
                        name: order.customer.name,
                        url: url
                    };
                }
                else if (a.agent.typeOf === cinerinoapi.factory.organizationType.MovieTheater) {
                    agent = {
                        id: a.agent.id,
                        name: order.seller.name,
                        url: `/organizations/movieTheater/${a.agent.id}`
                    };
                }
                let actionName;
                switch (a.typeOf) {
                    case cinerinoapi.factory.actionType.OrderAction:
                        actionName = '注文';
                        break;
                    case cinerinoapi.factory.actionType.GiveAction:
                        actionName = '付与';
                        break;
                    case cinerinoapi.factory.actionType.SendAction:
                        if (a.object.typeOf === 'Order') {
                            actionName = '配送';
                        }
                        else if (a.object.typeOf === cinerinoapi.factory.creativeWorkType.EmailMessage) {
                            actionName = '送信';
                        }
                        else {
                            actionName = '送信';
                        }
                        break;
                    case cinerinoapi.factory.actionType.PayAction:
                        actionName = '支払';
                        break;
                    case cinerinoapi.factory.actionType.ReturnAction:
                        if (a.object.typeOf === 'Order') {
                            actionName = '返品';
                        }
                        else {
                            actionName = '返却';
                        }
                        break;
                    case cinerinoapi.factory.actionType.RefundAction:
                        actionName = '返金';
                        break;
                    default:
                        actionName = a.typeOf;
                }
                let object;
                if (Array.isArray(a.object)) {
                    switch (a.object[0].typeOf) {
                        case 'PaymentMethod':
                            object = a.object[0].paymentMethod.name;
                            break;
                        case cinerinoapi.factory.actionType.PayAction:
                            object = a.object[0].object.paymentMethod.typeOf;
                            break;
                        default:
                            object = a.object[0].typeOf;
                    }
                }
                else {
                    switch (a.object.typeOf) {
                        case 'Order':
                            object = '注文';
                            break;
                        case cinerinoapi.factory.action.transfer.give.pointAward.ObjectType.PointAward:
                            object = 'ポイント';
                            break;
                        case cinerinoapi.factory.actionType.SendAction:
                            if (a.object.typeOf === 'Order') {
                                object = '配送';
                            }
                            else if (a.object.typeOf === cinerinoapi.factory.creativeWorkType.EmailMessage) {
                                object = '送信';
                            }
                            else {
                                object = '送信';
                            }
                            break;
                        case cinerinoapi.factory.creativeWorkType.EmailMessage:
                            object = 'Eメール';
                            break;
                        case 'PaymentMethod':
                            object = a.object.object[0].paymentMethod.name;
                            break;
                        case cinerinoapi.factory.actionType.PayAction:
                            object = a.object.object[0].paymentMethod.typeOf;
                            break;
                        default:
                            object = a.object.typeOf;
                    }
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
        }
        catch (error) {
            // no op
        }
        res.render('orders/show', {
            moment: moment,
            order: order,
            timelines: timelines,
            ActionStatusType: cinerinoapi.factory.actionStatusType
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 注文返品
 */
ordersRouter.post('/:orderNumber/return', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const returnOrderService = new cinerinoapi.service.txn.ReturnOrder({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const returnOrderTransaction = yield returnOrderService.start({
            expires: moment().add(1, 'minutes').toDate(),
            object: {
                order: {
                    orderNumber: req.params.orderNumber
                }
            }
        });
        yield returnOrderService.confirm(returnOrderTransaction);
        res.status(http_status_1.ACCEPTED).end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 注文配送メール送信
 */
ordersRouter.post('/:orderNumber/sendEmailMessage', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeOrderService = new cinerinoapi.service.transaction.PlaceOrder({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const taskService = new cinerinoapi.service.Task({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchTransactionsResult = yield placeOrderService.search({
            limit: 1,
            typeOf: cinerinoapi.factory.transactionType.PlaceOrder,
            result: { order: { orderNumbers: [req.params.orderNumber] } }
        });
        if (searchTransactionsResult.totalCount === 0) {
            throw new cinerinoapi.factory.errors.NotFound('Order');
        }
        const placeOrderTransaction = searchTransactionsResult.data[0];
        const potentialActions = placeOrderTransaction.potentialActions;
        if (potentialActions === undefined) {
            throw new cinerinoapi.factory.errors.NotFound('Transactino potentialActions');
        }
        const orderPotentialActions = potentialActions.order.potentialActions;
        if (orderPotentialActions === undefined) {
            throw new cinerinoapi.factory.errors.NotFound('Order potentialActions');
        }
        if (orderPotentialActions.sendOrder === undefined) {
            throw new cinerinoapi.factory.errors.NotFound('SendOrder actionAttributes');
        }
        const sendOrderPotentialActions = orderPotentialActions.sendOrder.potentialActions;
        if (sendOrderPotentialActions === undefined) {
            throw new cinerinoapi.factory.errors.NotFound('SendOrder potentialActions');
        }
        const sendEmailMessageActionAttributes = sendOrderPotentialActions.sendEmailMessage;
        if (sendEmailMessageActionAttributes === undefined) {
            throw new cinerinoapi.factory.errors.NotFound('SendEmailMessage actionAttributes');
        }
        const taskAttributes = {
            name: cinerinoapi.factory.taskName.SendEmailMessage,
            status: cinerinoapi.factory.taskStatus.Ready,
            runsAt: new Date(),
            remainingNumberOfTries: 3,
            lastTriedAt: null,
            numberOfTried: 0,
            executionResults: [],
            data: {
                actionAttributes: sendEmailMessageActionAttributes
            }
        };
        const task = yield taskService.create(taskAttributes);
        res.status(http_status_1.CREATED).json(task);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = ordersRouter;
