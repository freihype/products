import * as React from 'react';
import * as lodash from 'lodash';

import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Steps, Icon } from 'antd';
import { ResponsiveMode } from 'office-ui-fabric-react/lib/utilities/decorators/withResponsiveMode';
import { DeleteDeviceomponent } from '../DeviceList/Delete';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';

const Step = Steps.Step;

import './index.scss'
export interface IDeleteContentProps {
    selectedId?: string;
    type?: string;
}
const COMPONENTS = {
    Device: DeleteDeviceomponent
}

export class DeleteContentComponent extends React.Component<IDeleteContentProps, {
    hideDialog: boolean;
}> {
    public view: any;
    constructor(props: {}) {
        super(props);
        this.state = {
            hideDialog: false
        };
    }
    public renderView(name: string) {
        if (COMPONENTS[name]) {
            return React.createElement(COMPONENTS[name], {
                ...{ ...this.props },
                onSave: (data) => {
                    console.log('on save', data);
                },
                key: 'view-',
                ref: (ref) => {
                    this.view = ref;
                }
            });
        } else {
            console.error('no such component', name, this);
            return <div key={'404'}> no such component {name}</div>
        }
    }

    @autobind
    private onOk() {
        this.setState({ hideDialog: true });
        // console.log('on ok', this.view.data.getValue());
        this.view.onOk();
    }
    @autobind
    private onCancle() {
        this.setState({ hideDialog: true });
    }
    render() {
        console.log('delete', this);
        return (
            <div >
                {
                    <Dialog
                        hidden={this.state.hideDialog}
                        dialogContentProps={{
                            responsiveMode: ResponsiveMode.xLarge,
                            type: DialogType.normal,
                            title: 'Delete ' + this.props.type + '?',
                            subText: ''
                        }}
                        onDismiss={this.onOk}
                        modalProps={{
                            isBlocking: false,
                            containerClassName: 'ms-dialogMainOverride'
                        }}
                    >
                        {
                            this.renderView(this.props.type)
                        }
                        <DialogFooter>
                            <PrimaryButton onClick={this.onOk} text='Delete' />
                            <DefaultButton onClick={this.onOk} text='Cancel' />
                        </DialogFooter>
                    </Dialog>
                }
            </div>
        )
    }
}
