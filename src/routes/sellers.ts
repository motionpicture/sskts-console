/**
 * 販売者ルーター
 */
import * as COA from '@motionpicture/coa-service';
import * as createDebug from 'debug';
import * as express from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';

import * as chevreapi from '../chevreapi';
import * as cinerinoapi from '../cinerinoapi';

const debug = createDebug('cinerino-console:routes');
const sellersRouter = express.Router();

const PROJECT_ORGANIZATION = JSON.parse((process.env.PROJECT_ORGANIZATION !== undefined) ? process.env.PROJECT_ORGANIZATION : '{}');

/**
 * 販売者検索
 */
sellersRouter.get(
    '',
    async (req, res, next) => {
        try {
            const sellerService = new cinerinoapi.service.Seller({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchConditions: cinerinoapi.factory.organization.ISearchConditions<cinerinoapi.factory.organizationType> = {
                limit: req.query.limit,
                page: req.query.page,
                name: req.query.name
            };
            if (req.query.format === 'datatable') {
                const searchMovieTheatersResult = await sellerService.search(searchConditions);
                res.json({
                    draw: req.query.draw,
                    recordsTotal: searchMovieTheatersResult.totalCount,
                    recordsFiltered: searchMovieTheatersResult.totalCount,
                    data: searchMovieTheatersResult.data
                });
            } else {
                res.render('sellers/index', {
                    searchConditions: searchConditions
                });
            }
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 販売者追加
 */
sellersRouter.all(
    '/new',
    async (req, res, next) => {
        try {
            let message;
            let attributes: cinerinoapi.factory.organization.IAttributes<cinerinoapi.factory.organizationType> | undefined;
            if (req.method === 'POST') {
                try {
                    attributes = await createAttributesFromBody({ body: req.body, authClient: req.user.chevreAuthClient });
                    debug('creating organization...', attributes);
                    const sellerService = new cinerinoapi.service.Seller({
                        endpoint: <string>process.env.API_ENDPOINT,
                        auth: req.user.authClient
                    });
                    const seller = await sellerService.create<cinerinoapi.factory.organizationType>(attributes);
                    req.flash('message', '販売者を作成しました');
                    res.redirect(`/sellers/${seller.id}`);

                    return;
                } catch (error) {
                    debug(error);
                    message = error.message;
                }
            }

            res.render('sellers/new', {
                message: message,
                attributes: attributes,
                PaymentMethodType: cinerinoapi.factory.paymentMethodType,
                OrganizationType: cinerinoapi.factory.organizationType,
                PlaceType: cinerinoapi.factory.placeType,
                WebAPIIdentifier: cinerinoapi.factory.service.webAPI.Identifier
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 販売者編集
 */
sellersRouter.all(
    '/:id',
    async (req, res, next) => {
        try {
            let message;
            let attributes: cinerinoapi.factory.organization.IAttributes<cinerinoapi.factory.organizationType> | undefined;
            const sellerService = new cinerinoapi.service.Seller({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const seller = await sellerService.findById({ id: req.params.id });
            if (req.method === 'DELETE') {
                await sellerService.deleteById({ id: req.params.id });
                res.status(NO_CONTENT).end();

                return;
            } else if (req.method === 'POST') {
                try {
                    attributes = await createAttributesFromBody({ body: req.body, authClient: req.user.chevreAuthClient });
                    await sellerService.update({ id: req.params.id, attributes: attributes });
                    req.flash('message', '更新しました');
                    res.redirect(req.originalUrl);

                    return;
                } catch (error) {
                    message = error.message;
                }
            }
            res.render('sellers/edit', {
                message: message,
                seller: seller,
                PaymentMethodType: cinerinoapi.factory.paymentMethodType,
                OrganizationType: cinerinoapi.factory.organizationType,
                PlaceType: cinerinoapi.factory.placeType,
                WebAPIIdentifier: cinerinoapi.factory.service.webAPI.Identifier
            });
        } catch (error) {
            next(error);
        }
    }
);

// tslint:disable-next-line:max-func-body-length
async function createAttributesFromBody(params: {
    body: any;
    authClient: any;
}): Promise<cinerinoapi.factory.organization.IAttributes<cinerinoapi.factory.organizationType>> {
    let movieTheaterFromChevre: cinerinoapi.factory.chevre.place.movieTheater.IPlace;
    const webAPIIdentifier = params.body.makesOffer.offeredThrough.identifier;
    const branchCode: string = params.body.branchCode;

    switch (webAPIIdentifier) {
        case cinerinoapi.factory.service.webAPI.Identifier.COA:
            // COAから情報取得
            const theaterFromCOA = await COA.services.master.theater({ theaterCode: branchCode });
            movieTheaterFromChevre = {
                typeOf: cinerinoapi.factory.chevre.placeType.MovieTheater,
                branchCode: theaterFromCOA.theaterCode,
                name: {
                    ja: (theaterFromCOA !== undefined) ? theaterFromCOA.theaterName : '',
                    en: (theaterFromCOA !== undefined) ? theaterFromCOA.theaterNameEng : ''
                },
                telephone: theaterFromCOA.theaterTelNum,
                screenCount: 0, // 使用しないので適当に
                kanaName: '', // 使用しないので適当に
                id: '', // 使用しないので適当に
                containsPlace: [] // 使用しないので適当に
            };

            break;

        case cinerinoapi.factory.service.webAPI.Identifier.Chevre:
            // Chevreから情報取得
            const placeService = new chevreapi.service.Place({
                endpoint: <string>process.env.CHEVRE_ENDPOINT,
                auth: params.authClient
            });
            movieTheaterFromChevre = await placeService.findMovieTheaterByBranchCode({ branchCode: branchCode });
            break;

        default:
            throw new Error(`Unsupported WebAPI identifier: ${webAPIIdentifier}`);
    }

    const paymentAccepted: cinerinoapi.factory.organization.IPaymentAccepted<cinerinoapi.factory.paymentMethodType>[] = [
        {
            paymentMethodType: cinerinoapi.factory.paymentMethodType.CreditCard,
            gmoInfo: {
                siteId: <string>process.env.GMO_SITE_ID,
                shopId: params.body.gmoInfo.shopId,
                shopPass: params.body.gmoInfo.shopPass
            }
        }
    ];

    // ムビチケ決済を有効にする場合
    if (params.body.movieTicketPaymentAccepted === 'on') {
        paymentAccepted.push({
            paymentMethodType: cinerinoapi.factory.paymentMethodType.MovieTicket,
            movieTicketInfo: params.body.movieTicketInfo
        });
    }

    // if (!Array.isArray(movieTheater.paymentAccepted)) {
    //     movieTheater.paymentAccepted = [];
    // }
    // コイン口座決済を有効にする場合、口座未開設であれば開設する
    if (params.body.coinAccountPaymentAccepted === 'on') {
        if (params.body.coinAccountPayment.accountNumber === '') {
            // const account = await cinerinoapi.service.account.open({
            //     name: movieTheater.name.ja
            // })({
            //     accountNumber: new cinerino.repository.AccountNumber(redisClient),
            //     accountService: new cinerino.pecorinoapi.service.Account({
            //         endpoint: <string>process.env.PECORINO_API_ENDPOINT,
            //         auth: pecorinoAuthClient
            //     })
            // });
            // debug('account opened.');
            // update.paymentAccepted.push({
            //     paymentMethodType: cinerino.factory.paymentMethodType.Pecorino,
            //     accountNumber: account.accountNumber
            // });
        } else {
            paymentAccepted.push({
                paymentMethodType: cinerinoapi.factory.paymentMethodType.Account,
                accountType: cinerinoapi.factory.accountType.Coin,
                accountNumber: params.body.coinAccountPayment.accountNumber
            });
        }
    }

    // ポイント口座決済を有効にする場合、口座未開設であれば開設する
    if (params.body.pointAccountPaymentAccepted === 'on') {
        if (params.body.pointAccountPayment.accountNumber === '') {
            // const account = await cinerinoapi.service.account.open({
            //     name: movieTheater.name.ja
            // })({
            //     accountNumber: new cinerino.repository.AccountNumber(redisClient),
            //     accountService: new cinerino.pecorinoapi.service.Account({
            //         endpoint: <string>process.env.PECORINO_API_ENDPOINT,
            //         auth: pecorinoAuthClient
            //     })
            // });
            // debug('account opened.');
            // update.paymentAccepted.push({
            //     paymentMethodType: cinerino.factory.paymentMethodType.Pecorino,
            //     accountNumber: account.accountNumber
            // });
        } else {
            paymentAccepted.push({
                paymentMethodType: cinerinoapi.factory.paymentMethodType.Account,
                accountType: cinerinoapi.factory.accountType.Point,
                accountNumber: params.body.pointAccountPayment.accountNumber
            });
        }
    }

    // 現金決済を有効にする場合
    if (params.body.cashPaymentAccepted === 'on') {
        paymentAccepted.push({
            paymentMethodType: cinerinoapi.factory.paymentMethodType.Cash
        });
    }

    // 電子マネー決済を有効にする場合
    if (params.body.emoneyPaymentAccepted === 'on') {
        paymentAccepted.push({
            paymentMethodType: cinerinoapi.factory.paymentMethodType.EMoney
        });
    }

    const hasPOS: cinerinoapi.factory.organization.IPOS[] = [];
    if (Array.isArray(params.body.hasPOS)) {
        params.body.hasPOS.forEach((pos: any) => {
            if (pos.id !== '') {
                hasPOS.push({
                    typeOf: 'POS',
                    id: pos.id,
                    name: pos.name
                });
            }
        });
    }

    const areaServed: cinerinoapi.factory.organization.IAreaServed<typeof params.body.typeOf>[] = [];
    if (Array.isArray(params.body.areaServed)) {
        params.body.areaServed.forEach((area: any) => {
            if (area.id !== '') {
                areaServed.push({
                    typeOf: area.typeOf,
                    id: area.id,
                    name: area.name
                });
            }
        });
    }

    const makesOffer = [
        {
            typeOf: <'Offer'>'Offer',
            priceCurrency: cinerinoapi.factory.priceCurrency.JPY,
            offeredThrough: {
                typeOf: <'WebAPI'>'WebAPI',
                identifier: params.body.makesOffer.offeredThrough.identifier
            },
            itemOffered: {
                typeOf: cinerinoapi.factory.chevre.reservationType.EventReservation,
                reservationFor: {
                    typeOf: cinerinoapi.factory.chevre.eventType.ScreeningEventSeries,
                    location: {
                        typeOf: movieTheaterFromChevre.typeOf,
                        branchCode: movieTheaterFromChevre.branchCode
                    }
                }
            }
        }
    ];

    return {
        typeOf: params.body.typeOf,
        name: movieTheaterFromChevre.name,
        legalName: movieTheaterFromChevre.name,
        parentOrganization: PROJECT_ORGANIZATION,
        location: {
            typeOf: movieTheaterFromChevre.typeOf,
            branchCode: movieTheaterFromChevre.branchCode,
            name: movieTheaterFromChevre.name
        },
        telephone: movieTheaterFromChevre.telephone,
        url: params.body.url,
        paymentAccepted: paymentAccepted,
        hasPOS: hasPOS,
        areaServed: areaServed,
        makesOffer: makesOffer
    };
}

/**
 * 劇場の注文検索
 */
sellersRouter.get(
    '/:id/orders',
    async (req, res, next) => {
        try {
            const orderService = new cinerinoapi.service.Order({
                endpoint: <string>process.env.API_ENDPOINT,
                auth: req.user.authClient
            });
            const searchOrdersResult = await orderService.search({
                limit: req.query.limit,
                page: req.query.page,
                sort: { orderDate: cinerinoapi.factory.sortType.Descending },
                orderDateFrom: moment().add(-1, 'months').toDate(),
                orderDateThrough: new Date(),
                seller: {
                    typeOf: cinerinoapi.factory.organizationType.MovieTheater,
                    ids: [req.params.id]
                }
            });
            debug(searchOrdersResult.totalCount, 'orders found.');
            res.json(searchOrdersResult);
        } catch (error) {
            next(error);
        }
    }
);

export default sellersRouter;
