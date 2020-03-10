import { Model } from './Model';
import { DRIVER_FLAGS } from '../types';
import { EventEmitter } from 'events';

export enum RETRY_MODE {
    ABORT = 1,
    INTERVAL = 2,
    ABORT_AFTER_TRIALS = 3
}

export interface RETRY_SETTINGS {
    mode: RETRY_MODE
    interval: number
    value: number
    counter: number
}

export interface COMMAND_SETTINGS {
    start: string;
    end: string;
    interval: number;
    timeout: number;
    sendMode: number;
    onReply: string;
}

export enum RESPONSE_MODE {
    PER_BYTE = 1,
    PER_PACKET = 2,
    DELIMITER = 3,
    COUNT = 4
}
export interface RESPONSE_SETTINGS {
    start: boolean;
    startString: string;
    delimiter: string;
    responseMode: RESPONSE_MODE,
    count: number
}

export const DefaultRetry = () => {
    return {
        mode: RETRY_MODE.ABORT_AFTER_TRIALS,
        interval: 3000,
        value: 3,
        counter: 0
    }
}

export const responseSettings = (): RESPONSE_SETTINGS => {
    return {
        start: false,
        startString: '',
        responseMode: RESPONSE_MODE.DELIMITER,
        delimiter: '',
        count: 10
    }
}

export const DefaultCommandSettings = (): COMMAND_SETTINGS => {
    // tslint:disable-next-line:no-object-literal-type-assertion
    return {
        start: '',
        end: '0x0d',
        timeout: 100,
        sendMode: 0,
        interval: 100,
        onReply: ''
    } as COMMAND_SETTINGS
}

export const DefaultBlocks = () => [];

export const DefaultSettings = () => {
    return {
        start: false,
        startString: '',
        responseMode: RESPONSE_MODE.DELIMITER,
        count: 0,
        delimiter: '0x0d'
    }
}

export enum DEVICE_FLAGS {
    NONE = 0,
    /**
     * Mark the driver for "server side"
     */
    RUNS_ON_SERVER = 2,
    /**
     * Enable protocol's debug message on console
     */
    DEBUG = 4,
    /**
     * Enable protocol's debug message on console
     */
    SERVER = 16
};

export class DeviceInfo {
    host: string;
    port: number | string;
    protocol: string;
    driver?: string;
    driverId?: string;
    driverScope?: string;
    id?: string;
    devicePath?: string;
    deviceScope?: string;
    title?: string;
    options?: string;
    enabled?: boolean;
    driverOptions?: DRIVER_FLAGS;
    serverSide?: boolean;
    isServer?: boolean;
    responseSettings?: ResponseSettings;
    source?: string;
    user_devices?: string;
    system_devices?: string;
    system_drivers?: string;
    user_drivers?: string;
    loggingFlags?: string;
    hash?: string;
    userDirectory?: string;
}

export interface ResponseSettings {
    start: boolean;
    startString: string;
    cTypeByte: boolean;
    cTypePacket: boolean;
    cTypeDelimiter: boolean;
    cTypeCount: boolean;
    delimiter: string;
    count: string;
    wDelimiter: string;
    wCount: string;
}
export enum DEVICE_STATE {
    NONE = 'None',
    CONNECTING = 'DeviceIsConnecting',
    CONNECTED = 'DeviceIsConnected',
    SYNCHRONIZING = 'DeviceIsSynchronizing',
    READY = 'DeviceIsReady',
    DISCONNECTED = 'DeviceIsDisconnected',
    DISABLED = 'DeviceIsDisabled',
    UNREACHABLE = 'DeviceIsUnreachable',
    REFUSING = 'DeviceIsRefusing',
    LOST_DEVICE_SERVER = 'LostDeviceServerConnection'
};

/*
export class Device extends Model {
    name: string = 'test';
    state: DEVICE_STATE = DEVICE_STATE.DISCONNECTED;
}
*/
const b = {
    "host": "192.168.1.37",
    "port": "22",
    "protocol": "ssh",
    "driver": "SSH/Maintenance-SSH.js",
    "driverId": "b08405ac-a878-351f-7bab-f4174de7e669",
    "driverScope": "user_drivers",
    "id": "83a2e4ab-27b0-6c89-23c9-743ad6c40031",
    "devicePath": "SSH-Servers/SSH-Local.meta.json",
    "deviceScope": "user_devices",
    "title": "SSH-Local",
    "options": "{\n  \"username\": \"mc007\",\n  \"password\": \"213,,asd\",\n  \"localhostName\": \"\",\n  \"tryKeyboard\": false,\n  \"keepaliveInterval\": 0,\n  \"keepaliveCountMax\": 3,\n  \"readyTimeout\": 11102,\n  \"strictVendor\": true\n}",
    "enabled": true,
    "driverOptions": 0,
    "serverSide": false,
    "isServer": false,
    "responseSettings": {
        "start": false,
        "startString": "",
        "cTypeByte": false,
        "cTypePacket": false,
        "cTypeDelimiter": true,
        "cTypeCount": false,
        "delimiter": "",
        "count": "",
        "wDelimiter": "\\r",
        "wCount": ""
    },
    "source": "ide",
    "user_devices": "/PMaster/projects/x4mm/user/devices",
    "system_devices": "/PMaster/projects/x4mm/data/system/devices",
    "system_drivers": "/PMaster/projects/x4mm/data/system/drivers",
    "user_drivers": "/PMaster/projects/x4mm/user/drivers",
    "loggingFlags": "{\n  \"Response\": 51,\n  \"Send Command\": 49\n}",
    "hash": "9db2fc2f5e446f9e7ac21038ffd7afb3",
    "userDirectory": "/PMaster/projects/x4mm/user"

}

export class Device extends EventEmitter {
    state: DEVICE_STATE = DEVICE_STATE.DISCONNECTED;
    name: string = '';
}
