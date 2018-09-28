/**
 * アプリケーション固有の型定義
 */
import * as express from 'express';

import User from '../user';
declare global {
    namespace Express {
        // tslint:disable-next-line:interface-name
        export interface Request {
            user: User;
        }
    }
}
