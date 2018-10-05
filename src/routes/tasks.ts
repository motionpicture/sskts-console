/**
 * タスクルーター
 */
// import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

import * as ssktsapi from '../ssktsapi';

// const debug = createDebug('cinerino-console:routes');
const tasksRouter = express.Router();
/**
 * タスク検索
 */
tasksRouter.get(
    '',
    async (req, res, next) => {
        try {
            // debug('req.query:', req.query);
            // const taskService = new ssktsapi.service.Task({
            //     endpoint: <string>process.env.API_ENDPOINT,
            //     auth: req.user.authClient
            // });
            const taskNameChoices = Object.keys(ssktsapi.factory.taskName).map((name) => (<any>ssktsapi.factory.taskName)[name]);
            const taskStatusChoices = Object.keys(ssktsapi.factory.taskStatus).map((name) => (<any>ssktsapi.factory.taskStatus)[name]);
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
            } else {
                res.render('tasks/index', {
                    moment: moment,
                    searchConditions: {},
                    taskNameChoices: taskNameChoices,
                    taskStatusChoices: taskStatusChoices
                });
            }
        } catch (error) {
            next(error);
        }
    });
export default tasksRouter;
