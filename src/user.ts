import * as createDebug from 'debug';
import * as jwt from 'jsonwebtoken';

import * as chevreapi from './chevreapi';
import * as cinerinoapi from './cinerinoapi';

const debug = createDebug('cinerino-console:user');

/**
 * ユーザー設定インターフェース
 */
export interface IConfigurations {
    host: string;
    session: Express.Session;
}
export interface IProfile {
    sub: string;
    iss: string;
    'cognito:username': string;
    given_name: string;
    phone_number: string;
    family_name: string;
    email: string;
}
/**
 * リクエストユーザー
 */
export default class User {
    public host: string;
    public session: Express.Session;
    public state: string;
    public authClient: cinerinoapi.auth.OAuth2;
    public chevreAuthClient: chevreapi.auth.OAuth2;
    public profile: IProfile;

    constructor(configurations: IConfigurations) {
        this.host = configurations.host;
        this.session = configurations.session;

        this.authClient = new cinerinoapi.auth.OAuth2({
            domain: <string>process.env.API_AUTHORIZE_SERVER_DOMAIN,
            clientId: <string>process.env.API_CLIENT_ID,
            clientSecret: <string>process.env.API_CLIENT_SECRET,
            redirectUri: `https://${configurations.host}/signIn`,
            logoutUri: `https://${configurations.host}/logout`
        });
        this.chevreAuthClient = new chevreapi.auth.OAuth2({
            domain: <string>process.env.API_AUTHORIZE_SERVER_DOMAIN,
            clientId: <string>process.env.API_CLIENT_ID,
            clientSecret: <string>process.env.API_CLIENT_SECRET,
            redirectUri: `https://${configurations.host}/signIn`,
            logoutUri: `https://${configurations.host}/logout`
        });
        this.authClient.setCredentials({ refresh_token: this.getRefreshToken() });
        this.chevreAuthClient.setCredentials({ refresh_token: this.getRefreshToken() });
    }

    public generateAuthUrl() {
        return this.authClient.generateAuthUrl({
            scopes: [],
            state: this.state,
            codeVerifier: <string>process.env.API_CODE_VERIFIER
        });
    }

    public generateLogoutUrl() {
        return this.authClient.generateLogoutUrl();
    }

    public getRefreshToken(): string | undefined {
        return this.session.refreshToken;
    }

    public isAuthenticated(): boolean {
        return typeof this.getRefreshToken() === 'string';
    }

    public async signIn(code: string) {
        // 認証情報を取得できればログイン成功
        const credentials = await this.authClient.getToken(code, <string>process.env.API_CODE_VERIFIER);
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
    }

    public logout() {
        delete this.session.refreshToken;
    }

    public async retrieveProfile() {
        await this.authClient.refreshAccessToken();
        this.profile = <IProfile>jwt.decode((<any>this.authClient.credentials).id_token);

        return this;
    }
}
