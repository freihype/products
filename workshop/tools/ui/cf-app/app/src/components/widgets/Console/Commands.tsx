import { CommandBarPage } from 'office-ui-fabric-react/lib/components/CommandBar/CommandBarPage'
import * as React from 'react';
import { assign, autobind } from 'office-ui-fabric-react/lib/Utilities';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { CommandBarButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import './index.scss';
export const iconOnlyItems = (model: any, handler: any) => [
    {
        key: 'run',
        name: 'Run',
        icon: 'Play',
        onClick: () => { handler.runBlock(model) },
    },
    {
        key: 'rename',
        name: 'Edit',
        icon: 'Edit',
        onClick: () => { return; },
        _subMenuProps: {
            items: [
                {
                    key: 'move',
                    name: 'Move to...',
                    icon: 'MoveToFolder'
                },
                {
                    key: 'disabled',
                    name: 'Remove',
                    icon: 'Cancel',
                    onClick: () => { return; }
                }
            ]
        }
    }

];
import { IConsoleHandler } from '../../../types';

export interface IConsoleCommands {
    handler?: IConsoleHandler;
    model?: any;
}

export class ConsoleCommands extends React.Component<IConsoleCommands, {
    displayHex: boolean;
    constructResponse: boolean;
}> {
    public state: any = { displayHex: false, constructResponse: true };
    constructor(props: any) {
        super(props);

    }
    public render() {
        const filteredItems = iconOnlyItems(this.props.model, this.props.handler).map((item: any) => assign({}, item, {
            iconOnly: false,
            icon: true ? item.icon : '',
            disabled: item.disabled !== undefined ? item.disabled : false
        }));
        return (
            <div style={{ marginLeft: '8px' }}>
                <Toggle
                    defaultChecked={this.state.constructResponse}
                    style={{ float: 'left', display: 'inline-block' }}
                    title='Construct Response'
                    onAriaLabel=''
                    offAriaLabel={''}
                    onText='Construct'
                    offText='Raw'
                    className='Command-Button'
                    onChanged={(val) => {
                        this.setState({
                            constructResponse: val
                        })
                        this.state.constructResponse = val;
                        this.props.handler.onChangeOptions(this.state);
                    }}
                />
                <Toggle
                    defaultChecked={this.state.displayHex}
                    title='Display mode'
                    onAriaLabel=''
                    offAriaLabel={''}
                    onText='Hex'
                    offText='ASCII'
                    className='Command-Button'
                    onChanged={(val) => {
                        this.setState({
                            displayHex: val
                        })
                        this.state.displayHex = val;
                        this.props.handler.onChangeOptions(this.state);
                    }}
                />
                <ActionButton
                    iconProps={{ iconName: 'Clear' }}
                    title={'Clear'}
                    text={'Clear'}
                    onClick={() => {
                        this.props.handler.onConsoleClear()
                    }}
                />

                <ActionButton
                    iconProps={{ iconName: 'Send' }}
                    title={'Send'}
                    text={'Send'}
                    onClick={() => {
                        this.props.handler.onConsoleEnter('')
                    }}
                />
            </div>
        );
    }
}
