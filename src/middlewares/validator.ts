/**
 * バリデーターミドルウェア
 */
import { NextFunction, Request, Response } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { validationResult } from 'express-validator/check';
import { BAD_REQUEST } from 'http-status';

import { factory } from '../cinerinoapi';
import { APIError } from '../error/api';

export default async (req: Request, __: Response, next: NextFunction) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        next(new APIError(BAD_REQUEST, errors.array()
            .map((mappedRrror: any) => {
                return new factory.errors.Argument(mappedRrror.param, mappedRrror.msg);
            })));
    } else {
        next();
    }
};
