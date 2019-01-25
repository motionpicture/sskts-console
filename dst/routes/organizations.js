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
 * 組織ルーター
 */
const sskts = require("@motionpicture/sskts-domain");
const createDebug = require("debug");
const express = require("express");
const moment = require("moment");
const ssktsapi = require("../ssktsapi");
const redis_1 = require("../redis");
const debug = createDebug('cinerino-console:routes');
const organizationsRouter = express.Router();
const pecorinoAuthClient = new sskts.pecorinoapi.auth.ClientCredentials({
    domain: process.env.PECORINO_AUTHORIZE_SERVER_DOMAIN,
    clientId: process.env.PECORINO_API_CLIENT_ID,
    clientSecret: process.env.PECORINO_API_CLIENT_SECRET,
    scopes: [],
    state: ''
});
/**
 * 販売者検索
 */
organizationsRouter.get('/movieTheater', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const organizationService = new ssktsapi.service.Organization({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        if (req.query.format === 'datatable') {
            debug('searching movie theaters...', req.query);
            const movieTheaters = yield organizationService.searchMovieTheaters({});
            debug('movie theaters found.', movieTheaters);
            res.json({
                draw: req.query.draw,
                recordsTotal: movieTheaters.length,
                recordsFiltered: movieTheaters.length,
                data: movieTheaters
            });
        }
        else {
            res.render('organizations/movieTheater/index', {
                searchConditions: req.query
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 販売者追加
 */
organizationsRouter.all('/movieTheater/new', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        let message;
        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        if (req.method === 'POST') {
            try {
                debug('creating...', req.body);
                // COAから劇場情報抽出
                let theaterFromCOA;
                try {
                    theaterFromCOA = yield sskts.COA.services.master.theater({ theaterCode: req.body.branchCode });
                }
                catch (error) {
                    // no op
                }
                let movieTheater = {
                    id: '',
                    typeOf: sskts.factory.organizationType.MovieTheater,
                    identifier: `${sskts.factory.organizationType.MovieTheater}-${req.body.branchCode}`,
                    name: {
                        ja: (theaterFromCOA !== undefined) ? theaterFromCOA.theaterName : req.body.name.ja,
                        en: (theaterFromCOA !== undefined) ? theaterFromCOA.theaterNameEng : req.body.name.en
                    },
                    legalName: {
                        ja: '',
                        en: ''
                    },
                    branchCode: req.body.branchCode,
                    parentOrganization: {
                        name: {
                            ja: '佐々木興業株式会社',
                            en: 'Cinema Sunshine Co., Ltd.'
                        },
                        identifier: sskts.factory.organizationIdentifier.corporation.SasakiKogyo,
                        typeOf: sskts.factory.organizationType.Corporation
                    },
                    location: {
                        typeOf: sskts.factory.placeType.MovieTheater,
                        branchCode: req.body.branchCode,
                        name: {
                            ja: (theaterFromCOA !== undefined) ? theaterFromCOA.theaterName : '',
                            en: (theaterFromCOA !== undefined) ? theaterFromCOA.theaterNameEng : ''
                        }
                    },
                    telephone: (theaterFromCOA !== undefined) ? theaterFromCOA.theaterTelNum : '',
                    url: req.body.url,
                    paymentAccepted: [],
                    gmoInfo: req.body.gmoInfo
                };
                debug('creating movie...');
                const doc = yield organizationRepo.organizationModel.create(movieTheater);
                movieTheater = doc.toObject();
                debug('movie theater created.');
                req.flash('message', '劇場を作成しました。');
                res.redirect(`/organizations/movieTheater/${movieTheater.id}`);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
        res.render('organizations/movieTheater/new', {
            message: message,
            PaymentMethodType: ssktsapi.factory.paymentMethodType
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 販売者編集
 */
organizationsRouter.all('/movieTheater/:id', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        let message;
        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        const doc = yield organizationRepo.organizationModel.findById(req.params.id).exec();
        if (doc === null) {
            throw new sskts.factory.errors.NotFound('Movie theater');
        }
        const movieTheater = doc.toObject();
        if (Array.isArray(movieTheater.paymentAccepted) &&
            movieTheater.paymentAccepted.find((p) => p.paymentMethodType === sskts.factory.paymentMethodType.Account) !== undefined) {
            movieTheater.pecorinoPaymentAccepted = 'on';
        }
        if (req.method === 'POST') {
            try {
                const update = req.body;
                if (!Array.isArray(movieTheater.paymentAccepted)) {
                    movieTheater.paymentAccepted = [];
                }
                update.paymentAccepted = movieTheater.paymentAccepted;
                // ポイント決済を有効にする場合、口座未開設であれば開設する
                if (update.pecorinoPaymentAccepted === 'on') {
                    // tslint:disable-next-line:max-line-length
                    if (movieTheater.paymentAccepted.find((p) => p.paymentMethodType === sskts.factory.paymentMethodType.Account) === undefined) {
                        const account = yield sskts.service.account.open({
                            name: movieTheater.name.ja
                        })({
                            accountNumber: new sskts.repository.AccountNumber(redis_1.default),
                            accountService: new sskts.pecorinoapi.service.Account({
                                endpoint: process.env.PECORINO_API_ENDPOINT,
                                auth: pecorinoAuthClient
                            })
                        });
                        debug('account opened.');
                        update.paymentAccepted.push({
                            paymentMethodType: sskts.factory.paymentMethodType.Account,
                            accountNumber: account.accountNumber
                        });
                    }
                }
                debug('updating movie theater:', update);
                yield organizationRepo.organizationModel.findByIdAndUpdate(movieTheater.id, update).exec();
                debug('movie theater updated.');
                req.flash('message', '更新しました。');
                res.redirect(req.originalUrl);
                return;
            }
            catch (error) {
                message = error.message;
            }
        }
        res.render('organizations/movieTheater/edit', {
            message: message,
            movieTheater: movieTheater,
            PaymentMethodType: ssktsapi.factory.paymentMethodType
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 劇場の注文検索
 */
organizationsRouter.get('/movieTheater/:id/orders', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const orderService = new ssktsapi.service.Order({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        const searchOrdersResult = yield orderService.search({
            limit: req.query.limit,
            page: req.query.page,
            sort: { orderDate: ssktsapi.factory.sortType.Descending },
            orderDateFrom: moment().add(-1, 'months').toDate(),
            orderDateThrough: new Date(),
            seller: {
                typeOf: ssktsapi.factory.organizationType.MovieTheater,
                ids: [req.params.id]
            }
        });
        debug(searchOrdersResult.totalCount, 'orders found.');
        res.json(searchOrdersResult);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = organizationsRouter;
