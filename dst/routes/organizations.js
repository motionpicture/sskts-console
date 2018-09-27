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
const ssktsapi = require("@motionpicture/sskts-api-nodejs-client");
const sskts = require("@motionpicture/sskts-domain");
const createDebug = require("debug");
const express = require("express");
const redis_1 = require("../redis");
const debug = createDebug('sskts-console:routes:organizations');
const organizationsRouter = express.Router();
const pecorinoAuthClient = new sskts.pecorinoapi.auth.ClientCredentials({
    domain: process.env.PECORINO_AUTHORIZE_SERVER_DOMAIN,
    clientId: process.env.PECORINO_API_CLIENT_ID,
    clientSecret: process.env.PECORINO_API_CLIENT_SECRET,
    scopes: [],
    state: ''
});
/**
 * 劇場検索
 */
organizationsRouter.get('/movieTheater', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const organizationService = new ssktsapi.service.Organization({
            endpoint: process.env.API_ENDPOINT,
            auth: req.user.authClient
        });
        debug('searching movie theaters...', req.query);
        const movieTheaters = yield organizationService.searchMovieTheaters({});
        debug('movie theaters found.', movieTheaters);
        res.render('organizations/movieTheater/index', {
            query: req.query,
            movieTheaters: movieTheaters
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 劇場追加
 */
organizationsRouter.all('/movieTheater/new', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        let message;
        const organizationRepo = new sskts.repository.Organization(sskts.mongoose.connection);
        if (req.method === 'POST') {
            try {
                debug('creating...', req.body);
                // COAから劇場情報抽出
                const theaterFromCOA = yield sskts.COA.services.master.theater({ theaterCode: req.body.branchCode });
                let movieTheater = {
                    id: '',
                    typeOf: sskts.factory.organizationType.MovieTheater,
                    identifier: `${sskts.factory.organizationType.MovieTheater}-${req.body.branchCode}`,
                    name: {
                        ja: theaterFromCOA.theaterName,
                        en: theaterFromCOA.theaterNameEng
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
                            ja: theaterFromCOA.theaterName,
                            en: theaterFromCOA.theaterNameEng
                        }
                    },
                    telephone: theaterFromCOA.theaterTelNum,
                    url: req.body.url,
                    paymentAccepted: [],
                    gmoInfo: {
                        siteId: process.env.GMO_SITE_ID,
                        shopId: req.body['gmoInfo.shopId'],
                        shopPass: req.body['gmoInfo.shopPass']
                    }
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
            message: message
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 劇場編集
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
            movieTheater.paymentAccepted.find((p) => p.paymentMethodType === sskts.factory.paymentMethodType.Pecorino) !== undefined) {
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
                    if (movieTheater.paymentAccepted.find((p) => p.paymentMethodType === sskts.factory.paymentMethodType.Pecorino) === undefined) {
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
                            paymentMethodType: sskts.factory.paymentMethodType.Pecorino,
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
            movieTheater: movieTheater
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = organizationsRouter;
