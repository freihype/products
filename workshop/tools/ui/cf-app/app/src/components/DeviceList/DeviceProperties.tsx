import * as React from 'react';
import {
    GroupedList,
    IGroup
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
import { Devices } from './data';

import { DEVICE_STATE, DRIVER_FLAGS, EVENTS, COMMANDS } from '../../shared';

import { IContentHandler, IDevice, RESPONSE_SETTINGS } from '../../types';
import { createGroups, to } from './utils';

import * as api2 from '../../api2';
import { DeviceDto, InDeviceDto } from '../../api2';
import { Configuration, DevicesApi, OutDevicesDto } from '../../api2';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { Socket } from '../../socket';
import * as lodash from 'lodash';
import { Link } from 'react-router-dom';
import { DeviceCommands } from './Commands';
import { DefaultPropertySort, IProperty, WidgetMap, PropertiesComponent, IPropertyHandler } from '../Properties';
import { capitalize, WidgetArgs } from '../Properties/utils';
import { IComboBoxProps, ComboBox, IComboBoxState, IComboBoxOption } from 'office-ui-fabric-react/lib/ComboBox';
import { XComboBox } from '../widgets/ComboBox';
import * as Console from '../Console/Console';
import { Layout } from 'antd';
const { Header, Footer, Sider, Content } = Layout;
import Terminal from 'react-bash';
import { Observable, Subject, ReplaySubject, BehaviorSubject } from 'rxjs';
import { Rest } from '../../api/Rest'

import { LOGGING_FLAGS, LOGGING_SIGNAL } from '../../shared/enums';
/*import SwipeableViews from 'react-swipeable-views';*/
import { DeviceListItemComponent, IDeviceTreeItemProps, IItemHandler } from './Item';

export const DevicePropertiesMap = {
    name: 'string',
    isActive: 'boolean',
    host: 'enum',
    protocol: 'enum',
    flags: 'flags',
    port: 'string',
    retry: {
        mode: 'enum',
        interval: 'string',
        value: 'string'
    },
    commandSettings: {
        start: 'string',
        end: 'string',
        onReply: 'string',
        timeout: 'string',
        interval: 'string'
    },
    settings: {
        start: 'boolean',
        startString: 'string',
        responseMode: 'enum',
        delimiter: 'string',
        count: 'string'
    }
}

DevicePropertiesMap[LOGGING_SIGNAL.DEVICE_CONNECTED] = 'flags';
DevicePropertiesMap[LOGGING_SIGNAL.DEVICE_DISCONNECTED] = 'flags';
DevicePropertiesMap[LOGGING_SIGNAL.DEVICE_ERROR] = 'flags';
DevicePropertiesMap[LOGGING_SIGNAL.RESPONSE] = 'flags';
DevicePropertiesMap[LOGGING_SIGNAL.SEND_COMMAND] = 'flags';

export const DevicePropertiesGroupMap = {
    name: 'General',
    isActive: 'General',
    host: 'Network',
    protocol: 'Network',
    flags: 'Flags',
    commandSettings: 'Commands',
    settings: 'Response',
    port: 'Network',
    retry: 'Retry Settings'
}
DevicePropertiesGroupMap[LOGGING_SIGNAL.DEVICE_CONNECTED] = LOGGING_SIGNAL.DEVICE_CONNECTED;
DevicePropertiesGroupMap[LOGGING_SIGNAL.DEVICE_DISCONNECTED] = LOGGING_SIGNAL.DEVICE_DISCONNECTED;
DevicePropertiesGroupMap[LOGGING_SIGNAL.DEVICE_ERROR] = LOGGING_SIGNAL.DEVICE_ERROR;
DevicePropertiesGroupMap[LOGGING_SIGNAL.RESPONSE] = LOGGING_SIGNAL.RESPONSE;
DevicePropertiesGroupMap[LOGGING_SIGNAL.SEND_COMMAND] = LOGGING_SIGNAL.SEND_COMMAND;

export const DeviceToProperties = (model: any, handler: IPropertyHandler, propertiesMap: any = DevicePropertiesMap, group: string = null, field: string = null, path: string = null) => {

    if (!model) {
        return [];
    }
    let ret: IProperty[] = [];
    if (model.subject) {
        model.subject['_last'] = model.subject.getValue();
    }
    if (path && path in model) {
        model = model[path];
    }

    propertiesMap = propertiesMap || DevicePropertiesMap;
    // console.log('to properties', model);
    for (const attribute in model) {
        if (attribute in propertiesMap) {
            const type = propertiesMap[attribute];
            const value = model[attribute];
            // structure
            if (lodash.isObject(type)) {
                ret = ret.concat(DeviceToProperties(value, handler, type, DevicePropertiesGroupMap[attribute], attribute, path));
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
                        group: DevicePropertiesGroupMap[attribute] || group,
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

export const createHandler = (self: any, model: DeviceDto, properties?: PropertiesComponent, onSave?: any, path?: string): IPropertyHandler => {
    const widgets = {};
    properties = properties || self.props.properties();
    const ret: IPropertyHandler = {
        destroy() {
        },
        widgets: () => widgets,
        instance: (attribute: string) => {
            return widgets[attribute];
        },
        save: (properties: IProperty[], model: IDevice) => {
            console.log('save props', properties);
            console.log('next ', model.subject.getValue());
            const current: DeviceDto = model.subject.getValue();
            const data: any = {
                ...current
            }
            // data.blocks = data['scope'].blocksToJson();
            const blocks = model.scope.blocksToJson();
            try {
                data.blocks = JSON.stringify({ blocks: blocks }, null, 2);
            } catch (e) {
                console.error('scope::toString : invalid data in scope')
            }
            model.subject.next(data);
            if (onSave) {
                onSave(data);
                return;
            }
            delete data['subject'];
            delete data['scope'];
            delete data['instance'];
            self.props.rest.devices.apiDevicesIdPut(data, current.id);
            data['scope'] = model.scope;
            data['instance'] = model.instance;
            model.subject['_saved'] = true;

        },
        map: (attribute: string, type: string) => {
            if (type === 'enum') {
                return XComboBox;
            }
        },
        sort: (props: IProperty[]) => {
            return DefaultPropertySort(props, {
                name: 1,
                isActive: 2,
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
            if (key === LOGGING_SIGNAL.DEVICE_CONNECTED ||
                key === LOGGING_SIGNAL.DEVICE_DISCONNECTED ||
                key === LOGGING_SIGNAL.DEVICE_ERROR ||
                key === LOGGING_SIGNAL.RESPONSE ||
                key === LOGGING_SIGNAL.SEND_COMMAND) {
                inArgs.flags = [
                    {
                        value: LOGGING_FLAGS.GLOBAL_CONSOLE,
                        label: 'Global Console'
                    },
                    {
                        value: LOGGING_FLAGS.DEV_CONSOLE,
                        label: 'Chrome Dev - Console'
                    },
                    {
                        value: LOGGING_FLAGS.DEVICE_CONSOLE,
                        label: 'Device Console'
                    },
                    {
                        value: LOGGING_FLAGS.STATUS_BAR,
                        label: 'Status Bar'
                    },
                    {
                        value: LOGGING_FLAGS.POPUP,
                        label: 'Popup'
                    },
                    {
                        value: LOGGING_FLAGS.FILE,
                        label: 'File'
                    }
                ]
                inArgs.hex = true;
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

            if (key === 'responseMode') {
                let args: IComboBoxProps = inArgs;
                args.options = [
                    {
                        text: 'Per Byte',
                        key: 1
                    },
                    {
                        text: 'Per Packet',
                        key: 2
                    },
                    {
                        text: 'Delimiter',
                        key: 3
                    },
                    {
                        text: 'Count',
                        key: 4
                    }
                ];
                inArgs.value = lodash.find(args.options, {
                    key: value
                }).text;
                args.defaultValue = inArgs.value;
                return inArgs;
            }

            if (key === 'host') {
                let args: IComboBoxProps = inArgs;
                args.options = [
                    {
                        text: value,
                        key: value
                    }
                ];
                // return args;

                args.onResolveOptions = (options: IComboBoxOption[]) => {
                    return new Promise<IComboBoxOption[]>((resolve, reject) => {
                        (self.props.socket as Socket).ask(COMMANDS.PROTOCOL_METHOD, {
                            method: 'ls',
                            args: [],
                            protocol: model.protocol
                        }).then((d: any) => {
                            // console.log('ask result', d);
                            resolve(lodash.uniqBy([...lodash.values(options), {
                                text: value,
                                key: value
                            }
                            ].concat(d.map((h: any) => {
                                return {
                                    key: h.host,
                                    text: h.host + ' - ' + h.interface
                                }
                            })), 'key'));
                        });
                    });
                    // console.log('resolve options', arguments);

                };
                args.allowFreeform = true;
                return args;
            }
        },
        changed: (attribute: string, newValue: any, oldValue: any, property: IProperty) => {
            let model: IDevice = properties.state.model;
            console.log('changed : ' + attribute, newValue, model, path);
            if (attribute === 'host' || attribute === 'name' || attribute === 'isActive') {
                // const citems = self.state.items;
                model[attribute] = newValue;
                model.subject.next(model);
            }
            if (property.field) {
                // const citems = self.state.items;
                model[property.field][attribute] = newValue;
                model.subject.next(model);
            }
            if (path && path in model) {
                model[path][attribute] = newValue;
                model.subject.next(model);
            }
            model.subject['_changed'] = true;
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
