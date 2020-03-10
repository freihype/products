import * as React from 'react';
import * as lodash from 'lodash';

import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Steps, Icon } from 'antd';
import { ResponsiveMode } from 'office-ui-fabric-react/lib/utilities/decorators/withResponsiveMode';
import { NewDeviceomponent } from '../DeviceList/New';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';

const Step = Steps.Step;

import './index.scss'

export interface INewContentProps {
    selectedId?: string;
}
const COMPONENTS = {
    Device: NewDeviceomponent
}

export class NewContentComponent extends React.Component<INewContentProps, {
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
        return (
            <div style={{ width: '800px' }} >New content
                {
                    <Dialog
                        hidden={this.state.hideDialog}
                        className={'Dialog-Large'}
                        dialogContentProps={{
                            responsiveMode: ResponsiveMode.xLarge,
                            type: DialogType.largeHeader,
                            title: 'New ' + this.props.selectedId,
                            subText: ''
                        }}
                        onDismiss={this.onOk}
                        modalProps={{
                            isBlocking: false,
                            containerClassName: 'ms-dialogMainOverride'
                        }}
                    >
                        {
                            this.renderView(this.props.selectedId)
                        }
                        <DialogFooter>
                            <PrimaryButton onClick={this.onOk} text='Save' />
                            <DefaultButton onClick={this.onOk} text='Cancel' />
                        </DialogFooter>
                    </Dialog>
                }
            </div>
        )
    }
}
