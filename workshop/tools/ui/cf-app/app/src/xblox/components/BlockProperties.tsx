import { Layout } from 'antd';
import * as lodash from 'lodash';
import { IComboBoxProps } from 'office-ui-fabric-react/lib/ComboBox';
import * as React from 'react';
import { Block } from '..';
import { DeviceDto, InDeviceDto } from '../../api2';
import { DefaultPropertySort } from '../../components/Properties';
import { IProperty, IPropertyHandler, WidgetMap } from '../../components/Properties/types';
import { WidgetArgs, capitalize } from '../../components/Properties/utils';
import { XComboBox } from '../../components/widgets/ComboBox';
import { DRIVER_FLAGS } from '../../shared';
import { IDevice } from '../../types';

const { Header, Footer, Sider, Content } = Layout;

export const BlockPropertiesMap = {
    name: 'string',
    enabled: 'boolean'
}

export const BlockPropertiesGroupMap = {
    name: 'General',
    enabled: 'General'
    /*,
    host: 'Network',
    protocol: 'Network',*/
    //flags: 'Settings',
    //settings: 'Response',
    //port: 'Network',
    //retry: 'Retry Settings'
}

export const BlockToProperties = (model: Block, handler: IPropertyHandler, propertiesMap: any = BlockPropertiesMap, group: string = null, field: string = null) => {
    if (!model) {
        return [];
    }
    let ret: IProperty[] = [];
    propertiesMap = {
        ...propertiesMap,
        ...model.getProperties()
    }

    console.log('block prop1erties', propertiesMap);
    // console.log('to properties', propertiesMap);
    if (model['subject']) {
        //model['subject']['_last']
        model['subject']['_last'] = { ...model['subject'].getValue() };
        // console.log('remember', model['subject']['_last']);
    }
    // console.log('to props', model);
    for (const attribute in model) {

        if (attribute in propertiesMap) {
            const type = propertiesMap[attribute];
            const value = model[attribute];
            // structure
            if (lodash.isObject(type)) {
                ret = ret.concat(BlockToProperties(value, handler, type, BlockPropertiesGroupMap[attribute], attribute));
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
                        group: BlockPropertiesGroupMap[attribute] || model.getPropertyGroup(attribute) || group,
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

export const createHandler = (self: any, model: Block): IPropertyHandler => {
    const widgets = {};
    const properties = self.props.properties;
    const ret: IPropertyHandler = {
        destroy() {
            //console.log('destroy', model);
            if (model['subject']._changed === true && !model['subject']._saved) {
                //console.log('restore', model);
                // model['subject'].next({ ...model['subject']._last });
                delete model['subject']._changed;
                delete model['subject']._last;
                //console.log('restore', model['subject'].getValue());

            }
        },
        widgets: () => widgets,
        instance: (attribute: string) => {
            return widgets[attribute];
        },
        save: (properties: IProperty[], model: any) => {
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

            // console.log('save props', properties);
            /*
            console.log('next ', model.subject.getValue());

            const current: DeviceDto = model.subject.getValue();
            const data: InDeviceDto = {
                ...current
            }
            model.subject.next(data);
            // self.pro.apiDevicesIdPut(data, current.id);
            self.props.handler.onSaveBlocks([data]);
            model.subject['_saved'] = true;
            model.subject['_last'] = { ...data };
            delete model.subject['_changed'];*/
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
            const value = inArgs.defaultValue;
            if (key === 'protocol') {
                let args: IComboBoxProps = inArgs;
                args.options = [
                    {
                        text: 'Tcp',
                        key: 'tcp'
                    },
                    {
                        text: 'Udp',
                        key: 'Udp'
                    },
                    {
                        text: 'Serial',
                        key: 'serial'
                    }
                ];
                return args;
            }

            if (key === 'flags') {
                inArgs.flags = [
                    {
                        label: 'Run on Server',
                        value: DRIVER_FLAGS.RUNS_ON_SERVER
                    },
                    {
                        label: 'Debug',
                        value: DRIVER_FLAGS.DEBUG
                    },
                    {
                        label: 'Make Server ',
                        value: DRIVER_FLAGS.SERVER
                    }
                ]
                return inArgs;
            }
            if (key === 'mode') {
                let args: IComboBoxProps = inArgs;
                args.options = [
                    {
                        text: 'Abort',
                        key: 1
                    },
                    {
                        text: 'Interval',
                        key: 2
                    },
                    {
                        text: 'Abort after n trials',
                        key: 3
                    }
                ];
                inArgs.value = lodash.find(args.options, {
                    key: value
                }).text;
                return inArgs;
            }
        },
        changed: (attribute: string, newValue: any, oldValue: any, property: IProperty) => {
            let model: IDevice = properties.state.model;
            console.log('changed : ' + attribute, newValue, model);
            let changed = model.subject['_changed'];
            if (!changed) {
                changed = model.subject['_changed'] = { ...model.subject.getValue() };
            }
            if (attribute === 'host' || attribute === 'name' || attribute === 'enabled' || attribute === 'send') {
                const citems = self.state.items;
                changed[attribute] = newValue;
                // model.subject.next(model);
            }
            if (property.field) {
                const citems = self.state.items;
                changed[property.field][attribute] = newValue;
                // model.subject.next(model);
            }
            /*
            if (attribute === 'host' || attribute === 'name' || attribute === 'enabled' || attribute === 'send') {
                const citems = self.state.items;
                model[attribute] = newValue;
                model.subject.next(model);
            }
            if (property.field) {
                const citems = self.state.items;
                model[property.field][attribute] = newValue;
                model.subject.next(model);
            }
            */
            // model.subject['_changed'] = true;
        },
        onRendered: (attribute: string, property: IProperty, widget: any) => {
            widgets[attribute] = widget;
            switch (attribute) {
                case 'host': {
                    // console.log('rendered property: ' + attribute, widget);
                    /*
                    const p = property;
                    if (widget) {
                        (widget).setState({
                            currentOptions: [
                                {
                                    text: '1',
                                    key: '1'
                                }
                            ]
                        })
                    }
                    */
                    /*
                    (widget as ComboBox).setState({
                        selectedIndex
                    })*/
                    /*
                    if (widget) {
                        setTimeout(() => {
                            // let newArgs: IComboBoxProps = {};
                            console.log('rerender');
                            let b: IComboBoxState;
                            (widget).setState({
                                currentOptions: [{
                                    text: 'sdf',
                                    key: 'sdf'
                                }]
                            })
                            widget.forceUpdate();
                        }, 3000);
                    }*/
                }
            }
        }
    }
    return ret;
}
