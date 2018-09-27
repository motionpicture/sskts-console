/**
 * 取引ルーター
 */
// import * as ssktsapi from '@motionpicture/sskts-api-nodejs-client';
import * as createDebug from 'debug';
import * as express from 'express';
// import * as moment from 'moment';

const debug = createDebug('sskts-console:routes:account');
const transactionsRouter = express.Router();

/**
 * 取引検索
 */
transactionsRouter.get(
    '/',
    async (req, _, next) => {
        try {
            debug('searching transactions...', req.query);
            throw new Error('Not implemented');
        } catch (error) {
            next(error);
        }
    });

export default transactionsRouter;
