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
const sskts = require("@motionpicture/sskts-domain");
// import * as createDebug from 'debug';
const express = require("express");
const moment = require("moment");
const ssktsapi = require("../ssktsapi");
// const debug = createDebug('cinerino-console:routes');
const homeRouter = express.Router();
homeRouter.get('/', (_, res, next) => __awaiter(this, void 0, void 0, function* () {
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
        // debug('reporting telemetries measuredFrom - dateTo...', measuredFrom, dateNowByUnitTime);
        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const telemetryRepo = new sskts.repository.Telemetry(sskts.mongoose.connection);
        const sellers = yield organizationRepo.searchMovieTheaters({});
        const globalTelemetries = yield sskts.service.report.telemetry.searchGlobalStock({
            measuredFrom: measuredFrom.toDate(),
            measuredThrough: dateNowByUnitTime.toDate()
        })({ telemetry: telemetryRepo });
        // const sellerTelemetries = await sskts.service.report.telemetry.searchSellerStock({
        //     measuredFrom: measuredFrom.toDate(),
        //     measuredThrough: dateNowByUnitTime.toDate()
        // })({ telemetry: telemetryRepo });
        // debug('sellerTelemetries length:', sellerTelemetries.length);
        // フローデーターを検索
        // tslint:disable-next-line:no-magic-numbers
        dateNow = moment().add(-30, 'minutes');
        dateNowByUnitTime = moment.unix(dateNow.unix() - (dateNow.unix() % telemetryUnitTimeInSeconds));
        measuredFrom = moment(dateNowByUnitTime).add(numberOfAggregationUnit * -telemetryUnitTimeInSeconds, 'seconds');
        const globalFlowTelemetries = yield sskts.service.report.telemetry.searchGlobalFlow({
            measuredFrom: measuredFrom.toDate(),
            measuredThrough: dateNowByUnitTime.toDate()
        })({ telemetry: telemetryRepo });
        // const sellerFlowTelemetries = await sskts.service.report.telemetry.searchSellerFlow({
        //     measuredFrom: measuredFrom.toDate(),
        //     measuredThrough: dateNowByUnitTime.toDate()
        // })({ telemetry: telemetryRepo });
        // debug(sellerFlowTelemetries.length, 'sellerFlowTelemetries found.');
        res.render('index', {
            message: 'Welcome to SSKTS Console!',
            globalTelemetries: globalTelemetries,
            globalFlowTelemetries: globalFlowTelemetries,
            userPool: {},
            userPoolClients: [],
            PaymentMethodType: ssktsapi.factory.paymentMethodType,
            sellers: sellers
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = homeRouter;
