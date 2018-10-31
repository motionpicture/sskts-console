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
 * タスクルーター
 */
// import * as createDebug from 'debug';
const express = require("express");
const moment = require("moment");
const ssktsapi = require("../ssktsapi");
// const debug = createDebug('cinerino-console:routes');
const tasksRouter = express.Router();
/**
 * タスク検索
 */
tasksRouter.get('', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        // debug('req.query:', req.query);
        // const taskService = new ssktsapi.service.Task({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        const taskNameChoices = Object.keys(ssktsapi.factory.taskName).map((name) => ssktsapi.factory.taskName[name]);
        const taskStatusChoices = Object.keys(ssktsapi.factory.taskStatus).map((name) => ssktsapi.factory.taskStatus[name]);
        // const searchConditions: ssktsapi.factory.task.ISearchConditions<ssktsapi.factory.taskName> = {
        //     limit: req.query.limit,
        //     page: req.query.page,
        //     name: (req.query.name !== '')
        //         ? req.query.name
        //         : undefined,
        //     statuses: (req.query.statuses !== undefined)
        //         ? req.query.statuses
        //         : taskStatusChoices,
        //     runsFrom: (req.query.runsRange !== undefined && req.query.runsRange !== '')
        //         ? moment(req.query.runsRange.split(' - ')[0]).toDate()
        //         : moment().add(-1, 'month').toDate(),
        //     runsThrough: (req.query.runsRange !== undefined && req.query.runsRange !== '')
        //         ? moment(req.query.runsRange.split(' - ')[1]).toDate()
        //         : moment().add(1, 'day').toDate()
        // };
        if (req.query.format === 'datatable') {
            // const searchResult = await taskService.search(searchConditions);
            const searchResult = { totalCount: 0, data: [] };
            res.json({
                draw: req.query.draw,
                recordsTotal: searchResult.totalCount,
                recordsFiltered: searchResult.totalCount,
                data: searchResult.data
            });
        }
        else {
            res.render('tasks/index', {
                moment: moment,
                searchConditions: {},
                taskNameChoices: taskNameChoices,
                taskStatusChoices: taskStatusChoices
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = tasksRouter;
