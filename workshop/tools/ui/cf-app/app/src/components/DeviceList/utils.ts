import { Observable, Subject, ReplaySubject } from 'rxjs';
import { Devices } from './data';
import { DEVICE_STATE } from '../../shared';

const update = () => { console.log('tes'); }
import {
    GroupedList,
    IGroup
} from 'office-ui-fabric-react/lib/components/GroupedList/index';

const rs = new ReplaySubject();
rs.next('1');
rs.next('2');

const data = Devices();

export const to = (d: any, others: any[]) => {
    return {
        key: 'item-' + d.id,
        name: d.name,
        description: 'dfdf',
        location: 'df',
        model: d
    }
}

const map = (devices: any[]) => {
    return devices.map((d: any, index: number) => {
        return to(d, devices);
    });
}
export const items = map(data);
export const scenes = () => {
    const ret: any[] = [];
    return ret;
};
export const _items2 = map(scenes());
export function createGroups(
    groupCount: number,
    groupDepth: number,
    startIndex: number,
    itemsPerGroup: number,
    level: number = 0,
    key: string = ''): IGroup[] {
    if (key !== '') {
        key = key + '-';
    }
    let count = Math.pow(itemsPerGroup, groupDepth);
    return [{
        count: groupCount,
        key: 'group' + key + 'd',
        name: 'My Group',
        startIndex: 0 * count + startIndex,
        level: level
    }
    ];
}
