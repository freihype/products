import { Device } from '../../shared';
export const Devices = () => {
    const ret: any[] = [];
    ['Marantz', 'Loop'].forEach((name) => {
        const d = new Device();
        d.name = name;
        ret.push(d);
    });
    return ret;
};
