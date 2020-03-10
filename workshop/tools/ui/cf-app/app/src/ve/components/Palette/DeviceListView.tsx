import { Menu } from 'antd';
import { CheckboxVisibility, CollapseAllVisibility, DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { ConnectDragSource, XYCoord, DragLayer, DragDropContextProvider, DragSource, DragSourceConnector, DragSourceMonitor, ConnectDragPreview } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { EditorContext } from '../../EditorContext';
import { Frame } from '../VisualEditor/Frame';
import './index.scss';
import { Metadata } from '../metadata';
import { CreateTool } from '../../tools/CreateTool';
import { Block } from '../../../xblox';
import { mixin } from '@xblox/core/objects';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { BoxProps, ItemTypes, styleD, style } from './_dnd';

export interface PaletteProps {
    context: EditorContext;
    frame: Frame;
    editor: any;
    showFilter: boolean;
}
interface PaletteItemProps {
    name: string;
    owner: DevicePaletteList;
    isDragging?: boolean;
    connectDragSource?: any;
    model: any;
    connectDragPreview?: ConnectDragPreview;
    left?: number;
    top?: number;
}

const boxSource = {
    beginDrag(props: any, monitor, component) {
        console.log('begin drag', props);
        props.owner.beginDrag(props.model);
        return {
            name: props.name,
        }
    },

    endDrag(props: BoxProps, monitor: DragSourceMonitor) {
        console.log('end drag', arguments);
        const item = monitor.getItem()
        const dropResult = monitor.getDropResult()

        if (dropResult) {
            alert(`You dropped ${item.name} into ${dropResult.name}!`)
        }
    },
}

function collect(connect, monitor) {
    return {
        connectDragSource: () => { debugger; connect.dragSource() },
        isDragging: monitor.isDragging()
    }
}
function getStyles(props: PaletteItemProps): React.CSSProperties {
    const { left, top, isDragging } = props
    const transform = `translate3d(${left}px, ${top}px, 0)`

    return {
        position: 'absolute',
        transform,
        WebkitTransform: transform,
        // IE fallback: hide the real node using CSS when dragging
        // because IE will ignore our custom "empty image" drag preview.
        opacity: isDragging ? 0 : 1,
        height: isDragging ? 0 : '',
    }
}

@DragSource(
    ItemTypes.CARD,
    boxSource,
    (connect: DragSourceConnector, monitor: DragSourceMonitor) => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging(),
    })
)
export class PaletteItem extends React.Component<PaletteItemProps, any> {
    public componentDidMount() {
        const connectDragPreview = this.props.connectDragPreview;
        if (connectDragPreview) {
            // console.log('prev', connectDragPreview);
            // Use empty image as a drag preview so browsers don't draw it
            // and we can draw whatever we want on the custom drag layer instead.
            connectDragPreview(getEmptyImage(), {
                // IE fallback: specify that we'd rather screenshot the node
                // when it already knows it's being dragged so we can hide it with CSS.
                captureDraggingState: true,
            })
        } else {
            console.log('prev null');
        }
    }
    render() {
        const { isDragging, connectDragSource } = this.props;
        let { name } = this.props;
        const opacity = isDragging ? 0.4 : 1;
        const st = isDragging ? styleD : style;
        if (isDragging) {
            // return false;
        }
        return (
            connectDragSource &&
            connectDragSource(<div style={{ ...st, opacity }}>{name}</div>)
        )
    }
}

export class DevicePaletteList extends React.Component<{
    items: any;
    groups: any;
    owner: any;

}, any> {
    private _onRenderItemColumn(item: any, index: number, column: IColumn) {
        if (column.key === 'name') {
            return <PaletteItem model={item} owner={this} name={item[column.key]} />
            /*
            return <Link data-selection-invoke={true}>
                <img src={item.iconBase64} style={{ float: 'left' }} />
                &nbsp;&nbsp;
                {
                    item[column.key]
                }
            </Link>;
            */
        }
        return item[column.key];
    }

    beginDrag(block: Block) {

        const toUrl = (device, block, prefix) => {
            prefix = prefix || '';
            return prefix + `deviceName=${device.name}&device=${device.id}&block=${block.id}`;
        }

        const editor = (this.props as any).editor;
        const context = (this.props as any).context;
        function createProperties(item, url) {
            if (!item.ref) {
                return {};
            }
            const props = {
                block: url,
                script: '' + item.name,
                targetevent: 'click'
            };
            return props;
        }

        const type = 'xblox/RunScript';
        const isCommand = block ? block.isCommand || block.declaredClass.indexOf('model.Command') !== -1 : false;

        const prefix = isCommand ? 'command://' : 'variable://';
        console.log('block', block);

        const url = toUrl(block.scope.device, block, prefix);

        const _props = createProperties(block, url); // : createPropertiesVariable(block, url);

        const _protoDefault = {
            children: '',
            name: 'RunScript',
            properties: {
                style: 'position:relative',
                scopeid: '',
                targetevent: 'click'
            },
            type: 'xblox/RunScript',
            userData: {}
        };

        Metadata.getHelper(type, 'tool').then(function (ToolCtor) {
            // Copy the data in case something modifies it downstream -- what types can data.data be?
            const args = { ..._protoDefault };
            mixin(args.properties, _props);
            const tool = new CreateTool(args, block);
            context.setActiveTool(tool);
        }.bind(this));

        console.log('bdrag', {
            editor,
            context,
            block
        })

    }

    endDrag(item: PaletteItem) {

    }

    render() {
        //console.log('render device list palette ', this);
        return <div>
            <DetailsList
                groups={this.props.groups}
                onRenderItemColumn={(property: any, index: number, column: IColumn) => this._onRenderItemColumn(property, index, column)}
                checkboxVisibility={CheckboxVisibility.hidden}
                setKey='items'
                items={this.props.items}
                selectionPreservedOnEmptyClick={false}
                isHeaderVisible={false}
                selectionMode={SelectionMode.none}
                columns={[
                    {
                        key: 'name',
                        name: 'name',
                        fieldName: 'attribute',
                        minWidth: 100
                    }
                ]}
                groupProps={
                    {
                        collapseAllVisibility: CollapseAllVisibility.hidden,
                        showEmptyGroups: true,
                        headerProps: {
                            isCollapsedGroupSelectVisible: true
                        }
                    }
                }
            />
        </div>
    }
}
