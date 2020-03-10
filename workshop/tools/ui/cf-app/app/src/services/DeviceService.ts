import { Injectable } from '../di';
import { Socket } from '../socket';
import { Configuration, DeviceDto } from '../api2';
import { Rest } from '../api/Rest';
import { BehaviorSubject } from 'rxjs';
import * as lodash from 'lodash';
import { IDevice } from '../types';
import { Scope } from '../xblox';
import { DriverInstance } from '../shared/driver/DriverInstance';
import { mixin } from '../shared/lib/objects';
import { COMMANDS, DEVICE_STATE, EVENTS } from '../shared';
import * as utils from '../shared/utils'
import { EventEmitter } from 'events';
import * as MD5 from 'md5';
import { decorate, injectable } from 'inversify';
const debug = true;
// decorate(injectable(), 'EventEmitter');
export interface IAppProps {
    user: any;
    token: string;
    socket: Socket;
    apiConfig: Configuration;
}

let instance: DeviceService;
const device_cache_key = (id: string) => `device-${id}`;
// @injectable()
export class DeviceService extends EventEmitter {
    public static instance() {
        return instance;
    }
    public apiConfig: Configuration;
    socket: Socket;
    token: string;
    public rest: Rest;
    private _cache: any = {
        devices: null
    }

    public cache(key, objects: any) {
        this._cache[key] = objects;
    }
    public get(key: string) {
        return this._cache[key];
    }

    /**
     * @param driverInstance
     * @param data
     * @param src
     * @param id
     * @param print
     * @param wait
     * @param stop
     * @param pause
     * @param command {module:xcf/model/Command}
     * @param args {object}
     */
    sendDeviceCommand(driverInstance: DriverInstance, data: any, src: string, id: string, print: boolean, wait: boolean, stop: boolean, pause: boolean, command: string, args: any) {

        const device = driverInstance.device.subject.getValue() as IDevice;
        const _device = {
            host: device.host,
            port: device.port,
            protocol: device.protocol,
            id: device.id,
            user: device.user
        };
        /*
        mixin({
                    src: src
                }, options);*/

        const dataOut = {
            command: data,
            device_command: command || COMMANDS.DEVICE_SEND,
            device: _device

        };
        mixin(dataOut, {
            params: {
                src: src,
                id: id,
                wait: wait,
                stop: stop,
                pause: pause,
                args: args
            }
        });

        debug && console.log('Device.Manager.Send.Message : ' + dataOut.command.substr(0, 30) + ' = hex = ' + utils.stringToHex(dataOut.command) + ' l = ' + dataOut.command.length, dataOut); //sending device message
        // const device = this.getDevice(options.id);
        if (!device || !lodash.isObject(device)) {
            console.error('invalid device');
            return;
        }

        if (device._userStopped) {
            return;
        }
        if (device && (device.state === DEVICE_STATE.DISABLED ||
            device.state === DEVICE_STATE.DISCONNECTED ||
            device.state === DEVICE_STATE.CONNECTING
        )) {
            debug && console.error('send command when disconnected', device);
            return;
        }
        const message = utils.stringFromDecString(dataOut.command);
        /*
        if (device.isDebug()) {
            this.emit(EVENTS.ON_STATUS_MESSAGE, {
                text: 'Did send message : ' + '<span class="text-warnin">' + message.substr(0, 30) + '</span>' + " to " + '<span class="text-info">' + options.host + ":" + options.port + "@" + options.protocol + '</span>'
            });
        }*/

        try {

            const hash = MD5(JSON.stringify(_device));
            const viewId = hash + '-Console';
            if (this.socket) {
                this.socket.emit(COMMANDS.DEVICE_SEND, dataOut);
                /*
                if (has('xcf-ui') && print !== false) {
                    const consoleViews = this.consoles[viewId];
                    _.each(consoleViews, function (view) {
                        const text = '<span class="text-info"><b>' + dataOut.command + '</span>';
                        view.printCommand(text, '');
                    });
                }
                */
            } else {
                // this.onHaveNoDeviceServer();
                console.error('this.deviceServerClient is null');
                console.error(' Send Device Command ' + data + 'failed, have no  device Server client');
            }
            if (!driverInstance.blockScope) {
                return;
            }
            /*
            const command = driverInstance.blockScope.getBlockById(src);
            this.emit(types.EVENTS.ON_DEVICE_COMMAND, {
                device: device,
                command: utils.stringFromDecString(data),
                deviceInfo: this.toDeviceControlInfo(device),
                name: command ? command.name : ''
            });
            */
        } catch (e) {
            debugger;
        }
    }

    private initDevice(device: IDevice) {

    }

