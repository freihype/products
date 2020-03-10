import * as React from 'react';
import * as lodash from 'lodash';
import { IconButton, ActionButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import {
    IPropertyHandler,
    IProperty,
    WidgetMap,
    ICheckboxProps,
    ITextFieldProps
} from './types';
import { IComboBoxOption, SelectableOptionMenuItemType, IComboBox, ComboBox, VirtualizedComboBox } from 'office-ui-fabric-react/lib/ComboBox';
import { autobind, assign } from '@uifabric/utilities';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { DetailsList, Selection, IGroup, SelectionMode, CollapseAllVisibility, CheckboxVisibility } from 'office-ui-fabric-react/lib/DetailsList';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import {
    IDragDropEvents,
    IDragDropContext
} from 'office-ui-fabric-react/lib/utilities/dragdrop/interfaces';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { capitalize, WidgetArgs } from './utils';
import Group from 'antd/lib/input/Group';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import './Properties.scss';
import { v4 } from 'uuid';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';

export class PropertiesGroupsRenderer extends React.Component<IPropertiesRendererProps, IPropertiesRendererProps> {
}

////////////////////////////////////////////////////////////////
// Default property renderer
// single properties pane
export interface IPropertiesRendererProps {
    model?: any;
    handler?: IPropertyHandler;
    toProperties?: (model: any, handler: IPropertyHandler, map?: any, group?: any, field?: string, path?: string) => IProperty[],
    filter?: string;
    properties?: IProperty[];
    showFilter?: boolean;
    showSave?: boolean;
    path?: string;
}
export class PropertiesRenderer extends React.Component<IPropertiesRendererProps, IPropertiesRendererProps> {

    public state: IPropertiesRendererProps = {
        filter: ''
    };
    public properties: IProperty[] = [];

    constructor(args) {
        super(args);
    }

    @autobind public onSave() {
        this.props.handler.save(this.properties, this.props.model);
    }

    @autobind
    public renderProperty(property: IProperty, handler: IPropertyHandler) {
        return React.createElement(property.widget, {
            ...property.args,
            key: 'prop-' + this.properties.indexOf(property),
            ref: (ref: any) => {
                if (this.props.handler) {
                    if (this.props.handler.onRendered) {
                        this.props.handler.onRendered(property.attribute, property, ref);
                    }
                }
            }
        });
    }
    private _onRenderItemColumn(property: IProperty, index: number, column: IColumn) {
        property.instance = this.renderProperty(property, this.props.handler);
        const result = <div className={'Property Property-' + property.type} key={'prop' + index}> {property.instance} </div>;
        return result;
    }

    public toGroups(properties: IProperty[]) {
        const ret: IGroup[] = [];
        const createGroup = (name: string, items: any[]): IGroup => {
            return {
                count: 3,
                name: name,
                key: 'group-' + Math.random(),
                startIndex: 0
            }
        }

        properties.forEach((property: IProperty, index: number) => {
            let group: IGroup = lodash.find(ret, {
                name: property.group
            })
            if (!group) {
                group = {
                    name: property.group,
                    count: properties.filter((p) => p.group === property.group).length,
                    key: 'group-' + property.group,
                    startIndex: index,
                    isCollapsed: properties.length > 4
                }
                ret.push(group);
            }
        })

        return ret;
    }
    toProperties: (...rest) => any[] = null;
    public setPropertiesFunction(f: any) {
        this.toProperties = f;
    }

    @autobind
    private _onChanged(text: any): void {
        // console.log('changed', text);
        this.setState({ filter: text });
    }

    public shouldComponentUpdate() {
        return true;
    }

    public list: DetailsList;

    public clear() {
        this.list.forceUpdate();
    }

    public render() {
        this.state.properties = [];
        if (this.props.toProperties) {
            this.state.properties = this.props.toProperties(this.props.model, this.props.handler, null, null, null, this.props.path);
            if (this.state.filter) {
                this.state.properties = this.state.properties.filter(p => p.label.toLowerCase().indexOf(this.state.filter) > -1);
            }
        } else {
            this.state.properties = [];
        }

        // console.log('render ', this.state.properties);

        const groups = this.toGroups(this.state.properties);
        return <div>

             {this.props.showFilter !== false ? <SearchBox
                placeholder={'Search'}
                onChanged={this._onChanged}
            /> : ''
            }

            <DetailsList
                ref={(ref) => this.list = ref}
                groups={groups}
                checkboxVisibility={CheckboxVisibility.hidden}
                setKey='items'
                items={this.state.properties}
                selectionPreservedOnEmptyClick={false}
                onRenderItemColumn={(property: IProperty, index: number, column: IColumn) => this._onRenderItemColumn(property, index, column)}
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
            {this.state.properties.length && this.props.showSave !== false ? <PrimaryButton onClick={this.onSave} className={'PropertiesSave'} style={{ marginRight: '8px' }} > Save </PrimaryButton> : ''}
        </div>
    }
}

////////////////////////////////////////////////////////////////////////////////////
const COMPONENTS = {
    device: PropertiesRenderer
}

export type ToProperties = (model: any, handler: IPropertyHandler, propertiesMap?: any, group?: string, field?: string) => any[];
export interface IPropertyView {
    model: any;
    handler?: IPropertyHandler;
    toProperties?: ToProperties;
    showFilter?: boolean;
    showSave?: boolean;
    path?: string;
}

export class PropertiesComponent extends React.Component<IPropertyView, IPropertyView> {
    state: IPropertyView = { model: {}, handler: null }
    public renderer: PropertiesRenderer;
    clear() {
        if (this.state.handler) {
            this.state.handler.destroy();
        }
        this.setState({
            model: null,
            handler: null,
            toProperties: null,
            path: null
        });
        this.forceUpdate();
    }
    next(createHandler, owner, item, toProperties, path?: string) {
        this.clear();
        if (createHandler && owner && item && toProperties) {
            setTimeout(() => {
                this.setState({
                    model: item,
                    handler: createHandler(owner, item, null, null, path),
                    toProperties: toProperties,
                    path: path
                });
                this.forceUpdate();
            }, 1);
        }
    }
    public render() {
        // console.log('render ', this.state);
        return <div className='Properties cf-Properties' data-is-scrollable='true'>
            <PropertiesRenderer path={this.state.path} showSave={this.props.showSave} showFilter={this.props.showFilter} ref={(ref) => this.renderer = ref} model={this.state.model} handler={this.state.handler} toProperties={this.state.toProperties} />
        </div>
    }
}
