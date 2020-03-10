import { Menu } from 'antd';
import { CheckboxVisibility, CollapseAllVisibility, DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Link } from 'office-ui-fabric-react/lib/Link';
import * as React from 'react';
import { EditorContext } from '../../EditorContext';
import { Frame } from '../VisualEditor/Frame';
import { mixin } from '@xblox/core/objects';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { BoxProps, ItemTypes, styleD, style } from './_dnd';
import './index.scss';

const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;

import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import * as PropTypes from 'prop-types';
import {
    ConnectDragSource,
    DragSource,
    DragSourceConnector,
    DragSourceMonitor
} from 'react-dnd';
import { HTMLWidget } from '../..';

export interface PaletteProps {
    context: EditorContext;
    frame: Frame;
    editor: any;
    showFilter: boolean;
}

const boxSource = {
    beginDrag(props: any) {
        console.log('begin drag', props);
        props.owner.beginDrag(props.model);
        return {
            name: props.name,
        }
    },
    endDrag(props: BoxProps, monitor: DragSourceMonitor) {
        const item = monitor.getItem();
        const dropResult = monitor.getDropResult();
        if (dropResult) {
            alert(`You dropped ${item.name} into ${dropResult.name}!`)
        }
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

export default class PaletteItem extends React.Component<any, any> {
    public componentDidMount() {
        const connectDragPreview = this.props.connectDragPreview;
        if (connectDragPreview) {
            // Use empty image as a drag preview so browsers don't draw it
            // and we can draw whatever we want on the custom drag layer instead.
            connectDragPreview(getEmptyImage(), {
                // IE fallback: specify that we'd rather screenshot the node
                // when it already knows it's being dragged so we can hide it with CSS.
                captureDraggingState: true
            })
        }
    }

    render() {
        const { isDragging, connectDragSource } = this.props
        const { name } = this.props
        const opacity = isDragging ? 0.4 : 1;
        const st = isDragging ? styleD : style;
        return (
            connectDragSource &&
            connectDragSource(<div style={{ ...st, opacity }}>{name}</div>)
        )
    }
}

export class PaletteList extends React.Component<{
    items: any;
    groups: any;
    owner: any;
}, any> {

    private _onRenderItemColumn(item: any, index: number, column: IColumn) {
        if (column.key === 'name') {
            return <PaletteItem model={item} owner={this} name={item[column.key]} />
        }
        return item[column.key];
    }

    beginDrag(widget: HTMLWidget) {
        console.log('widget', widget);
    }

    render() {
        return <DetailsList
            groups={this.props.groups}
            checkboxVisibility={CheckboxVisibility.hidden}
            setKey='items'
            items={this.props.items}
            selectionPreservedOnEmptyClick={false}
            onRenderItemColumn={(property: any, index: number, column: IColumn) => this._onRenderItemColumn(property, index, column)}
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
    }
}
