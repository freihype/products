import { Icon, Layout, Menu } from 'antd';
import Sider from 'antd/lib/layout/Sider';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { FocusZone } from 'office-ui-fabric-react/lib/FocusZone';
import { List } from 'office-ui-fabric-react/lib/List';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { Selection, SelectionMode, SelectionZone } from 'office-ui-fabric-react/lib/utilities/selection/index';
import * as React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { DevicesApi } from '../../api2';
import { Device } from '../../shared';
import { IContentHandler } from '../../types';

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
    handler: IContentHandler
    collapsed?: boolean
}

/////////////////////////////////////////////////

export interface IItemHandler {
    itemClick: (item: any) => void;
}
export interface IDeviceTreeItemProps {
    model: Device
    handler: IItemHandler;
}

const items = [{
    name: 'Devices',
    key: 1
}]

// list component :
export class MainNavigation extends React.Component<IListProps> {
    private _selection: Selection;
    public api: DevicesApi;
    public list: List;
    public sider: any;
    public state = {
        collapsed: false
    };

    @autobind
    public itemClick(item: any) {
        this.props.handler.open({
            name: item.key
        });
    }
    @autobind
    onCollapse(collapsed) {
        console.log('collapsed', this.state);
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
    public render() {
        return (
            <StyledSider ref={(ref) => this.sider = ref} collapsible={true} collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
                <Menu theme='light' defaultSelectedKeys={['Projects']} mode='inline' onClick={this.itemClick}>
                    <Menu.Item key='Projects'>
                        <Link to={'/Home/Projects'}>
                            <Icon type='link' />
                            <span>Projects</span>
                        </Link>
                    </Menu.Item>

                    <Menu.Item key='9'>
                        <Icon type='database' />
                        <span>Logs</span>
                    </Menu.Item>

                    <Menu.Item key='19'>
                        <Icon type='tool' />
                        <span>Console</span>
                    </Menu.Item>

                </Menu>
            </StyledSider>
        );
    }

    public render2() {
        return (
            <FocusZone>
                <SelectionZone
                    selection={this._selection}
                    selectionMode={SelectionMode.single}
                >
                    <List
                        ref={(ref: List) => this.list = ref}
                        items={items}
                        onRenderCell={this._onRenderCell}
                    />
                </SelectionZone>
            </FocusZone>
        );
    }
    private _onRenderCell(item: any, index: number | undefined): React.ReactNode {
        return (
            <Link to={item.name}>
                <ActionButton
                    iconProps={{ iconName: 'PlugConnected' }}
                    title={item.name}
                    text={item.name}
                    onClick={() => {
                        this.itemClick(item)
                    }}
                />
            </Link>
        );
    }
}
