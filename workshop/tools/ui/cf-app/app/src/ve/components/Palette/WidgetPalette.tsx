import { Icon, Menu } from 'antd';
import * as lodash from 'lodash';
import { IColumn, IGroup, Selection, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';
import { EditorContext } from '../../EditorContext';
import { Frame } from '../VisualEditor/Frame';
import { Metadata } from '../metadata';
import { PaletteList } from './ListView';
import './index.scss';

const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;

export interface PaletteProps {
    context: EditorContext;
    frame: Frame;
    editor: any;
    showFilter: boolean;
}

export class WidgetPalette extends React.Component<PaletteProps, any> {
    list: PaletteList;
    private _selection: Selection;
    public root: HTMLElement;
    constructor(props) {
        super(props);
        this._onRenderItemColumn = this._onRenderItemColumn.bind(this);

        this._selection = new Selection({
            onSelectionChanged: this._onSelectionChanged,
            selectionMode: SelectionMode.multiple
        });
        this.state = {
            items: []
        };
    }

    /*
    @autobind
    public itemClick(item: any) {
        const properties = this.props.properties;
        if (properties) {
            properties.next(createHandler, this, item, BlockToProperties);
        }
    }
    */
    private _onRenderItemColumn(item: any, index: number, column: IColumn) {
        if (column.key === 'name') {
            return <Link data-selection-invoke={true}>{item[column.key]}</Link>;
        }

        return item[column.key];
    }
    @autobind
    private _onSelectionChanged() {
        const items = this._selection.getSelection();
        const first = items[0];
        if (first) {
            //this.itemClick(first);
            //this.props.handler.onBlockSelection(items as Block[]);
        } else if (!items.length) {
            /*
            const properties = this.props.properties;
            if (properties) {
                properties.clear();
            }
            */
        }
    }

    public toGroups(widgets: any) {

        const ret: IGroup[] = [];
        const createGroup = (name: string, items: any[]): IGroup => {
            return {
                count: 3,
                name: name,
                key: 'group-' + Math.random(),
                startIndex: 0
            }
        }

        widgets.forEach((widget: any, index: number) => {
            let group: IGroup = lodash.find(ret, {
                name: widget.group
            })
            if (!group) {
                group = {
                    name: widget.group,
                    count: widgets.filter((p) => p.group === widget.group).length,
                    key: 'group-' + widget.group,
                    startIndex: index,
                    isCollapsed: widgets.length > 4
                }
                ret.push(group);
            }
        })
        return ret;

    }

    toItems(widgets: any[], group: string) {
        return lodash.sortBy(widgets, 'name').map((w) => {
            return {
                ...w,
                group,
                name: w.name.replace('<', '').replace('>', '')
            }
        })
    }

    render() {
        const libs = Metadata.getLibraries() as any;
        const wDelite = libs['delite'].$wm.widgets;
        const wHtml = libs['html'].$wm.widgets;

        const delite = this.toItems(wDelite, 'Widgets');
        const _html = this.toItems(wHtml, 'Native');
        const _user = this.toItems([{ name: 'None' }], 'User');

        let all = [...delite, ..._html, ..._user];
        let groups = this.toGroups(all);
        const filter = (this.state.filter || '').toLowerCase();
        if (this.state.filter) {
            all = all.filter((p: any) => (p.name as string).toLowerCase().startsWith(filter));
            groups = this.toGroups(all);
        }
        return <div className='WidgetPalette'>
            <Menu theme='light' mode='inline' defaultOpenKeys={['Palette', 'Palette2']} defaultSelectedKeys={['Visual Editor']}>
                <Menu.Item key='Visual Editor'>
                    <Icon type='link' />
                    <span>Visual Editor</span>
                </Menu.Item>
            </Menu>

            <h4>Widgets</h4>
            <PaletteList {...this.props}
                ref={(ref) => this.list = ref}
                groups={groups}
                items={all}
                owner={this}
            />
        </div>
    }
}
