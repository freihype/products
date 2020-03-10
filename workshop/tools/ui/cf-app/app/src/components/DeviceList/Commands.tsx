import { CommandBarButton } from 'office-ui-fabric-react/lib/Button';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { assign, autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';
import { Route } from 'react-router-dom';
import { DeviceDto } from '../../api2';
import { overflowItems } from '../CommandBar/data';
export const iconOnlyItems = (model: DeviceDto, handler: any) => [
    {
        key: 'log',
        name: 'Log',
        icon: 'History',
        onClick: () => { return; },
    },
    {
        key: 'rename',
        name: 'Edit',
        icon: 'Edit',
        onClick: () => { return; },
        subMenuProps: {
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
                    onClick: (e) => { e.preventDefault(); handler.onClick('/Delete/Device/' + model.id) }
                }
            ]
        }
    },
    {
        key: 'instance',
        name: 'Instance',
        icon: 'History',
        disabled: model.isActive === false,
        link: '/Instance/' + model.id,
        onClick: (e) => { e.preventDefault(); handler.onClick('/Instance/' + model.id + '?project=' + model.project) },
        _onClick: (e) => {

            handler.openInstance(model);
            // onClick: (e) => { e.preventDefault(); handler.onClick('Delete/Device') }
        }
    },

];
export const overflow = [
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
];
export class DeviceCommands extends React.Component<any, any> {
    public route: Route;
    constructor(props: any) {
        super(props);
        this.state = {
            isSearchBoxVisible: true,
            areNamesVisible: true,
            areIconsVisible: true,
            areItemsEnabled: true
        };
    }
    @autobind
    onClick(item: any) {
        const history = this.route.context.router.history;
        history.push(item);
    }

    @autobind
    openInstance(item: any) {
        this.props.handler.openInstance(item);
    }

    @autobind
    private _renderSplitButtonMenuItem(item: IContextualMenuItem) {
        if (!item.link) {
            return (<CommandBarButton
                iconProps={{ iconName: item.icon }}
                text={item.name}
            />
            );
        } else {
            return (
                <Route render={({ history }) => (
                    <CommandBarButton
                        onClick={(e) => {
                            e.preventDefault(); history.push(item.link)
                        }} iconProps={{ iconName: item.icon }} text={item.name} />
                )} />);
        }
    }
    public render() {
        // console.log('items', iconOnlyItems);
        // const filteredItems = iconOnlyItems(this.props.model, this.props.handler).map((item: any) => assign({}, item, {
        const filteredItems = iconOnlyItems(this.props.model, this).map((item: any) => assign({}, item, {
            iconOnly: false,
            icon: true ? item.icon : '',
            disabled: item.disabled !== undefined ? item.disabled : false,
            // onRender: this._renderSplitButtonMenuItem,
            subMenuProps: item.subMenuProps
        }));
        return (
            <div>
                <Route
                    ref={(ref) => { this.route = ref; }}
                    render={({ history }) => (
                        <CommandBar
                            style={{ backgroundColor: 'inherit' }}
                            isSearchBoxVisible={false}
                            items={filteredItems}
                        />
                    )}>
                </Route>
            </div>
        );
    }
}
