import { CommandBarButton } from 'office-ui-fabric-react/lib/Button';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu';
import { assign, autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';
import { Route } from 'react-router-dom';
import { farItemsNonFocusable, items, overflowItems } from './data';
import { IDefaultProps } from '../../types';
export interface IGlobalCommands {
    onAction: (path: string) => void;
}
export type ITopCommandBarProps = IDefaultProps & {
    handler?: IGlobalCommands;
}
export class TopCommandBar extends React.Component<ITopCommandBarProps, any> {
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
    public history: any;
    public render() {
        const filteredItems = items(this.onClick, this.props.project()).map((item: any) => assign({}, item, {
            iconOnly: false,
            icon: true ? item.icon : '',
            disabled: false,
            link: item.link
            /*onRender: this._renderSplitButtonMenuItem*/
        }));

        const filteredOverflowItems = overflowItems.map((item: any) => assign({}, item, {
            iconOnly: !this.state.namesVisible,
            icon: this.state.iconsVisible ? item.icon : '',
            disabled: !this.state.itemsEnabled
        }));

        const filteredFarItems = farItemsNonFocusable.map((item: any) => assign({}, item, {
            iconOnly: !this.state.namesVisible,
            icon: this.state.iconsVisible ? item.icon : '',
            disabled: !this.state.itemsEnabled
        }));
        return (
            <div>
                <Route
                    ref={(ref) => { this.route = ref; }}
                    render={({ history }) => (
                        <CommandBar
                            isSearchBoxVisible={false}
                            searchPlaceholderText='Search...'
                            elipisisAriaLabel='More options'
                            items={filteredItems}
                            farItems={farItemsNonFocusable}
                        />
                    )}>
                </Route>
            </div>
        );
    }
}
