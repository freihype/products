import { Configuration, DevicesApi, DeviceDto, ProjectsApi } from '../api2';
import { Observable, Subject, ReplaySubject, BehaviorSubject } from 'rxjs';
import { IDevice } from '../types';
import { Scope } from '../xblox';
import { DriverInstance } from '../shared/driver/DriverInstance';
export class Rest {
    public devices: DevicesApi;
    public projects: ProjectsApi;
    private _cache: any = {
        devices: null
    }
    constructor(apiConfig?: Configuration) {
        this.devices = new DevicesApi(apiConfig);
        this.projects = new ProjectsApi(apiConfig);
    }
    public cache(key, objects: any) {
        this._cache[key] = objects;
    }
    public get(key: string) {
        return this._cache[key];
    }
    public getDevices(project?: number) {
        return new Promise((resolve, reject) => {
            if (this.get('devices')) {
                // return resolve(this.get('devices'));
            }
            this.devices.apiDevicesGet(project).then((data) => {
                let { devices } = data;
                const ret = devices.map((d) => {
                    const device = new IDevice(d);
                    (device as IDevice).subject = new BehaviorSubject(device);
                    return (device as IDevice).subject;
                });
                //this.cache('devices', ret);
                resolve(ret);
            })
        });
    }

    public deviceList(project?: number) {
        return new Promise((resolve, reject) => {
            this.devices.apiDevicesGet(project).then((data) => {
                resolve(data);
            })
        });
    }
}
