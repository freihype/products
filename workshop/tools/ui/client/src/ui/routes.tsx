import { parse } from 'query-string';
import * as React from "react";
import { Redirect, Route, Switch } from 'react-router-dom';
import { App } from './components/SRAppEmbedded';
import { ListApp } from './components/SRList';
import { ManagerApp } from './components/SRManager';
import { HashRouter, BrowserRouter } from 'react-router-dom'
export const DefaultRoutes = (config: any) => (
    <HashRouter hashType='noslash'>
        <Switch>
            <Route path='/' render={(props) => {
                let {
                    view,
                    selected,
                    app,
                    visitor
                } = parse(location.hash);
                const defaultApp = 'list';
                if (!app) {
                    app = defaultApp;
                }
                if (app === 'list') {
                    return <ListApp
                        view={view as string}
                        selected={selected as string}
                        hash={parse(location.hash)}
                    />
                }

                if (app === 'manager') {
                    return <ManagerApp
                        view={view as string}
                        selected={selected as string}
                        hash={parse(location.hash)}
                        config={config}
                    />
                }


                if (!selected) {
                    selected = 'last'
                }

                if (!view) {
                    view = 'player'
                }
                if (!selected) {
                    selected = 'last'
                }
                return view && selected ? <App
                    view={view as string}
                    selected={selected as string}
                    visitor={visitor as string}
                    hash={parse(location.hash)}
                /> : <div>Invalid url parameters ! Missing view parameter</div>;
            }} />

            <Route path='/404' render={() => <div> No Such Page </div>} />
            <Redirect to='/404' />

        </Switch>
    </HashRouter>
);