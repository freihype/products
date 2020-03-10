import * as React from 'react';
import 'react-hot-loader/patch';
import { Redirect, Route, Switch } from 'react-router-dom';
import { HomepageContainer } from './components/Home/Container';
import { Homepage } from './components/Home/HomePage';
import * as qs from 'query-string';
export const Routes = (config: any) => (
    <Switch>
        <Route path='/Instance/:selectedId' render={(props) => (
            <HomepageContainer routeProps={props} config={config} page={'Instance'} selectedId={props.match.params.selectedId} />
        )} />

        <Route path='/Devices/:selectedId' render={(props) => (
            <HomepageContainer routeProps={props} config={config} page={'Devices'} selectedId={props.match.params.selectedId} />
        )} />

        <Route path='/New/:selectedId' render={(props) => (
            <HomepageContainer routeProps={props} config={config} page={'New'} selectedId={props.match.params.selectedId} />
        )} />

        <Route path='/Delete/:type/:selectedId' render={(props) => (
            <HomepageContainer routeProps={props} config={config} page={'Delete'} type={props.match.params.type} selectedId={props.match.params.selectedId} />
        )} />

        <Route path='/Home/:type' render={(props) => (
            <Homepage project={() => 0} routeProps={props} config={config} page={'Home'} type={props.match.params.type} selectedId={''} />
        )} />

        <Route path='/Home/:type/:selectedId' render={(props) => (
            <Homepage  routeProps={props} config={config} page={'Home'} type={props.match.params.type} selectedId={props.match.params.selectedId} />
        )} />

        <Route path='/:selectedModule' render={(props) => (<HomepageContainer routeProps={props} config={config} page={props.match.params.selectedModule} />)} >
            <Route path='/Instance/:selectedId' render={(props2) => (<HomepageContainer routeProps={props2} config={config} page={'Instance'} selectedId={props2.match.params.selectedId} />)} />
        </Route>

        {/*<Route path='/' render={(props) => (<HomepageContainer routeProps={props} config={config} />)} >
        </Route>*/}

        <Redirect to='/Home' />
    </Switch>
);
