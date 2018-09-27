/**
 * ルーター
 */
import * as express from 'express';

import authentication from '../middlewares/authentication';

import accountsRouter from './accounts';
import authRouter from './auth';
import eventsRouter from './events';
import homeRouter from './home';
import ordersRouter from './orders';
import organizationsRouter from './organizations';
import transactionsRouter from './transactions';

const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use(authRouter);

router.use(authentication);
router.use(homeRouter);
router.use('/accounts', accountsRouter);
router.use('/events', eventsRouter);
router.use('/orders', ordersRouter);
router.use('/organizations', organizationsRouter);
router.use('/transactions', transactionsRouter);

export default router;
