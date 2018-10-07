/**
 * 会員ルーター
 */
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

import * as ssktsapi from '../ssktsapi';

const debug = createDebug('cinerino-console:routes');
const peopleRouter = express.Router();
/**
 * 会員検索
 */
peopleRouter.get(
    '',
    // tslint:disable-next-line:cyclomatic-complexity
    async (req, res, next) => {
        try {
            debug('req.query:', req.query);
            const personService = new ssktsapi.service.Person({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchConditions = {
                // limit: req.query.limit,
                // page: req.query.page,
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
    async (_, __, next) => {
        try {
            throw new Error('implementing...');
        } catch (error) {
            next(error);
        }
    }
);
export default peopleRouter;
