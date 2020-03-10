import { DeviceDto, Configuration } from './api2';
import { BehaviorSubject } from 'rxjs';
import { Block, Scope } from './xblox'
import { Socket } from './socket';
import { Rest } from './api/Rest';
import { PropertiesComponent } from './components/Properties';
import { Route, RouteComponentProps } from 'react-router-dom';
import { EventEmitter } from 'events';
import { mixin } from './shared/lib/objects';
import { DriverInstance } from './shared/driver/DriverInstance';

export type NavigationCallback = () => any;

export interface IContentHandler {
    open: (what: any) => Promise<any>;
}

export interface IDefaultProps2 {
    socket: Socket;
    apiConfig: Configuration;
    selectedId?: string;
    rest: Rest
}
/*
export class Device2 extends EventEmitter implements DeviceDto {
}
*/
// tslint:disable-next-line:interface-name
// tslint:disable-next-line:no-bitwise
// tslint:disable-next-line:no-unused-expression
export class IDevice extends DeviceDto {
    subject?: BehaviorSubject<DeviceDto>;
    scope: Scope;
    _userStopped: boolean;
    instance: DriverInstance;
    constructor(data) {
        super();
        mixin(this, data);
    }
}

export type Device = IDevice;

// tslint:disable-next-line:class-name
export interface COMMAND_SETTINGS {
    start: string;
    end: string;
    interval: number;
    timeout: number;
    sendMode: boolean;
    onReply: string;
}

export enum RESPONSE_MODE {
    cTypeByte = 1,
    cTypePacket = 2,
    cTypeDelimiter = 3,
    cTypeCount = 4
}

// tslint:disable-next-line:class-name
export interface RESPONSE_SETTINGS {
    start: boolean;
    startString: string;
    cTypeByte: boolean;
    cTypePacket: boolean;
    cTypeDelimiter: boolean;
    cTypeCount: boolean;
    mode: RESPONSE_MODE;
    delimiter: string;
    count: number
}
export interface IDefaultProps {
    socket?: Socket;
    apiConfig?: Configuration;
    handler?: any
    properties?: () => PropertiesComponent;
    selectedId?: string,
    type?: string;
    rest?: Rest;
    route?: () => Route;
    routeProps?: RouteComponentProps<any>;
    project?: () => number;
    page?: string;
};

export interface IConsoleHandler {
    onConsoleEnter: (val: string) => void;
    onConsoleClear: () => void;
    onChangeOptions: (options: any) => void;
    getCompletions: () => any[];
}
