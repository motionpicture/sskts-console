"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Waiterルーター
 */
// import * as createDebug from 'debug';
const express = require("express");
const moment = require("moment");
const request = require("request-promise-native");
// import * as cinerinoapi from '../cinerinoapi';
const waiterRouter = express.Router();
waiterRouter.get('/rules', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (req.query.format === 'datatable') {
            const rules = yield request.get(`${process.env.WAITER_ENDPOINT}/projects/${process.env.PROJECT_ID}/rules`, { json: true })
                .promise();
            res.json({
                draw: req.query.draw,
                recordsTotal: rules.length,
                recordsFiltered: rules.length,
                data: rules
            });
        }
        else {
            res.render('waiter/rules', {
                moment: moment
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = waiterRouter;
