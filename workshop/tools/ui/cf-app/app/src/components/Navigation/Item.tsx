import * as React from 'react';
import {
    GroupedList,
    IGroup
} from 'office-ui-fabric-react/lib/components/GroupedList/index';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { DetailsRow } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsRow';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import {
    FocusZone
} from 'office-ui-fabric-react/lib/FocusZone';
import {
    Selection,
    SelectionMode,
    SelectionZone
} from 'office-ui-fabric-react/lib/utilities/selection/index';
import { IconButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
/*import { Devices } from './data';*/
import { Device, DEVICE_STATE, debug } from '../../shared';
import { IContentHandler, IDevice } from '../../types';
/*import { items as _items, _items2, createGroups } from './utils';*/
import { DeviceDto } from '../../containers/App/Data';

import * as api2 from '../../api2';
import { Configuration, DevicesApi, OutDevicesDto } from '../../api2';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';

export interface IItemHandler {
    itemClick: (item: any) => void;
}
export interface IDeviceTreeItemProps {
    model: Device
    handler: IItemHandler;
}

export class DeviceTreeItem extends React.Component<IDeviceTreeItemProps> implements IItemHandler {
    public state: IDeviceTreeItemProps = {
        model: new Device(), handler: {
            itemClick: (item) => { }
        }
    }
    public constructor(props) {
        super(props);
        this.state.model = props.model;
        setInterval(() => {
            if (!this.state.model.state) {
                this.state.model.state = DEVICE_STATE.DISCONNECTED;
            }
            let newState;
            switch (this.state.model.state) {
                case DEVICE_STATE.DISCONNECTED: {
                    newState = DEVICE_STATE.CONNECTED;
                    break;
                };
                case DEVICE_STATE.CONNECTED: {
                    newState = DEVICE_STATE.DISCONNECTED;
                    break;
                }
            }
            this.state.model.state = newState;
            this.setState({
                model: this.state.model
            })
        }, 1000);
    }
    @autobind
    public itemClick(item: any): void {
        this.props.handler.itemClick(this);
    }
    @autobind
    private _onClick(): void {
        // change the button type on click
        this.props.handler.itemClick(this);
    }
    public render() {
        const connected = this.state.model.state === DEVICE_STATE.CONNECTED;
        return <div>
            <div style={{ float: 'left' }}>
                <Toggle
                    defaultChecked={true}
                    title={this.props.model.name}
                    onAriaLabel={this.props.model.name}
                    offAriaLabel={'This toggle is unchecked. Press to check.'}
                    onText=''
                    offText=''
                    onFocus={() => console.log('onFocus called')}
                    // tslint:disable-next-line:jsx-no-lambda
                    onBlur={() => console.log('onBlur called')}
                />
            </div>
            <ActionButton
                style={{ color: connected ? 'green' : 'red' }}
                iconProps={{ iconName: connected ? 'PlugConnected' : 'PlugDisconnected' }}
                title={this.props.model.name}
                text={this.props.model.name}
                onClick={this.itemClick}
            />

        </div>
    }
    public componentDidMount() {
        // We update the state in our subscribe callback from the counter stream
        /*
        rs.subscribe((val) => {
            console.log('df', val);
        });*/
        // this.counter.next({ state: DEVICE_STATE.CONNECTED });
    }
}
