/**
 * ホームルーター
 */
import * as sskts from '@motionpicture/sskts-domain';
import * as createDebug from 'debug';
import * as express from 'express';
import * as moment from 'moment';

const debug = createDebug('sskts-console:routes:home');
const homeRouter = express.Router();

homeRouter.get(
    '/',
    async (_, res, next) => {
        try {

            // 集計単位数分の集計を行う
            const telemetryUnitTimeInSeconds = 60; // 集計単位時間(秒)
            const numberOfAggregationUnit = 720; // 集計単位数
            // tslint:disable-next-line:no-magic-numbers
            const dateNow = moment();
            const dateNowByUnitTime = moment.unix(dateNow.unix() - (dateNow.unix() % telemetryUnitTimeInSeconds));

            // 基本的に、集計は別のジョブでやっておいて、この報告ジョブでは取得して表示するだけのイメージ
            // tslint:disable-next-line:no-magic-numbers
            const measuredFrom = moment(dateNowByUnitTime).add(numberOfAggregationUnit * -telemetryUnitTimeInSeconds, 'seconds');

            debug('reporting telemetries measuredFrom - dateTo...', measuredFrom, dateNowByUnitTime);
            const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
            const telemetryRepo = new sskts.repository.Telemetry(sskts.mongoose.connection);

            const movieTheaters = await organizationRepo.searchMovieTheaters({});

            const globalTelemetries = await sskts.service.report.telemetry.searchGlobalStock({
                measuredFrom: measuredFrom.toDate(),
                measuredThrough: dateNowByUnitTime.toDate()
            })({ telemetry: telemetryRepo });
            debug('globalTelemetries length:', globalTelemetries.length);

            const sellerTelemetries = await sskts.service.report.telemetry.searchSellerStock({
                measuredFrom: measuredFrom.toDate(),
                measuredThrough: dateNowByUnitTime.toDate()
            })({ telemetry: telemetryRepo });
            debug('sellerTelemetries length:', sellerTelemetries.length);

            // await reportNumberOfTasksUnexecuted(globalTelemetries);

            // 販売者ごとにレポート送信
            await Promise.all(movieTheaters.map(async (movieTheater) => {
                debug('reporting...seller:', movieTheater.id);
                // const telemetriesBySellerId = sellerTelemetries.filter((telemetry) => telemetry.object.sellerId === movieTheater.id);
                // await reportNumberOfTransactionsUnderway(movieTheater.name.ja, telemetriesBySellerId);
            }));

            res.render('index', {
                message: 'Welcome to SSKTS Console!',
                movieTheaters: movieTheaters,
                globalTelemetries: globalTelemetries,
                sellerTelemetries: sellerTelemetries
            });
        } catch (error) {
            next(error);
        }
    });

export default homeRouter;
