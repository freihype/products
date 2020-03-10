import * as React from 'react';
import { SessionReplay } from './SessionReplay';

const COMPONENTS: any = {
    player: SessionReplay

};

type ViewContainerProps = {
    view: string;
    selected: string;
    owner: any;
    visitor: string;
};

export class ViewContainer extends React.Component<ViewContainerProps,
    {
        views: any
    }> {
    state: any = {
        views: []
    };
    public view: any;
    public renderView(name: string) {
        if (COMPONENTS[name]) {
            const view = React.createElement(COMPONENTS[name], {
                ...this.props,
                ...{ style: { overflow: 'hidden' } },
                key: 'view-' + this.state.views.length
            });
            return view;
        } else {
            console.error('no such view', name, this);
            return <div key={'404'}> no such view `{name}`</div>;
        }
    }

    public render() {
        const views = this.props.view.split('|');
        return <div className='App-content2'>
            {
                views.map((name) => this.renderView(name))
            }
        </div>;
    }
}
