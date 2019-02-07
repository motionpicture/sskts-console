/**
 * ホームルーター
 */
// import * as createDebug from 'debug';
import * as express from 'express';
// import * as moment from 'moment';

import * as cinerinoapi from '../cinerinoapi';
// const debug = createDebug('cinerino-console:routes');
const homeRouter = express.Router();

homeRouter.get(
    '/',
    async (req, res, next) => {
        try {
            const userPoolService = new cinerinoapi.service.UserPool({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const organizationService = new cinerinoapi.service.Organization({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });

            let userPool: cinerinoapi.factory.cognito.UserPoolType | undefined;
            let userPoolClients: cinerinoapi.factory.cognito.UserPoolClientListType = [];
            let adminUserPool: cinerinoapi.factory.cognito.UserPoolType | undefined;
            let adminUserPoolClients: cinerinoapi.factory.cognito.UserPoolClientListType = [];

            try {
                userPool = await userPoolService.findById({
                    userPoolId: <string>process.env.DEFAULT_COGNITO_USER_POOL_ID
                });

                const searchUserPoolClientsResult = await userPoolService.searchClients({ userPoolId: <string>userPool.Id });
                userPoolClients = searchUserPoolClientsResult.data;

                adminUserPool = await userPoolService.findById({
                    userPoolId: <string>process.env.ADMIN_COGNITO_USER_POOL_ID
                });

                const searchAdminUserPoolClientsResult = await userPoolService.searchClients({ userPoolId: <string>adminUserPool.Id });
                adminUserPoolClients = searchAdminUserPoolClientsResult.data;
            } catch (error) {
                // no op
            }

            const searchMovieTheatersResult = await organizationService.searchMovieTheaters({});

            res.render('index', {
                message: 'Welcome to Cinerino Console!',
                userPool: userPool,
                userPoolClients: userPoolClients,
                adminUserPool: adminUserPool,
                adminUserPoolClients: adminUserPoolClients,
                PaymentMethodType: cinerinoapi.factory.paymentMethodType,
                sellers: searchMovieTheatersResult.data
            });
        } catch (error) {
            next(error);
        }
    });

export default homeRouter;
