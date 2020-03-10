import { sortBy } from 'lodash';

export interface IProperty {
    group?: string;
    value?: any;
    handler: IPropertyHandler;
    widget: any;
    label: any;
    args?: any;
    type: string;
    instance?: any;
    attribute: string;
    field?: string;
}
////////////////////////////////////////////////////////////////
// callbacks

// sort
export interface IPropertySortMap {
    [key: string]: number;
}
export type PropertySort = (properties: IProperty[], map?: IPropertySortMap) => IProperty[];
export const DefaultPropertySort = (
    properties: IProperty[],
    map: IPropertySortMap = {}): IProperty[] => {
    return sortBy(properties, (p) => map[p.label] || 100);
}

// change
export type PropertyChanged = (attribute: string, newValue: any, oldValue: any, property: IProperty) => void;

// callback: rendered
export type PropertyRendered = (attribute: string, property: IProperty, widget: any) => void;
export interface IPropertyWidgetArgs {
    [key: string]: any;
}
// widget args
export type WidgetArguments = (key: string, inArgs: any) => any | undefined;

export type WidgetMap = (attribute: string, type: string) => any | undefined;

export type Save = (properties: IProperty[], model: any) => void;

export type Instance = (attribute: string) => any;

////////////////////////////////////////////////////////////////
// property interfaces
export interface IPropertyHandler {
    sort?: PropertySort;
    changed?: PropertyChanged;
    args?: WidgetArguments;
    sortMap?: IPropertySortMap;
    onRendered?: PropertyRendered;
    map?: WidgetMap;
    save?: Save;
    instance?: Instance;
    widgets?: any;
    destroy: () => void;
}
////////////////////////////////////////////////////////////////
// widgets
import { TextField, ITextFieldProps } from 'office-ui-fabric-react/lib/TextField';
import { FlagsWidget } from '../widgets/Flags/Flags';
import {
    Checkbox,
    ICheckboxStyles,
    ICheckboxProps
} from 'office-ui-fabric-react/lib/Checkbox';
import {
    ComboBox,
    IComboBoxProps,
    IComboBoxOption,
    VirtualizedComboBox
} from 'office-ui-fabric-react/lib/ComboBox';

export const WidgetMap = {
    string: TextField,
    boolean: Checkbox,
    enum: ComboBox,
    flags: FlagsWidget
}

export {
    ICheckboxProps,
    ITextFieldProps
}
