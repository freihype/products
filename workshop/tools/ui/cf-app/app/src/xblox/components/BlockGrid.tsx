import * as mousetrap from 'mousetrap';
import { CheckboxVisibility, CollapseAllVisibility, DetailsList, IColumn, IGroup, Selection, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { IDragDropContext, IDragDropEvents } from 'office-ui-fabric-react/lib/utilities/dragdrop/interfaces';
import * as React from 'react';
import { PropertiesComponent } from '../../components/Properties';
import { IDevice } from '../../types';
import { BLOCK_GROUPS, Block, Scope } from '../../xblox';
import { BlockItem, BlockValue } from './Block';
import { BlockToProperties, createHandler } from './BlockProperties';
import './index.scss';
import { IBlockGridHandler } from './types';

let _draggedItem: any = null;
let _draggedIndex = -1;

export interface IBlockGrid {
    model: IDevice;
    handler?: IBlockGridHandler;
    group?: string;
    properties: PropertiesComponent
}

export class BlockGrid extends React.Component<IBlockGrid, {
    items: {}[];
    selectionDetails?: string;
}> {
    private _selection: Selection;
    private scope: Scope;
    public root: HTMLElement;

    constructor(props: IBlockGrid) {
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

    @autobind
    public itemClick(item: any) {
        const properties = this.props.properties;
        if (properties) {
            properties.next(createHandler, this, item, BlockToProperties);
        }
    }

    @autobind
    private _onSelectionChanged() {
        const items = this._selection.getSelection();
        const first = items[0];
        if (first) {
            this.itemClick(first);
            this.props.handler.onBlockSelection(items as Block[]);
        } else if (!items.length) {
            const properties = this.props.properties;
            if (properties) {
                properties.clear();
            }
        }
    }
    private init(model: IDevice) {
        if (!model) {
            console.warn('invalid model');
            return false;
        }
        try {
            if (!this.scope) {
                this.scope = model.scope;
                const items = this.scope.getBlocks({
                    group: this.props.group
                })
                // console.log('render block group ' + this.props.group, items);
                this.state = { items };
                this._selection.setItems(items);
                /*
                const data = model.blocks as any;
                if (data.blocks) {
                    // console.log('create scope : ', data.blocks);
                    this.scope = new Scope();
                    this.scope.initWithData(data.blocks, (e) => {
                        console.error('error creating scope', e);
                    });
                    // (model.blocks as any).blocks =
                    // const items = this.scope.basicCommands();
                    const items = this.scope.getBlocks({
                        group: this.props.group
                    })
                    console.log('render block group ' + this.props.group, items);
                    this.state = { items };
                    this._selection.setItems(items);
                }
                */
            }
        } catch (e) {
            console.error('error creating scope', e);
        }

    }

    public componentWillUnmount() {
        mousetrap(this.root).unbind('r');
    }
    public componentDidMount() {

        mousetrap(this.root).bind('r', (e, combo) => {
            this.props.handler.onRun();
        });

        const device = this.props.model;
        if (!device) {
            return;
        }
        const blocks = device.blocks;
        if (!blocks) {
            return;
        }
    }

    public render() {
        this.init(this.props.model);
        const { items, selectionDetails, } = this.state;
        // console.log('render block grid', items);
        const createGroup = (name: string, items: any[]): IGroup => {
            return {
                count: 3,
                name: name,
                key: 'group-' + Math.random(),
                startIndex: 0,
                isCollapsed: false
            }
        }
        const owner = this;

        return (
            <div ref={(ref) => this.root = ref} className='ms-DetailsListAdvancedExample'>
                <div>{selectionDetails}</div>
                <MarqueeSelection selection={this._selection}>
                    <DetailsList
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
                        checkboxVisibility={CheckboxVisibility.hidden}
                        setKey='items'
                        items={items}
                        selection={this._selection}
                        selectionPreservedOnEmptyClick={false}
                        onItemInvoked={this._onItemInvoked}
                        onRenderItemColumn={this._onRenderItemColumn}
                        isHeaderVisible={false}
                        columns={this.props.group === BLOCK_GROUPS.BASIC_VARIABLES ? [
                            {
                                key: 'name',
                                name: 'name',
                                fieldName: 'name',
                                minWidth: 100,
                                onRender: (item: any) => {
                                    return (
                                        <BlockItem model={item} owner={owner} />
                                    );
                                }
                            },
                            {
                                key: 'value',
                                name: 'value',
                                fieldName: 'value',
                                minWidth: 100,
                                onRender: (item: any) => {
                                    return (
                                        <BlockValue model={item} owner={owner} />
                                    );
                                }
                            }
                        ] : [
                                {
                                    key: 'name',
                                    name: 'name',
                                    fieldName: 'name',
                                    minWidth: 100,
                                    onRender: (item: any) => {
                                        return (
                                            <BlockItem model={item} owner={owner} />
                                        );
                                    }
                                }
                            ]}
                        dragDropEvents={this._getDragDropEvents()}
                    />
                </MarqueeSelection>
            </div>
        );
    }

    private _getDragDropEvents(): IDragDropEvents {
        return {
            canDrop: (dropContext?: IDragDropContext, dragContext?: IDragDropContext) => true,
            canDrag: (item?: any) => true,
            onDragEnter: (item?: any, event?: DragEvent) => 'dragEnter', // return string is the css classes that will be added to the entering element.
            onDragLeave: (item?: any, event?: DragEvent) => { return; },
            onDrop: (item?: any, event?: DragEvent) => {
                if (_draggedItem) {
                    this._insertBeforeItem(item);
                }
            },
            onDragStart: (item?: any, itemIndex?: number, selectedItems?: any[], event?: MouseEvent) => {
                _draggedItem = item;
                _draggedIndex = itemIndex!;
            },
            onDragEnd: (item?: any, event?: DragEvent) => {
                _draggedItem = null;
                _draggedIndex = -1;
            },
        };
    }

    private _onItemInvoked(item: any): void {
        alert(`Item invoked: ${item.name}`);
    }

    private _onRenderItemColumn(item: any, index: number, column: IColumn) {
        if (column.key === 'name') {
            return <Link data-selection-invoke={true}>{item[column.key]}</Link>;
        }

        return item[column.key];
    }

    private _insertBeforeItem(item: any) {
        const draggedItems = this._selection.isIndexSelected(_draggedIndex) ? this._selection.getSelection() : [_draggedItem];

        const items: any[] = this.state.items.filter((i: any) => draggedItems.indexOf(i) === -1);
        let insertIndex = items.indexOf(item);

        // if dragging/dropping on itself, index will be 0.
        if (insertIndex === -1) {
            insertIndex = 0;
        }

        items.splice(insertIndex, 0, ...draggedItems);

        this.setState({ items: items });
    }
}
