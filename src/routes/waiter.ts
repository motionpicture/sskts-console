/**
 * Waiterルーター
 */
// import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';
import * as request from 'request-promise-native';

// import * as ssktsapi from '../ssktsapi';

const waiterRouter = express.Router();
waiterRouter.get(
    '/rules',
    async (req, res, next) => {
        try {
            if (req.query.format === 'datatable') {
                const rules = await request.get(`${process.env.WAITER_ENDPOINT}/rules`, { json: true }).promise();
                res.json({
                    draw: req.query.draw,
                    recordsTotal: rules.length,
                    recordsFiltered: rules.length,
                    data: rules
                });
            } else {
                res.render('waiter/rules', {
                    moment: moment
                });
            }
        } catch (error) {
            next(error);
        }
    }
);
export default waiterRouter;