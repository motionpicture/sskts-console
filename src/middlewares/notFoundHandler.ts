/**
 * 404ハンドラーミドルウェア
 */
import { NextFunction, Request, Response } from 'express';

import * as cinerinoapi from '../cinerinoapi';

export default (req: Request, __: Response, next: NextFunction) => {
    next(new cinerinoapi.factory.errors.NotFound(`router for [${req.originalUrl}]`));
};
