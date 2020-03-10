import * as React from 'react';
import * as lodash from 'lodash';

import { IconButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { IServerMessageProps, ServerMessagesComponent } from '../ServerMessages';
import { DeviceTreeView } from '../../components/DeviceList/Devices';
import { DeviceInstance } from '../../components/DeviceList/DeviceInstance';
import { NewContentComponent } from '../../components/NewContent/NewContent';
import { DeleteContentComponent } from '../../components/DeleteContent/DeleteContent';
import { ProjectList } from '../../components/Projects/List';
import { VisualEditor } from '../../ve';
import { Layout } from 'antd';
import './index.scss';

const { Header, Footer, Sider, Content } = Layout;

const COMPONENTS = {
    Devices: DeviceTreeView,
    Log: ServerMessagesComponent,
    Instance: DeviceInstance,
    New: NewContentComponent,
    Delete: DeleteContentComponent,
    Projects: ProjectList,
    Scenes: VisualEditor
}

export interface IDetailProps {
    serverMessages: IServerMessageProps[],
    views: string[],
    defaultProps: IDefaultProps;
    selected?: string;
    selectedId?: string;
}

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
} from 'react-reflex';

import { IDefaultProps } from '../../types';

export class DetailComponent extends React.Component<IDetailProps, IDetailProps> {
    state: IDetailProps = { serverMessages: [], views: [], defaultProps: {}, selectedId: '' }

    public open(name: string) {
        /*
        console.log('detail : open ' + name);
        if (this.state.views.indexOf(name) >= 0) {
            return false;
        }
        const views = this.state.views = [];
        views.push(name);
        this.setState({
            views: views
        })*/
    }
    /*
    public componentWillUpdate() {
        if (this.props.selected) {
            this.open(this.props.selected);
        }
    }*/
    public view: any;
    public renderView(name: string) {
        if (COMPONENTS[name]) {
            const view = React.createElement(COMPONENTS[name], {
                ...this.props.defaultProps,
                ...{ style: { overflow: 'hidden' } },
                key: 'view-' + this.state.views.length,
                ref: (ref) => { this.view = ref }
            });
            return view;
        } else {
            console.error('no such component', name, this);
            return <div key={'404'}> no such component {name}</div>
        }
    }

    public render() {
        const views = this.props.views;
        return <ReflexContainer orientation='horizontal' style={{ height: '900px' }}>
            <ReflexElement
                className='upper-pane'
                minSize='600'>
                <div className='App-content2'>
                    {
                        views.map((name) => this.renderView(name))
                    }
                </div>
            </ReflexElement>

            {/*
                <ReflexSplitter />

            <ReflexElement className=''
                minSize='30'
                maxSize='20'>

            </ReflexElement>
            */}

        </ReflexContainer >;
    }
}
