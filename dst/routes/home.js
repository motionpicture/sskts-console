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
 * ホームルーター
 */
// import * as ssktsapi from '@motionpicture/sskts-api-nodejs-client';
const sskts = require("@motionpicture/sskts-domain");
const createDebug = require("debug");
const express = require("express");
const moment = require("moment");
const debug = createDebug('sskts-console:routes:home');
const homeRouter = express.Router();
homeRouter.get('/', (__, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        // 集計単位数分の集計を行う
        const telemetryUnitTimeInSeconds = 60; // 集計単位時間(秒)
        const numberOfAggregationUnit = 720; // 集計単位数
        // tslint:disable-next-line:no-magic-numbers
        let dateNow = moment();
        let dateNowByUnitTime = moment.unix(dateNow.unix() - (dateNow.unix() % telemetryUnitTimeInSeconds));
        // 基本的に、集計は別のジョブでやっておいて、この報告ジョブでは取得して表示するだけのイメージ
        // tslint:disable-next-line:no-magic-numbers
        let measuredFrom = moment(dateNowByUnitTime).add(numberOfAggregationUnit * -telemetryUnitTimeInSeconds, 'seconds');
        debug('reporting telemetries measuredFrom - dateTo...', measuredFrom, dateNowByUnitTime);
        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const telemetryRepo = new sskts.repository.Telemetry(sskts.mongoose.connection);
        const movieTheaters = yield organizationRepo.searchMovieTheaters({});
        const globalTelemetries = yield sskts.service.report.telemetry.searchGlobalStock({
            measuredFrom: measuredFrom.toDate(),
            measuredThrough: dateNowByUnitTime.toDate()
        })({ telemetry: telemetryRepo });
        debug('globalTelemetries length:', globalTelemetries.length);
        const sellerTelemetries = yield sskts.service.report.telemetry.searchSellerStock({
            measuredFrom: measuredFrom.toDate(),
            measuredThrough: dateNowByUnitTime.toDate()
        })({ telemetry: telemetryRepo });
        debug('sellerTelemetries length:', sellerTelemetries.length);
        // フローデーターを検索
        // tslint:disable-next-line:no-magic-numbers
        dateNow = moment().add(-30, 'minutes');
        dateNowByUnitTime = moment.unix(dateNow.unix() - (dateNow.unix() % telemetryUnitTimeInSeconds));
        measuredFrom = moment(dateNowByUnitTime).add(numberOfAggregationUnit * -telemetryUnitTimeInSeconds, 'seconds');
        const globalFlowTelemetries = yield sskts.service.report.telemetry.searchGlobalFlow({
            measuredFrom: measuredFrom.toDate(),
            measuredThrough: dateNowByUnitTime.toDate()
        })({ telemetry: telemetryRepo });
        debug(globalTelemetries.length, 'globalFlowTelemetries found.');
        const sellerFlowTelemetries = yield sskts.service.report.telemetry.searchSellerFlow({
            measuredFrom: measuredFrom.toDate(),
            measuredThrough: dateNowByUnitTime.toDate()
        })({ telemetry: telemetryRepo });
        debug(sellerFlowTelemetries.length, 'sellerFlowTelemetries found.');
        // 直近の実売上データを
        // const orderService = new ssktsapi.service.Order({
        //     endpoint: <string>process.env.API_ENDPOINT,
        //     auth: req.user.authClient
        // });
        // const orders = await orderService.search({
        //     // tslint:disable-next-line:no-magic-numbers
        //     orderDateFrom: moment().add(-3, 'days').toDate(),
        //     orderDateThrough: moment().toDate()
        // });
        const orders = [];
        res.render('index', {
            message: 'Welcome to SSKTS Console!',
            orders: orders,
            movieTheaters: movieTheaters,
            globalTelemetries: globalTelemetries,
            sellerTelemetries: sellerTelemetries,
            globalFlowTelemetries: globalFlowTelemetries,
            sellerFlowTelemetries: sellerFlowTelemetries
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = homeRouter;
