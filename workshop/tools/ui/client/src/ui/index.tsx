import * as React from "react";
import { render } from "react-dom";
import { BrowserRouter } from 'react-router-dom';
import { IEvented } from "./components";
import { DefaultRoutes } from './routes';
import { SessionAPI } from "./components/Player/SessionAPI";

const rootContainer = document.getElementById("root");
// required for hotmodule reload
declare let module: { hot: any };

// simple iframe messenger library
const Postmate = require('postmate').default;

// returns in any case a valid iframe messenger
async function getParent(): Promise<IEvented> {
    return new Promise<IEvented>((resolve) => {

        const fallback = () => resolve({
            on: (...args) => { },
            emit: (...args) => { }
        } as IEvented);

        new Postmate.Model({}).then((frame: any) => {
            frame.emit('ready');
            resolve(frame);
        }).catch(fallback);

        setTimeout(fallback, 1000);
    });
}

window.onload = () => {
    SessionAPI.configGet().then((srConfig) => {
        const ApplicationRoutes = () =>
            <BrowserRouter>
                {DefaultRoutes(srConfig)}
            </BrowserRouter>;

        getParent().then(() => {
            const renderApp = () => {
                render(
                    ApplicationRoutes(), rootContainer
                );
            };
            // non HMR render
            renderApp();

            // HMR render
            if (module.hot) {
                module.hot.accept("./components/App", () => {
                    renderApp();
                });
            }
        });
    });
};


