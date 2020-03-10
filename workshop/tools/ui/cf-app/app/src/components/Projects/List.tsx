import * as React from 'react';
import {
    GroupedList,
    IGroup,
    CollapseAllVisibility
} from 'office-ui-fabric-react/lib/components/GroupedList/index';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { DetailsRow } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsRow';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import {
    FocusZone
} from 'office-ui-fabric-react/lib/FocusZone';
import {
    Selection,
    SelectionMode,
    SelectionZone,
    IObjectWithKey
} from 'office-ui-fabric-react/lib/utilities/selection/index';
import { IconButton, ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { DEVICE_STATE, debug, EVENTS, COMMANDS } from '../../shared';
import { IContentHandler, IDevice } from '../../types';

import * as api2 from '../../api2';
import { DeviceDto, InDeviceDto, ProjectDto } from '../../api2';
import { Configuration, DevicesApi, OutDevicesDto } from '../../api2';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { Socket } from '../../socket';
import * as lodash from 'lodash';
import { Link } from 'react-router-dom';
import { DefaultPropertySort, IProperty, PropertiesComponent, IPropertyHandler } from '../Properties';
import { IComboBoxProps, ComboBox, IComboBoxState, IComboBoxOption } from 'office-ui-fabric-react/lib/ComboBox';
import { XComboBox } from '../widgets/ComboBox';
import * as Console from '../Console/Console';
import { Layout } from 'antd';
const { Header, Footer, Sider, Content } = Layout;
import Terminal from 'react-bash';
import { Observable, Subject, ReplaySubject, BehaviorSubject } from 'rxjs';
import { Rest } from '../../api/Rest'

/*import SwipeableViews from 'react-swipeable-views';*/
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Inject } from '../../di';
import { DeviceService } from '../../services/DeviceService';
import { IDefaultProps } from '../../types';

import {
    DocumentCard,
    DocumentCardActions,
    DocumentCardActivity,
    DocumentCardLocation,
    DocumentCardPreview,
    DocumentCardTitle,
    IDocumentCardPreviewProps
} from 'office-ui-fabric-react/lib/DocumentCard';

import { ImageFit } from 'office-ui-fabric-react/lib/Image';
/*import { TestImages } from '../../../common/TestImages';*/

import {
    PivotItem,
    IPivotItemProps,
    Pivot
} from 'office-ui-fabric-react/lib/Pivot';

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
} from 'react-reflex';

const groupCount = 10;
const groupDepth = 0;

let _groups: IGroup[];

export type IDeviceTreeView = IDefaultProps & {

}

export class ProjectList extends React.Component<IDeviceTreeView, {
    items: ProjectDto[];
}> {
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
        // _groups = createGroups(groupCount, groupDepth, 0, 10);
        this._selection = new Selection({
            onSelectionChanged: this._onSelectionChanged,
            getKey: (item: any) => item.id

        });
        // this.api = new DevicesApi(this.props.apiConfig);
        this.rest = new Rest(this.props.apiConfig);
    }

    @autobind
    public itemClick(item: any) {
        /*
        const properties = this.props.properties();
        if (properties) {
            properties.setState({
                model: null,
                handler: null,
                toProperties: null

            });
            properties.forceUpdate();
            setTimeout(() => {
                properties.setState({
                    model: item,
                    handler: createHandler(this, item),
                    toProperties: DeviceToProperties
                });
                properties.forceUpdate();
            }, 0);
        }
        */
    }
    public componentWillUnmount() {
        /*
        const properties = this.props.properties();
        properties.setState({
            model: null,
            handler: null,
            toProperties: null
        });
        */
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
        // this.list.forceUpdate();
        // console.log('update', items);
        //updateSelection && this._selection.setItems(items as IObjectWithKey[], true);
    }

    public async componentDidMount() {
        // const t = this.api.apiDevicesGet();
        // debugger;
        let subjects = await this.props.rest.projects.apiProjectsGet();
        subjects = (subjects as any).groups;
        console.log('projects', subjects);
        this.update(subjects as any[], false);
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
            items: [...this.state.items as any]
        });
    }
    /*
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
        }*/

    public render() {
        console.log('render project list', this);
        const props = this.props;
        return (
            <ReflexContainer orientation='horizontal' style={{ height: '600px', margin: '8px' }}>
                <ReflexElement className='upper-pane'>
                    {
                        this.state.items.map((p: ProjectDto) =>
                            <DocumentCard key={p.id}>
                                {
                                /*<DocumentCardPreview {...previewProps} />*/}
                                <DocumentCardTitle
                                    title={p.name}
                                    shouldTruncate={true}
                                />
                                <DocumentCardActivity
                                    activity={`Created: ${new Date(p.created).toLocaleDateString()} `}
                                    people={
                                        [
                                            { name: 'Annie Lindqvist', profileImageSrc: 'TestImages.personaFemale' }
                                        ]
                                    }
                                />
                                <DocumentCardActions
                                    actions={
                                        [
                                            {
                                                iconProps: { iconName: 'Edit' },
                                                onClick: (ev: any) => {
                                                    console.log('You clicked the share action.');
                                                    ev.preventDefault();
                                                    ev.stopPropagation();
                                                    const history = props.route().context.router.history;
                                                    history.push('/Devices/?project=' + p.id);
                                                },
                                                ariaLabel: 'share action'
                                            },
                                            {
                                                iconProps: { iconName: 'Share' },
                                                onClick: (ev: any) => {
                                                    console.log('You clicked the share action.');
                                                    ev.preventDefault();
                                                    ev.stopPropagation();
                                                },
                                                ariaLabel: 'share action'
                                            },
                                            {
                                                iconProps: { iconName: 'Pin' },
                                                onClick: (ev: any) => {
                                                    console.log('You clicked the pin action.');
                                                    ev.preventDefault();
                                                    ev.stopPropagation();
                                                },
                                                ariaLabel: 'pin action'
                                            },
                                            {
                                                iconProps: { iconName: 'Ringer' },
                                                onClick: (ev: any) => {
                                                    console.log('You clicked the ringer action.');
                                                    ev.preventDefault();
                                                    ev.stopPropagation();
                                                },
                                                ariaLabel: 'ringer action'
                                            }
                                        ]
                                    } />
                            </DocumentCard>
                        )
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
                        [
                            {
                                key: 'name',
                                name: 'name',
                                fieldName: 'name',
                                minWidth: 80,
                                maxWidth: 100
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
