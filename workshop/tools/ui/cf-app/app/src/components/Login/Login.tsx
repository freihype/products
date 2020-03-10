import * as Axios from 'axios';  // import axios types
import { default as axios } from 'axios';  // import axios public API

import * as Cookie from 'js-cookie';
import * as debug from '../../shared';
import * as Api from '../../api2';
export {
    ensureValidSession,
    defaultConfig,
    ICredentials,
    IConfig,
    IConfigOverrides,
    login,
    logout
};

interface IConfig {
    loginURL: string;
    sessionInfoURL: string;
    sessionCookieName: string;
    defaultUser: string;
    defaultPassword: string;
}

interface IConfigOverrides {
    loginURL?: string;
    sessionInfoURL?: string;
    sessionCookieName?: string;
}

interface ICredentials {
    username: string;
    password: string;
}
/**
 * @TODO: improve, use real json loader
 *
 * @param {IConfigOverrides} [overrides]
 * @returns {IConfig}
 */
const defaultConfig = (overrides?: IConfigOverrides): IConfig => {
    overrides = overrides || {};
    return {
        loginURL: overrides.loginURL || 'http://localhost:3010/api/account/login',
        sessionInfoURL: overrides.sessionInfoURL || 'http://api.miimetiq.local/authn/info',
        sessionCookieName: overrides.sessionCookieName || 'cfSession',
        defaultUser: 'admin@admin.com',
        defaultPassword: '12345678'
    };
};

const logout = (config: IConfig): Promise<void> => {
    return new Promise<void>((resolve) => {
        let token = Cookie.remove(config.sessionCookieName);
        resolve();
    });
};

const login = (config: IConfig): Promise<void> => {
    return new Promise<any>((resolve) => {
        const api = new Api.AccountApi({
            basePath: 'http://localhost:3010'
        });
        api.apiAccountLoginPost(
            {

                    email: 'admin@admin.com',
                    password: '12345678'

            }).then((response) => {
                let token = response.token;
                Cookie.set(config.sessionCookieName, token);
                resolve(response);
                debug.info('login data', response);
            }).catch((e) => {
                console.error(e);
            })
        /*
        axios.post(
            config.loginURL,
            {
                email: config.defaultUser,
                password: config.defaultPassword
            }
        ).then((response: Axios.AxiosResponse) => {
            let token = response.data.token;
            Cookie.set(config.sessionCookieName, token);
            resolve(response.data.user);
            debug.info('login data', response.data);
        }).catch((e) => {
            console.error('error login into ' + config.loginURL, config);
            resolve();
        });
        */

        /*
        LoginPopup.show().then((credentials: ICredentials) => {
            axios.post(
                config.loginURL,
                { 'username': credentials.username, 'password': credentials.password },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ).then((response: Axios.AxiosResponse) => {
                let token = response.data.token;
                Cookie.set(config.sessionCookieName, token);
                resolve();
            }).catch(() => login(config).then(resolve));
        });
        */
    });
};

const ensureValidSession = (config: IConfig): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        /*
        let token = Cookie.get(config.sessionCookieName);
        if (token) {
            isValidSession(config, token)
                .then((sessionIsValid) => {
                    if (sessionIsValid) {
                        resolve();
                    } else {
                        Cookie.remove(config.sessionCookieName);
                        login(config).then(resolve).catch(reject);
                    }
                }).catch(reject);
        } else {
            login(config).then(resolve).catch(reject);
        }
        */
    });
};

/**
 * Do API request, non 200 codes are throwing errors.
 * @param {IConfig} config
 * @param {string} token
 * @returns {HTTPPromise}
 */
const isValidSession = (config: IConfig, token: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        axios.head(config.sessionInfoURL, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Access-Token': token
            }
        }).then(() => {
            resolve(true);
        }).catch((error: Axios.AxiosError) => {
            if (error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    resolve(false);
                    return;
                }
            }
            reject(error);
        });
    });
};