    public _completeDevice(device: IDevice): IDevice {
        if (!device.instance) {
            device.instance = new DriverInstance(device, this);
        }
        if (!device.scope) {
            device.scope = new Scope();
            const data = device.blocks as any;
            device.scope.initWithData(data.blocks, (e) => {
                console.error('error creating scope', e);
            });
            device.scope.instance = device.instance;
            device.scope.instance.init();
            device.scope.device = device;
        }
        return device;
    }

    public async device(id: string, allowCache: boolean = true): Promise<IDevice> {
        const device = this.get(device_cache_key(id));
        if (allowCache && device) {
            return device;
        }
        const subjects = await this.rest.getDevices();
        return new Promise<IDevice>((resolve, reject) => {
            // tslint:disable-next-line:radix
            const selected = parseInt(id);
            if (!selected) {
                return;
            }
            const devices = (subjects as BehaviorSubject<DeviceDto>[]).map((s) => s.getValue());
            const device = (lodash.find(devices, { id: selected }) as IDevice);
            this._completeDevice(device);
            if (allowCache) {
                this.cache(device_cache_key(id), device);
            }
            resolve(device);
        })
    }

    constructor() {
        super();
        console.error('ctr DeviceService');
    }
    public async devices(project?: number): Promise<IDevice[]> {
        let subjects = await this.rest.getDevices(project);
        const subjects2 = subjects as BehaviorSubject<IDevice>[];
        const devices = subjects2.map((s) => s.getValue());
        const ret = [];
        return new Promise<any>((resolve, reject) => {
            devices.forEach((_ret) => {
                this._completeDevice(_ret)
                ret.push(_ret);
            });
            resolve(ret);
        });
    }

    init(socket: Socket, token: string, api: Configuration) {
        this.socket = socket;
        this.token = token;
        this.apiConfig = api;
        this.rest = new Rest(this.apiConfig);
        instance = this;

        socket.on(COMMANDS.DEVICE_UPDATE, (data) => {
            const device: IDevice = this.get(device_cache_key(data.id));
            if (!device) {
                console.warn('device update cant find device in cache ' + data.name);
                return;
            }
            const current = device.subject.getValue();
            const next = lodash.extend(current, data);
            console.log('update device', next);
            device.subject.next({
                ...next
            })
        })
        function clear(message) {
            delete message['resposeSettings'];
            delete message['driver'];
            delete message['lastResponse'];
            delete message['scope'];
            delete message['driverId'];
            delete message['device'];
            //delete message['src'];
            //delete message['id'];
            delete message['sourceHost'];
            delete message['sourcePort'];
        };

        socket.on(EVENTS.ON_DEVICE_MESSAGE, (data) => {
            const device: IDevice = this.get(device_cache_key(data.device.id));
            if (!device) {
                console.warn('device message: cant find device in cache ' + data.name);
                return;
            }

            const instance = device.instance;
            const message = data.data;
            const debugStrangers = true;
            if (message == null) {
                debugStrangers && console.warn('onDeviceServerMessage: abort, no message data');
                return;
            }
            let messages = [];
            if (lodash.isString(message)) {
                messages = instance.split(message);
            } else if (lodash.isObject(message)) {
                clear(message);
                messages = [message];
            }

            const deviceMessages = messages;

            let _messages = instance.onMessageRaw({
                device: device,
                message: message,
                bytes: data.bytes
            });

            if (_messages && !_messages.length) {
                _messages = null;
            }

            let bytes = [];

            for (let i = 0; i < messages.length; i++) {
                bytes.push(utils.stringToBuffer(messages[i]));
            }

            if (_messages && _messages.length) {
                messages = [];
                bytes = [];
                for (let j = 0; j < _messages.length; j++) {
                    const msg = _messages[j];
                    messages.push(msg.string);
                    bytes.push(msg.bytes);
                }
            }

            const current = device.subject.getValue();
            if (messages) {
                device.emit(EVENTS.ON_DEVICE_MESSAGE, {
                    messages: messages,
                    bytes: bytes,
                    raw: {
                        message: message,
                        bytes: data.bytes
                    }
                })
            }

            if (messages && messages.length) {
                for (let k = 0; k < messages.length; k++) {
                    const _message = messages[k];
                    //driver replay as individual message
                    instance.onMessage({
                        device: device,
                        message: _message,
                        raw: message,
                        bytes: bytes[k]
                    });

                    //driver replay as broadcast message
                    instance.onBroadcastMessage({
                        device: device,
                        message: _message,
                        raw: message,
                        bytes: bytes[k]
                    });

                }
            }
            // console.log('on device message', device, data);
        })
    }
}
