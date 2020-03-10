import * as Cookie from 'js-cookie';
import * as React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'react-hot-loader/patch';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { IConfig, defaultConfig, login, logout } from '../Login/Login';
import App from '../../containers/App/App';
import { Socket } from '../../socket';
import { IDefaultProps } from '../../types';

export type IHomePageContainerProps = IDefaultProps & {
    config: {
        socket: any;
        user: any;
        token: string;
    }
}

export const HomepageContainer: React.SFC<IHomePageContainerProps> = (props: IHomePageContainerProps) => {
    const config = props.config;
    // console.log('HomepageContainer : ', props);
    return (
        <AppContainer>
            <App routeProps={props.routeProps} type={props.type as string} selectedId={props.selectedId as string} selected={props.page as string} socket={config.socket} token={config.token} user={config.user} />
        </AppContainer>
    )
}
