import { CommandBarPage } from 'office-ui-fabric-react/lib/components/CommandBar/CommandBarPage'
import * as React from 'react';
import { assign, autobind } from 'office-ui-fabric-react/lib/Utilities';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';

import { CommandBarButton } from 'office-ui-fabric-react/lib/Button';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { IBlockCommandHandler } from './types';
import { Block } from '../';
export const iconOnlyItems = (model: Block, handler: IBlockCommandHandler) => [
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

export interface IBlockCommands {
    handler?: IBlockCommandHandler,
    model?: Block
}

export class BlockCommands extends React.Component<IBlockCommands, IBlockCommands> {
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
            <div>
                <CommandBar style={{ height: 'auto' }}
                    isSearchBoxVisible={false}
                    items={filteredItems}
                />
            </div>
        );
    }
}
