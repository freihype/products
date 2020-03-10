import { Observable, Subject, ReplaySubject } from 'rxjs';
import { Devices } from './data';
import { Device, DEVICE_STATE } from '../../shared';
const update = () => { console.log('tes'); }
import {
    GroupedList,
    IGroup
} from 'office-ui-fabric-react/lib/components/GroupedList/index';

const rs = new ReplaySubject();
rs.next('1');
rs.next('2');

const data = Devices();

const map = (devices: Device[]) => {
    return devices.map((d: Device, index: number) => {
        return {
            key: 'item-' + (index),
            name: d.name,
            description: 'dfdf',
            location: 'df',
            model: d
        }
    });
}
export const items = map(data);
export const scenes = () => {
    const ret: any[] = [];
    ['Test', 'Test2'].forEach((name) => {
        const d = new Device();
        d.name = name;
        ret.push(d);
    });
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
    /*
    return Array.apply(null, Array(groupCount)).map((value: number, index: number) => {

        return {
            count: 2,
            key: 'group' + key + index,
            name: 'Devices',
            startIndex: index * count + startIndex,
            level: level,
            items: [],
            children: groupDepth > 1 ?
                createGroups(groupCount, groupDepth - 1, index * count + startIndex, itemsPerGroup, level + 1, key + index) : []
        };
    });
    */
    return [{
        count: 2,
        key: 'group' + key + 'd',
        name: 'Devices',
        startIndex: 0 * count + startIndex,
        level: level,
        children: groupDepth > 1 ?
            createGroups(groupCount, groupDepth - 1, 0 * count + startIndex, itemsPerGroup, level + 1, key + 0) : []
    },
    {
        count: 2,
        key: 'group' + key + 'd2',
        name: 'Scenes',
        startIndex: 0 * count + startIndex,
        level: 0,
        children: groupDepth > 1 ?
            createGroups(groupCount, groupDepth - 1, 0 * count + startIndex, itemsPerGroup, level + 1, key + 1) : []
    }
    ];
}
