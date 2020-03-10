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
import { DevicePaletteList } from './DeviceListView';
import './index.scss';
import { DeviceService } from '../../../services/DeviceService';
import { IDefaultProps, IDevice } from '../../../types';
import { BLOCK_GROUPS, COMMAND_TYPES } from '../../../xblox';

const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;

export type PaletteProps = IDefaultProps & {
    context: EditorContext;
    frame: Frame;
    editor: any;
    showFilter: boolean;
}

export function createGroups(
    groupCount: number,
    groupDepth: number,
    startIndex: number,
    itemsPerGroup: number,
    level: number = 0,
    key: string = ''): IGroup[] {
    if (key !== '') {
        key = key + '-';
    }
    let count = Math.pow(itemsPerGroup, groupDepth);
    return Array.apply(null, Array(groupCount)).map((value: number, index: number) => {
        return {
            count: count,
            key: 'group' + key + index,
            name: 'group ' + key + index,
            startIndex: index * count + startIndex,
            level: level,
            children: groupDepth > 1 ?
                createGroups(groupCount, groupDepth - 1, index * count + startIndex, itemsPerGroup, level + 1, key + index) :
                []
        };
    });
}

export class DevicePalette extends React.Component<PaletteProps, {
    devices: IDevice[];
    filter?: string;
}> {
    list: DevicePaletteList;
    private _selection: Selection;
    public root: HTMLElement;
    public deviceService: DeviceService;
    public devices: IDevice[] = [];
    constructor(props) {
        super(props);
        this._onRenderItemColumn = this._onRenderItemColumn.bind(this);
        this._selection = new Selection({
            onSelectionChanged: this._onSelectionChanged,
            selectionMode: SelectionMode.multiple
        });
        this.state = {
            devices: []
        };
        this.deviceService = DeviceService.instance();
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

    public toItems(widgets: any[], group: string) {
        return lodash.sortBy(widgets, 'name').map((w) => {
            return {
                ...w,
                group,
                name: w.name.replace('<', '').replace('>', '')
            }
        })
    }

    public componentDidMount() {
        return this.deviceService.devices(this.props.project()).then((devices) => {
            this.setState({
                devices: devices
            });
        })
    }

    public render() {
        const devices = this.state.devices;
        let out = [];
        let outGroups = [];
        let startIndex = 0;

        const add = (device: IDevice) => {

            let blocks = device.scope.getBlocks({
                group: COMMAND_TYPES.BASIC_COMMAND,
            }).filter((b) => b.parentId === '0');

            let variables = device.scope.getBlocks({
                group: BLOCK_GROUPS.BASIC_VARIABLES,
            }).filter((b) => b.parentId === '0');

            const filter = (this.state.filter || '').toLowerCase();
            if (this.state.filter) {
                blocks = blocks.filter((p: any) => (p.name as string).toLowerCase().startsWith(filter));
                variables = variables.filter((p: any) => (p.name as string).toLowerCase().startsWith(filter));
            }

            out = out.concat(blocks);
            out = out.concat(variables);

            outGroups = outGroups.concat(
                {
                    count: 1,
                    key: 'gk0-' + device.id,
                    startIndex: startIndex,
                    level: 0,
                    name: device.name, // 'Marantz',
                    children: [{
                        count: blocks.length,
                        key: 'gKeyCommands-' + device.id,
                        startIndex: startIndex,
                        level: 1,
                        name: 'Commands'
                    },
                    {
                        count: variables.length,
                        key: 'gKeyVariables-' + device.id,
                        startIndex: startIndex + blocks.length,
                        level: 1,
                        name: 'Variables'
                    }
                    ]
                }
            )
            startIndex += blocks.length;
            startIndex += variables.length;
            //console.log('outGroups ' + startIndex, outGroups);
            //console.log('total : ', out);
        }
        devices.forEach((device) => add(device));

        const filter = (this.state.filter || '').toLowerCase();
        return <div className='DevicePalette'>
            <h4>Devices</h4>
            <DevicePaletteList {...this.props}
                ref={(ref) => this.list = ref}
                groups={outGroups}
                items={out}
                owner={this}
            />
        </div>
    }
}
