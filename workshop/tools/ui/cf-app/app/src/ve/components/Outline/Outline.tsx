/*
quite, country-side, love animals, practical / pragmatic,
culture/ team builder, conflict resolution,
i respect individuals / preserve creativity over 'scalable teams'
countryside / organic

volunteer projects: metal/plastic-recycling

passionate about software/hardware since 1985
- games/vr and ar
- authoring software
- web - enterprise / dojo
- mobile app - studios
- generice web-ui builder with foucs on automation,

jest/intern

questions :
- developer or engeneer : design/docs/specifications
- which part of the product in BCN
- how long contract ...
*/

import * as React from 'react';
import { RESOURCE_VARIABLES } from '../../../config';
import { IContentHandler } from '../../../types';
import { EditorContext } from '../../EditorContext';
import { HTMLFile } from '../html/HTMLFile';
import { Metadata } from '../metadata';
import './index.scss';

export class Outline extends React.Component<any, any> implements IContentHandler {
    _context: EditorContext;

    public open(what: any) {
        return new Promise((resolve, reject) => {

        });
    };
    public updateNavigation() {
        const app = this.props.handler;
        const navi = app.navigation;
        console.log('did mount visual editor', navi);
        navi.setState({
            sources: [
                () => <div key='palette-key'>
                    <hr />

                </div>
            ]
        })
    }

    render() {
        return <div className='VisualEditor'>

        </div>
    }

    _connectCallback(failureInfo) {
        try {
            if (failureInfo instanceof Error) {
                throw failureInfo;
            }
            const context = this._context;
            let popup;
            try {
                context.activate2();
            } catch (e) {
                console.error('crash in context activation! : ' + e, e.stack);
            }
            const _doc = context.getDocument();

        } catch (e) {
            failureInfo = e;
        } finally {

        }
    }
    componentWillUnmount() {
        this._context.destroy();
    }
}
