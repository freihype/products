import { Steps } from 'antd';
import * as React from 'react';
import * as lodash from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { DeviceDto } from '../../api2';
import { IDefaultProps } from '../../types';
import { PropertiesComponent } from '../Properties';
import { DeviceToProperties, createHandler } from './DeviceProperties';
import { withRouter } from 'react-router-dom';
import { Route } from 'react-router-dom';
import { mixin } from '../../shared/lib/objects';
export type IDeleteDeviceProps = IDefaultProps & {
    selectedId?: string;
    onSave: () => void
}

export class DeleteDeviceomponent extends React.Component<IDeleteDeviceProps, {
    name: string
}> {

    public properties: any;
    public data: any;
    model(): DeviceDto {
        const ret = new DeviceDto();
        mixin(ret,
        {
            name: 'Device name...',
            isActive: true,
            host: 'localhost',
            port: '22',
            protocol: 'Tcp'
        });
        return ret;
    }
    private onOk() {
        // this.setState({ hideDialog: true });
        // console.log('on ok', this.data.getValue());
        this.props.rest.devices.apiDevicesIdDelete(parseInt(this.props.selectedId, 10)).then((d) => {
            this.route.context.router.history.goBack();
        });

    }

    componentDidMount() {
        console.log('d', this);
    }

    componentWillMount() {
        return this.props.rest.getDevices().then((devices: any[]) => {
            devices = devices.map((d) => d.getValue());
            const dev = lodash.find(devices, { id: parseInt(this.props.selectedId, 10) });
            //console.log('dev', dev);
            this.setState({
                name: dev ? dev.name : ''
            })
        });
    }
    public route: Route;
    public history: any;
    render() {
        return (
            <Route ref={(ref) => { this.route = ref; }} render={({ history }) => (
                <div> </div>
            )}>
            </Route>

        )
    }
}
