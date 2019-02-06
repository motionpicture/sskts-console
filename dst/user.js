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
const createDebug = require("debug");
const jwt = require("jsonwebtoken");
const chevreapi = require("./chevreapi");
const cinerinoapi = require("./cinerinoapi");
const debug = createDebug('cinerino-console:user');
/**
 * リクエストユーザー
 */
class User {
    constructor(configurations) {
        this.host = configurations.host;
        this.session = configurations.session;
        this.authClient = new cinerinoapi.auth.OAuth2({
            domain: process.env.API_AUTHORIZE_SERVER_DOMAIN,
            clientId: process.env.API_CLIENT_ID,
            clientSecret: process.env.API_CLIENT_SECRET,
            redirectUri: `https://${configurations.host}/signIn`,
            logoutUri: `https://${configurations.host}/logout`
        });
        this.chevreAuthClient = new chevreapi.auth.OAuth2({
            domain: process.env.API_AUTHORIZE_SERVER_DOMAIN,
            clientId: process.env.API_CLIENT_ID,
            clientSecret: process.env.API_CLIENT_SECRET,
            redirectUri: `https://${configurations.host}/signIn`,
            logoutUri: `https://${configurations.host}/logout`
        });
        this.authClient.setCredentials({ refresh_token: this.getRefreshToken() });
        this.chevreAuthClient.setCredentials({ refresh_token: this.getRefreshToken() });
    }
    generateAuthUrl() {
        return this.authClient.generateAuthUrl({
            scopes: [],
            state: this.state,
            codeVerifier: process.env.API_CODE_VERIFIER
        });
    }
    generateLogoutUrl() {
        return this.authClient.generateLogoutUrl();
    }
    getRefreshToken() {
        return this.session.refreshToken;
    }
    isAuthenticated() {
        return typeof this.getRefreshToken() === 'string';
    }
    signIn(code) {
        return __awaiter(this, void 0, void 0, function* () {
            // 認証情報を取得できればログイン成功
            const credentials = yield this.authClient.getToken(code, process.env.API_CODE_VERIFIER);
            debug('credentials published');
            if (credentials.access_token === undefined) {
                throw new Error('Access token is required for credentials.');
            }
            if (credentials.refresh_token === undefined) {
                throw new Error('Refresh token is required for credentials.');
            }
            // リフレッシュトークンを保管
            this.session.refreshToken = credentials.refresh_token;
            return this;
        });
    }
    logout() {
        delete this.session.refreshToken;
    }
    retrieveProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.authClient.refreshAccessToken();
            this.profile = jwt.decode(this.authClient.credentials.id_token);
            return this;
        });
    }
}
exports.default = User;
