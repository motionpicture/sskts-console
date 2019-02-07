/**
 * 会員ルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

import * as cinerinoapi from '../cinerinoapi';

const debug = createDebug('cinerino-console:routes');
const peopleRouter = express.Router();

type IAccountOwnershipInfo =
    // tslint:disable-next-line:max-line-length
    cinerinoapi.factory.ownershipInfo.IOwnershipInfo<cinerinoapi.factory.ownershipInfo.IGoodWithDetail<cinerinoapi.factory.ownershipInfo.AccountGoodType.Account>>;

/**
 * 会員検索
 */
peopleRouter.get(
    '',
    // tslint:disable-next-line:cyclomatic-complexity
    async (req, res, next) => {
        try {
            debug('req.query:', req.query);
            const personService = new cinerinoapi.service.Person({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchConditions = {
                // limit: req.query.limit,
                // page: req.query.page,
                id: (req.query.id !== undefined && req.query.id !== '') ? req.query.id : undefined,
                username: (req.query.username !== undefined && req.query.username !== '') ? req.query.username : undefined,
                email: (req.query.email !== undefined && req.query.email !== '') ? req.query.email : undefined,
                telephone: (req.query.telephone !== undefined && req.query.telephone !== '') ? req.query.telephone : undefined,
                familyName: (req.query.familyName !== undefined && req.query.familyName !== '') ? req.query.familyName : undefined,
                givenName: (req.query.givenName !== undefined && req.query.givenName !== '') ? req.query.givenName : undefined
            };
            if (req.query.format === 'datatable') {
                const searchResult = await personService.search(searchConditions);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: searchResult.totalCount,
                    recordsFiltered: searchResult.totalCount,
                    data: searchResult.data
                });
            } else {
                res.render('people/index', {
                    moment: moment,
                    searchConditions: searchConditions
                });
            }
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 会員詳細
 */
peopleRouter.get(
    '/:id',
    async (req, res, next) => {
        try {
            const message = '';
            const personService = new cinerinoapi.service.Person({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const personOwnershipInfoService = new cinerinoapi.service.person.OwnershipInfo({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const person = await personService.findById({ id: req.params.id });

            let creditCards: cinerinoapi.factory.paymentMethod.paymentCard.creditCard.ICheckedCard[] = [];
            let coinAccounts: IAccountOwnershipInfo[] = [];

            try {
                creditCards = await personOwnershipInfoService.searchCreditCards({ id: req.params.id });
            } catch (error) {
                // no op
            }

            try {
                const searchCoinAccountsResult =
                    await personOwnershipInfoService.search<cinerinoapi.factory.ownershipInfo.AccountGoodType.Account>({
                        id: req.params.id,
                        typeOfGood: {
                            typeOf: cinerinoapi.factory.ownershipInfo.AccountGoodType.Account,
                            accountType: cinerinoapi.factory.accountType.Coin
                        }
                    });
                coinAccounts = searchCoinAccountsResult.data;
            } catch (error) {
                // no op
            }

            res.render('people/show', {
                message: message,
                moment: moment,
                person: person,
                creditCards: creditCards,
                coinAccounts: coinAccounts
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 会員注文検索
 */
peopleRouter.get(
    '/:id/orders',
    async (req, res, next) => {
        try {
            const orderService = new cinerinoapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchOrdersResult = await orderService.search({
                limit: req.query.limit,
                page: req.query.page,
                sort: { orderDate: cinerinoapi.factory.sortType.Descending },
                orderDateFrom: moment()
                    .add(-1, 'months')
                    .toDate(),
                orderDateThrough: new Date(),
                customer: {
                    typeOf: cinerinoapi.factory.personType.Person,
                    ids: [req.params.id]
                }
            });
            debug(searchOrdersResult.totalCount, 'orders found.');
            res.json(searchOrdersResult);
        } catch (error) {
            next(error);
        }
    }
);

export default peopleRouter;
