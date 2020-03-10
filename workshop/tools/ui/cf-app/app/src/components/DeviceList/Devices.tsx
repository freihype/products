import { Layout } from 'antd';
import * as lodash from 'lodash';
import { FocusZone } from 'office-ui-fabric-react/lib/FocusZone';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { IPivotItemProps, Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { DetailsRow } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsRow';
import { CollapseAllVisibility, GroupedList, IGroup } from 'office-ui-fabric-react/lib/components/GroupedList/index';
import { IObjectWithKey, Selection, SelectionMode, SelectionZone } from 'office-ui-fabric-react/lib/utilities/selection/index';
import * as React from 'react';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import { BehaviorSubject } from 'rxjs';
import { Rest } from '../../api/Rest';
import { Configuration, DeviceDto, DevicesApi } from '../../api2';
import { DeviceService } from '../../services/DeviceService';
import { COMMANDS } from '../../shared';
import { Socket } from '../../socket';
import { IContentHandler, IDefaultProps, IDevice } from '../../types';
import { PropertiesComponent } from '../Properties';
import { DeviceCommands } from './Commands';
import { DeviceInstance } from './DeviceInstance';
import { DeviceToProperties, createHandler } from './DeviceProperties';
/*import SwipeableViews from 'react-swipeable-views';*/
import { DeviceListItemComponent } from './Item';
import { createGroups } from './utils';

const { Header, Footer, Sider, Content } = Layout;

const groupCount = 10;
const groupDepth = 0;

let _groups: IGroup[];
export type IDeviceTreeView = IDefaultProps & {
    handler?: IContentHandler
    apiConfig?: Configuration
    socket?: Socket
    properties?: () => PropertiesComponent
    selected?: number;
    selectedId?: string;
    openedInstances?: any[];
}

export class DeviceTreeView extends React.Component<IDeviceTreeView, {}> {
    private _selection: Selection;
    public api: DevicesApi;
    public rest: Rest;
    public list: GroupedList;
    public instances: any[] = [];
    /*public swipe: SwipeableViews;*/
    public deviceService: DeviceService;
    public state = {
        items: [],
        instances: [],
        selectedView: 0
    }
    constructor(props: IDeviceTreeView) {
        super(props);
        _groups = createGroups(groupCount, groupDepth, 0, 10);
        this._selection = new Selection({
            onSelectionChanged: this._onSelectionChanged,
            getKey: (item: any) => item.id

        });
        // this.api = new DevicesApi(this.props.apiConfig);
        this.rest = new Rest(this.props.apiConfig);
        this.deviceService = DeviceService.instance();
    }

    @autobind
    public itemClick(item: any) {
        const properties = this.props.properties();
        if (properties) {
            properties.next(createHandler, this, item, DeviceToProperties);
        }
    }
    public componentWillUnmount() {
        const properties = this.props.properties();
        properties.setState({
            model: null,
            handler: null,
            toProperties: null
        });
    }
    @autobind
    private _onSelectionChanged() {
        const items = this._selection.getSelection();
        console.log('selection changed', items);
        const first = items[0];
        if (first) {
            this.itemClick(first);
        } else if (!items.length) {
            const properties = this.props.properties();
            if (properties) {
                properties.setState({
                    model: null,
                    handler: null,
                    toProperties: null
                });
            }
        }
    }

    start(devices: Array<DeviceDto>) {
        devices.forEach((d) => {
            console.log(`start device `, d);
            this.api.apiDevicesStartIdPost(d.id);
        });
    }

    startDevice(device: DeviceDto) {
        let state = device;
        if (device.isActive) {
            console.log('stop device ', device);
            this.rest.devices.apiDevicesStopIdPost(device.id);
            device.isActive = false;
        } else {
            device.isActive = true;
            console.log('start device ', device);
            this.rest.devices.apiDevicesStartIdPost(device.id);
        }

    }

    componentWillMount() {
        const socket = this.props.socket as Socket;
        socket.on(COMMANDS.DEVICE_UPDATE, (data) => {
            console.log('on updated');
            const device = lodash.find(this.state.items, {
                id: data.id
            });
            lodash.extend(device, data);
            this.setState({
                items: this.state.items
            });
            if (this.list) {
                this.list.forceUpdate();
            }
        })
    }

    /**
     * update
     */
    public update(items?: any[], updateSelection: boolean = true) {
        if (!items) {
            items = this.state.items;
        }
        this.setState({
            items: [].concat(items)
        });
        this.forceUpdate();
        this.list.forceUpdate();
        // console.log('update', items);
        updateSelection && this._selection.setItems(items as IObjectWithKey[], true);
    }

    public async componentDidMount() {
        //
        // console.log('devices', this.props.project());
        // const t = this.api.apiDevicesGet();
        let devices = await this.deviceService.devices(this.props.project());
        // const subjects2 = subjects as BehaviorSubject<IDevice>[];
        //const devices = subjects2.map((d) => d.subject.getValue());
        //console.log('got devices', devices);
        devices.map((s) => {
            s.subject.subscribe(x => {
                const items = this.state.items;
                let item = lodash.find(items, {
                    id: x.id
                });
                if (item) {
                    lodash.extend(item, x);
                }
                if (this.state.items.length) {
                    this.update(this.state.items, false);
                }
            });

        });
        this.update(devices);
        if (this.props.selectedId) {
            this._selection.setKeySelected(this.props.selectedId, true, true)
        }
    }
    private _customRenderer(link: IPivotItemProps, defaultRenderer: (link: IPivotItemProps) => JSX.Element): JSX.Element {
        return (
            <span>
                {defaultRenderer(link)}
                <Icon iconName='Airplane' style={{ color: 'red' }} />
            </span>
        );
    }

    @autobind
    public getDeviceList() {
        // console.log('this.state.items', this._selection);
        return <FocusZone key='list'>
            <SelectionZone
                selection={this._selection}
                selectionMode={SelectionMode.single}
            >
                <Pivot>
                    <PivotItem linkText='My Devices' itemCount={2} itemIcon='Emoji2'>
                        <GroupedList
                            ref={this.setList}
                            groupProps={{
                                isAllGroupsCollapsed: false,
                                headerProps: {
                                    selectionMode: SelectionMode.none,
                                    isCollapsedGroupSelectVisible: false
                                },
                                collapseAllVisibility: CollapseAllVisibility.hidden,
                                showAllProps: {
                                    selectionMode: SelectionMode.none,
                                    selected: false
                                }
                            }}
                            items={this.state.items}
                            // tslint:disable-next-line:jsx-no-bind
                            onRenderCell={this._onRenderCell.bind(this)}
                            selection={this._selection}
                            selectionMode={SelectionMode.single}
                            groups={[
                                {
                                    count: 3,
                                    name: 'My Group',
                                    key: 'group-' + Math.random(),
                                    startIndex: 0,
                                    isCollapsed: false
                                }
                            ]}
                        />
                    </PivotItem>
                    <PivotItem linkText='With Errors' itemCount={1} itemIcon='Recent' onRenderItemLink={this._customRenderer}>
                        <Label>Pivot #2</Label>
                    </PivotItem>
                    <PivotItem linkText='Recent' itemIcon='Recent' itemCount={1}>
                        <Label>Recent</Label>
                    </PivotItem>
                </Pivot>

            </SelectionZone>
        </FocusZone>
    }

    @autobind
    public openInstance(model: DeviceDto) {
        const added = lodash.find(this.state.instances, {
            id: model.id
        });

        if (!added) {
            this.state.instances.push(model);
        }
        this.setState({
            items: [...this.state.items as any],
            instances: [...this.state.instances as any],
            selectedView: this.state.instances.length
        });
        //this.render();
        // this.forceUpdate();
        // this.swipe.forceUpdate();
    }
    @autobind
    getInstances() {
        return this.state.instances.map((d: DeviceDto, index: number) => {
            return React.createElement(DeviceInstance, {
                handler: this.props.handler,
                apiConfig: this.props.apiConfig,
                socket: this.props.socket,
                model: d as IDevice,
                key: 'instance-' + index
            });
        })
    }

    @autobind
    getViews() {
        let list = [this.getDeviceList()];
        list = list.concat(this.getInstances());
        return list;
    }
    /**
     * setLllistist
     */
    @autobind
    public setList(list) {
        this.list = list;
    }

    @autobind
    public setSwipe(list) {
        //this.swipe = list;
    }
    public render() {
        return (
            <ReflexContainer orientation='horizontal' style={{ height: '600px' }}>
                <ReflexElement className='upper-pane'>
                    {
                        this.getViews()
                    }
                </ReflexElement>
            </ReflexContainer >
        );
    }
    @autobind
    private _onRenderCell(nestingDepth?: number, item?: any, index?: number): React.ReactNode {
        {/*
                    Object.keys(item).slice(0, 3).map((value): IColumn => {
                        return {
                            key: value,
                            name: value,
                            fieldName: value,
                            minWidth: 300
                        };
                    })
                */}
        let {
            _selection: selection
        } = this;
        const handler = this;
        // console.log('item ' + item.key, item);
        return (
            <div onClick={() => {
                this.itemClick(item);
            }}>
                < DetailsRow
                    columns={
                        [{
                            key: 'toggle',
                            name: 'toggle',
                            fieldName: 'isActive',
                            minWidth: 80,
                            onRender: (item: any) => {
                                return (
                                    <Toggle
                                        style={{ marginTop: '8px' }}
                                        defaultChecked={item.isActive}
                                        title=''
                                        onAriaLabel=''
                                        offAriaLabel={''}
                                        onText=''
                                        offText=''
                                        onChanged={(val) => {
                                            handler.startDevice(item);
                                        }}
                                    />
                                );
                            }
                        },
                        {
                            key: 'name',
                            name: 'name',
                            fieldName: 'name',
                            minWidth: 80,
                            maxWidth: 100,
                            onRender: (item: any) => {
                                return (
                                    <DeviceListItemComponent handler={handler} model={item} />
                                );
                            }
                        },
                        {
                            key: item.id + ' commands' + '-' + index,
                            name: '',
                            fieldName: '',
                            minWidth: 200,
                            onRender: (item: any) => {
                                return (
                                    <DeviceCommands handler={handler} model={item} />
                                );
                            }
                        }
                        ]
                    }
                    groupNestingDepth={nestingDepth}
                    item={item}
                    itemIndex={index}
                    selection={selection}
                    selectionMode={SelectionMode.single}
                />
            </div>
        );
    }
}
