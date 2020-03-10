import * as React from 'react';
import { BehaviorSubject } from 'rxjs';
import { DeviceDto } from '../../api2';
import { IDefaultProps } from '../../types';
import { PropertiesComponent } from '../Properties';
import { DeviceToProperties, createHandler } from './DeviceProperties';
import { mixin } from '../../shared/lib/objects';

// const Step = Steps.Step;

export type INewContentProps = IDefaultProps & {
    selectedId?: string;
    onSave: () => void
}

export class NewDeviceomponent extends React.Component<INewContentProps, {}> {

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
        console.log('on ok', this);
        const out = this.data.getValue();
        delete out['subject'];
        this.props.rest.devices.apiDevicesPost(out).then((d) => {
            this.props.route().context.router.history.goBack();
        });
    }

    componentDidMount() {
        const model = this.model();
        const item = new BehaviorSubject<any>(model);
        item.next(model);
        model['subject'] = item;
        this.properties.setState({
            model: model,
            handler: createHandler(this, model, this.properties, this.props.onSave),
            toProperties: DeviceToProperties
        });
        this.properties.forceUpdate();
        this.data = item;
    }

    render() {
        console.log('render new device', this);

        return (
            <div>
                <PropertiesComponent showSave={false} showFilter={false} handler={null} toProperties={DeviceToProperties} model={null} ref={(ref) => this.properties = ref} />
                {/*

                    <Steps>
                        <Step status='finish' title='Login' icon={<Icon type='user' />} />
                        <Step status='finish' title='Verification' icon={<Icon type='solution' />} />
                        <Step status='process' title='Pay' icon={<Icon type='loading' />} />
                        <Step status='wait' title='Done' icon={<Icon type='smile-o' />} />
                    </Steps>
                */}
            </div>

        )
    }
}
