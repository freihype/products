/* tslint:disable:no-unused-variable */
import * as React from 'react';
/* tslint:enable:no-unused-variable */
import { Link } from 'office-ui-fabric-react/lib/Link';
import { DetailsList, Selection, IGroup, SelectionMode, CollapseAllVisibility, CheckboxVisibility } from 'office-ui-fabric-react/lib/DetailsList';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import {
    IDragDropEvents,
    IDragDropContext
} from 'office-ui-fabric-react/lib/utilities/dragdrop/interfaces';
import { createListItems, createGroups } from './data';

let _draggedItem: any = null;
let _draggedIndex = -1;
import './index.scss';

export class BlockGrid extends React.Component<{}, {
    items: {}[];
    selectionDetails?: string;
}> {
    private _selection: Selection;

    constructor(props: {}) {
        super(props);

        this._onRenderItemColumn = this._onRenderItemColumn.bind(this);

        this._selection = new Selection();

        this.state = {
            items: createListItems(10)
        };
    }

    public render() {
        const { items, selectionDetails } = this.state;

        const createGroup = (name: string, items: any[]): IGroup => {
            return {
                count: 3,
                name: name,
                key: 'group-' + Math.random(),
                startIndex: 0,
                isCollapsed: false
            }
        }
        return (
            <div className='ms-DetailsListAdvancedExample'>
                <div>{selectionDetails}</div>
                <MarqueeSelection selection={this._selection}>
                    <DetailsList
                        groups={[createGroup('General', [])]}
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
                        columns={[
                            {
                                key: 'name',
                                name: 'name',
                                fieldName: 'name',
                                minWidth: 100,
                                onRender: (item: any) => {
                                    return (
                                        <div> {item.name} </div>
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
