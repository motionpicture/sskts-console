/**
 * Pecorinoルーター
 */
// import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

const pecorinoRouter = express.Router();

pecorinoRouter.get(
    '/accounts/coin',
    async (_, res, next) => {
        try {
            res.render('pecorino/accounts/coin/index', {
                moment: moment
            });
        } catch (error) {
            next(error);
        }
    }
);

pecorinoRouter.get(
    '/accounts/point',
    async (_, res, next) => {
        try {
            res.render('pecorino/accounts/point/index', {
                moment: moment
            });
        } catch (error) {
            next(error);
        }
    }
);

export default pecorinoRouter;
