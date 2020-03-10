import { Layout } from 'antd';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { IGroup } from 'office-ui-fabric-react/lib/components/GroupedList/index';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { DEVICE_STATE } from '../../shared';
import { IDevice } from '../../types';

const { Header, Footer, Sider, Content } = Layout;

const groupCount = 1;
const groupDepth = 0;

let _groups: IGroup[];

export interface IItemHandler {
    itemClick: (item: any) => void;
}
export interface IDeviceTreeItemProps {
    model: IDevice
    handler: IItemHandler;
}

export class DeviceListItemComponent extends React.Component<IDeviceTreeItemProps> implements IItemHandler {
    public state: any = {
        model: {

        },
        handler: {
            itemClick: (item) => { }
        }
    }
    public constructor(props) {
        super(props);
        this.state.model = props.model;
    }
    @autobind
    public itemClick(item: any): void {
        this.props.handler.itemClick(this);
    }
    @autobind
    private _onClick(): void {
        this.props.handler.itemClick(this);
    }
    public render() {
        const connected = this.state.model.state === DEVICE_STATE.CONNECTED;
        return <div>
            <Link to={'/Devices/' + this.props.model.id}>
                <ActionButton
                    style={{ color: connected ? 'green' : 'red' }}
                    iconProps={{ iconName: connected ? 'PlugConnected' : 'PlugDisconnected' }}
                    title={this.props.model.name}
                    text={this.props.model.name}
                    onClick={this.itemClick}
                />
            </Link>
        </div>
    }
}
