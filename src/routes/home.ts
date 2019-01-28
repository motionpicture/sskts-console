/**
 * ホームルーター
 */
// import * as createDebug from 'debug';
import * as express from 'express';

import * as ssktsapi from '../ssktsapi';

// const debug = createDebug('cinerino-console:routes');
const homeRouter = express.Router();

homeRouter.get(
    '/',
    async (req, res, next) => {
        try {
            const userPoolService = new ssktsapi.service.UserPool({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const organizationService = new ssktsapi.service.Organization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const userPool = await userPoolService.findById({
                userPoolId: <string>process.env.DEFAULT_COGNITO_USER_POOL_ID
            });
            const searchUserPoolClientsResult = await userPoolService.searchClients({ userPoolId: <string>userPool.Id });
            const sellers = await organizationService.searchMovieTheaters({});

            res.render('index', {
                message: 'Welcome to SSKTS Console!',
                userPool: userPool,
                userPoolClients: searchUserPoolClientsResult.data,
                PaymentMethodType: ssktsapi.factory.paymentMethodType,
                sellers: sellers
            });
        } catch (error) {
            next(error);
        }
    }
);
export default homeRouter;
