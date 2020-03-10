import * as Cookie from 'js-cookie';
import * as React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'react-hot-loader/patch';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { IConfig, defaultConfig, login, logout } from '../Login/Login';
import { View } from './View';
import { Socket } from '../../socket';
import { IDefaultProps } from '../../types';
export type IHomePageProps = IDefaultProps & {
    config: {
        socket: any;
        user: any;
        token: string;
    }
}

export class Homepage extends React.Component<IHomePageProps, any> {
    public render() {
        const config = this.props.config;
        console.log('render home page ', this);
        const props = this.props;
        return (
            <AppContainer>
                <View project={props.project} routeProps={props.routeProps} type={props.type as string} selectedId={props.selectedId as string} selected={props.page as string} socket={config.socket} token={config.token} user={config.user} />
            </AppContainer>
        )
    }
}
