import { CommandBarButton } from 'office-ui-fabric-react/lib/Button';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { assign, autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';
import { Route } from 'react-router-dom';
import { IDefaultProps } from '../../../types';
import { farItemsNonFocusable, items, all, overflowItems } from './WidgetCommands';
import { HTMLWidget } from '../..';
import './index.scss';

export interface IWidgetCommand {
    onAction: (path: string) => void;
}
export type ITopCommandBarProps = IDefaultProps & {
    handler?: IWidgetCommand;
}
export interface IWidgetCommandBarState {
    selection: HTMLWidget[];
    isSearchBoxVisible: boolean,
    areNamesVisible: boolean,
    areIconsVisible: boolean,
    areItemsEnabled: boolean
}
export class WidgetCommandBar extends React.Component<ITopCommandBarProps, IWidgetCommandBarState> {
    public route: Route;
    constructor(props: any) {
        super(props);
        this.state = {
            selection: [],
            isSearchBoxVisible: true,
            areNamesVisible: true,
            areIconsVisible: true,
            areItemsEnabled: true
        };
    }

    @autobind
    onClick(command: string) {
        this.props.handler.onAction(command);
        /*
        const history = this.route.context.router.history;
        history.push(item);*/
    }
    public history: any;
    public render() {

        const hasSelection = this.state.selection.length > 0;

        const filteredItems = all(this.onClick, this.props.project(), this.state.selection).map((item: any) => assign({}, item, {
            iconOnly: false,
            icon: true ? item.icon : '',
            link: item.link,
            disabled: item.global === true ? false : !hasSelection,
            className: item.className
            /*onRender: this._renderSplitButtonMenuItem*/
        }));

//        console.log('actions, ', this);

        const state = {
            isSearchBoxVisible: true,
            areNamesVisible: true,
            areIconsVisible: true,
            areItemsEnabled: true,
            namesVisible: true,
            iconsVisible: true,
            itemsEnabled: true
        }

        const filteredOverflowItems = overflowItems.map((item: any) => assign({}, item, {
            /*iconOnly: !state.namesVisible,
            icon: state.iconsVisible ? item.icon : '',
            disabled: !state.itemsEnabled*/

        }));

        const filteredFarItems = farItemsNonFocusable.map((item: any) => assign({}, item, {
            iconOnly: !state.namesVisible,
            icon: state.iconsVisible ? item.icon : '',
            disabled: !state.itemsEnabled
        }));
        return (
            <div>
                <Route
                    ref={(ref) => { this.route = ref; }}
                    render={({ history }) => (
                        <CommandBar
                            isSearchBoxVisible={false}
                            searchPlaceholderText='Search...'
                            items={filteredItems}
                        />
                    )}>
                </Route>
            </div>
        );
    }
}
