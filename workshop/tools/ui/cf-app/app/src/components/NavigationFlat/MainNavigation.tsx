import { Icon, Layout, Menu } from 'antd';
import Sider from 'antd/lib/layout/Sider';
import { List } from 'office-ui-fabric-react/lib/List';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { Selection } from 'office-ui-fabric-react/lib/utilities/selection/index';
import * as React from 'react';
import { DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { IContentHandler, NavigationCallback } from '../../types';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
const { Header, Content, Footer } = Layout;
const SubMenu = Menu.SubMenu;

// tslint:disable-next-line:no-var-requires

const StyledSider = styled(Sider) `
  background-color: white;
  border-right: 1px solid #ccc;
  height:800px
`;

export interface IItemHandler {
    itemClick: (item: any) => void;
}

// tslint:disable-next-line:no-empty-interface
export interface IListProps {
    handler: IContentHandler;
    showFilter?: boolean;
}
export interface INavigationState {
    collapsed?: boolean;
    sources?: NavigationCallback[];
    filter?: string;
}
/////////////////////////////////////////////////

export interface IItemHandler {
    itemClick: (item: any) => void;
}
const items = [{
    name: 'Devices',
    key: 1
}]

// list component :
export class MainNavigation extends React.Component<IListProps, INavigationState> {
    private _selection: Selection;
    public list: List;
    public sider: any;
    public views: any[] = [];
    public state = {
        collapsed: false,
        sources: []
    };

    public addView(v) {
        if (this.views.indexOf(v) === -1) {
            this.views.push(v);
        }
    }

    @autobind
    public itemClick(item: any) {
        this.props.handler.open({
            name: item.key
        });
    }
    @autobind
    onCollapse(collapsed) {
        this.setState({
            collapsed: !this.state.collapsed
        })
        // Cookies.set('SideBarOpen', this.state.collapsed);
        /*
        if (this.sider) {
            this.sider.setState({ collapsed: this.state.collapsed });
            this.sider.forceUpdate();
        }*/
    }
    @autobind
    private _onChanged(text: any): void {
        this.views.forEach((s) => {
            s.setState({
                filter: text
            })
        })
    }
    public render() {
        const sources = this.state.sources || [];
        return (
            <DragDropContextProvider backend={HTML5Backend}>
                <StyledSider ref={(ref) => this.sider = ref} collapsible={true} collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
                    <Menu theme='light' defaultSelectedKeys={['2']} mode='inline' onClick={this.itemClick}>
                        <Menu.Item key='Devices'>
                            <Link to={'/Devices'} replace={true} >
                                <Icon type='link' />
                                <span>Devices</span>
                            </Link>
                        </Menu.Item>

                        <Menu.Item key='2'>
                            <Link to={'/Scenes?project=1'} replace={true} >
                                <Icon type='desktop' />
                                <span>Scenes</span>
                            </Link>
                        </Menu.Item>

                        <Menu.Item key='19'>
                            <Icon type='tool' />
                            <span>Console</span>
                        </Menu.Item>
                    </Menu>

                    {this.props.showFilter !== false ? <SearchBox
                        placeholder={'Search'}
                        onChanged={this._onChanged}
                    /> : ''
                    }
                    {sources.map((cb) => {
                        const what = cb(this);
                        console.log('did', what);
                        return what;
                    })}
                </StyledSider>
            </DragDropContextProvider>
        );
    }
}
