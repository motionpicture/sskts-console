/**
 * 404ハンドラーミドルウェア
 */
import { NextFunction, Request, Response } from 'express';

import * as ssktsapi from '../ssktsapi';

export default (req: Request, __: Response, next: NextFunction) => {
    next(new ssktsapi.factory.errors.NotFound(`router for [${req.originalUrl}]`));
};
