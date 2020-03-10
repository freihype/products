import * as Cookie from 'js-cookie';
import * as React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'react-hot-loader/patch';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { IConfig, defaultConfig, login, logout } from './components/Login/Login';
import App from './containers/App/App';
import { Socket } from './socket';

const reactContainer = document.getElementById('reactContainer')
const debugLogin = false;
import { HomepageContainer, IHomePageContainerProps } from './components/Home/Container';
import { IHomePageProps, Homepage } from './components/Home/HomePage';
import { Routes } from './routes';

const config = defaultConfig();

const checkLogin = (config: IConfig = defaultConfig()): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
        logout(config).then(() => {
            let token = Cookie.get(config.sessionCookieName);
            if (!token) {
                login(config).then((user) => {
                    debugLogin && console.log('user : ', user);
                    resolve(user);
                })
            } else {
                debugLogin && console.log('token ' + token);
                resolve(token);
            }
        }).catch((e) => {
            console.error('e', e)
        });
    });
}

const ApplicationRoutes = (config: any) => (
    <BrowserRouter>
        {Routes(config)}
    </BrowserRouter>
);

checkLogin().then((data: any) => {
    const socket = new Socket();
    render(
        ApplicationRoutes({
            socket: socket,
            token: data.token,
            user: data.user
        }),
        reactContainer
    )
})

// Hot Module Replacement API
if (module.hot) {
    module.hot.accept(() => {
        const socket = new Socket();
        const NextApp = require<{ default: typeof App }>('./containers/App/App').default
        checkLogin().then((data: any) => {
            render(
                ApplicationRoutes({
                    socket: socket,
                    token: data.token,
                    user: data.user
                }),
                reactContainer
            )
        });

    })
}
