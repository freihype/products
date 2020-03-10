import { Layout } from 'antd';
import * as lodash from 'lodash';
import { IComboBoxProps } from 'office-ui-fabric-react/lib/ComboBox';
import { HTMLWidget } from '../..';
import { DefaultPropertySort } from '../../../components/Properties';
import { IProperty, IPropertyHandler, WidgetMap } from '../../../components/Properties/types';
import { WidgetArgs, capitalize } from '../../../components/Properties/utils';
import { XComboBox } from '../../../components/widgets/ComboBox';
import { HTMLPropertiesMap, HTMLPropertiesGroupMap, createNodePropertyHandler } from './HTMLProperties';

const { Header, Footer, Sider, Content } = Layout;

export const WidgetPropertiesMap = {
    name: 'string',
    enabled: 'boolean'
}

export const WidgetPropertiesGroupMap = {
    label: 'Widget',
    className: 'General',
    id: 'General',
    iconClass: 'Widget'
}

export const defaultProperties = {
    label: 'string',
    id: 'string',
    className: 'string',
    iconClass: 'string'
}

export const WidgetToProperties = (model: HTMLWidget, handler: IPropertyHandler, propertiesMap: any = WidgetPropertiesMap, group: string = null, field: string = null) => {
    if (!model) {
        return [];
    }
    let ret: IProperty[] = [];
    propertiesMap = {
        ...propertiesMap,
        ...defaultProperties
    }
    if (model['subject']) {
        model['subject']['_last'] = { ...model['subject'].getValue() };
    }
    if (model.domNode) {
        // model = model.domNode;
    }
    for (const attribute in model.domNode) {

        if (attribute in propertiesMap) {
            const type = propertiesMap[attribute];
            const value = model.domNode[attribute];
            // structure
            if (lodash.isObject(type)) {
                ret = ret.concat(WidgetToProperties(value, handler, type, WidgetPropertiesGroupMap[attribute], attribute));
                continue;
            }

            let widget = WidgetMap[type];
            if (handler.map) {
                const newWidgetType = handler.map(attribute, type);
                if (newWidgetType) {
                    widget = newWidgetType
                }
            }

            if (type) {
                if (widget) {
                    const property: IProperty = {
                        value: value,
                        handler: handler,
                        label: attribute,
                        widget: widget,
                        type: type,
                        attribute: attribute,
                        group: WidgetPropertiesGroupMap[attribute] || group,
                        field: field
                    }
                    property.args = WidgetArgs(type, attribute, value, capitalize(attribute), handler, property);
                    ret.push(property)
                }
            }
        }
    }

    if (handler && handler.sort) {
        ret = handler.sort(ret);
    }

    return ret;
}

export const createHandler = (self: any, model: HTMLWidget): IPropertyHandler => {
    const widgets = {};
    const properties = self.props.properties;
    const ret: IPropertyHandler = {
        destroy() {
            const mod: any = model;
            if (mod['subject'] && mod['subject']._changed === true && !mod['subject']._saved) {
                delete mod['subject']._changed;
                delete mod['subject']._last;
            }
        },
        widgets: () => widgets,
        instance: (attribute: string) => {
            return widgets[attribute];
        },
        save: (properties: IProperty[], model: any) => {
            /*
            const current: DeviceDto = model.subject._changed || model.subject.getValue();
            const data: InDeviceDto = {
                ...current
            }

            const changed = model.subject['_changed'];
            delete model.subject['_changed'];
            delete changed.subject;
            //mixin(model, changed);
            //mixin(data, changed);
            model.subject.next(data);

            // self.pro.apiDevicesIdPut(data, current.id);
            self.props.handler.onSaveBlocks([data]);
            model.subject['_saved'] = true;
            */
        },
        map: (attribute: string, type: string) => {
            if (type === 'enum') {
                return XComboBox;
            }
        },
        sort: (props: IProperty[]) => {
            return DefaultPropertySort(props, {
                name: 1,
                enabled: 2,
                flags: 1000
            });
        },
        args: (key: string, inArgs: any) => {
            // console.log(' ask args key:  ' + key, inArgs);
        },
        changed: (attribute: string, newValue: any, oldValue: any, property: IProperty) => {
            let model: HTMLWidget = properties.state.model;
            console.log('changed : ' + attribute, newValue, model);
            if (model.subject) {
                let changed = model.subject['_changed'];
                if (!changed) {
                    changed = model.subject['_changed'] = { ...model.subject.getValue() };
                }
                if (attribute === 'host' || attribute === 'name' || attribute === 'enabled' || attribute === 'send') {
                    const citems = self.state.items;
                    changed[attribute] = newValue;
                }
                if (property.field) {
                    const citems = self.state.items;
                    changed[property.field][attribute] = newValue;
                }
            }
        },
        onRendered: (attribute: string, property: IProperty, widget: any) => {
            widgets[attribute] = widget;
            switch (attribute) {
                case 'host': {

                }
            }
        }
    }
    return ret;
}
