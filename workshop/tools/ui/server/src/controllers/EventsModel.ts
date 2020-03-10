import { VisualEvent, EventFields } from '../entities/SessionReplayEvents';
import { formatTime } from './utils';
import Comparators from './comparators';
// import { debug, inspect } from '../log';
import { EVENTS_PAYLOAD_TYPE, MUTATIONS_PAYLOAD_TYPE } from '../common/constants';

export const filterByType = (typesString: string, events: any[]) => {
    if (!typesString) {
        return events;
    }
    let parts = typesString.split('|');
    return events.filter((e) => {
        return parts.includes(e.type);
    });
};

export const filterByTime = (events: any[], startTS, endTS) =>
    events.filter((e) => e.time >= startTS && e.time <= endTS);

export const removeParts = (partsString: string, events: any[]) => {
    if (!partsString) {
        return events;
    }
    let parts = partsString.split('|');
    events.forEach((e) => {
        parts.forEach((p) => {
            delete e[p];
        });
    });
    return events;
};

const eventPayload = (obj: any) => {
    const ret = {
        ...obj
    };

    [EventFields.VIEWID_FIELD, EventFields.TYPE_FIELD,
    EventFields.TIME_FIELD].forEach((f) => {
        delete ret[f];
    });
    return ret;
};

export const toRawEvents = (events: any, startTS: number = 0, includeTimes: boolean = false) => {

    events = typeof events === 'string' ? JSON.parse(events) : events;
    events = events || [];
    let ret: any[] = [];
    events.forEach((e) => {
        if (e.type === EVENTS_PAYLOAD_TYPE) {
            try {
                const payload = e.payload || [];
                (payload as any[]).forEach((evt: any) => {
                    const ve = new VisualEvent(startTS,
                        evt.type,
                        e.startTime + evt.time,
                        0,
                        -1,
                        eventPayload(evt),
                        evt.tabId,
                        includeTimes ? {
                            s: e.startTime,
                            sD: formatTime(e.startTime),
                            e: e.endTime,
                            eD: formatTime(e.endTime),
                            time: evt.time
                        } : null);

                    ret.push(ve);
                });
            } catch (error) {
                console.error('error parsing event payload!', error, e);
            }
        } else if (e.type === MUTATIONS_PAYLOAD_TYPE) {
            const ve = new VisualEvent(startTS,
                'frame',
                (e as any).startTime,
                0,
                (e as any).sequenceNumber,
                { value: Buffer.from(e.payload, 'base64').toString() },
                0,
                includeTimes ? {
                    s: e.startTime,
                    sD: formatTime(e.startTime),
                    e: e.endTime,
                    eD: formatTime(e.startTime),
                    time: e.time
                } : null);
            ret.push(ve);
        }
    });
    ret.sort(Comparators.comparing('time').thenComparing('sequenceNo'));
    return ret;
};
