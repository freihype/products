import moment = require('moment');
import { prop, head, tail, propOr, last } from 'ramda';
import { events } from '../ui/components/Player/mock/timeline';

export interface Event {
    type: EventType;
    time: number;
    payload: any;
}
export enum EventType {
    MOVE = 'move',
    INPUT = 'input',
    VIEW = 'view',
    FRAME = 'frame',
    CLICK = 'click',
    SCROLL = 'scroll',
    RESIZE = 'resize',
    ERROR = 'error'
}
export type Events = Event[];
export interface ISessionEvents {
    events: Events;
    start: number;
    end: number;
    id: number;
    visitID: string;
}
export const VISIBLE_EVENTS = 'view|click|input|resize|frame';

export const toMinutesString = (start, end) => {
    let x = moment(end / 60);
    let y = moment(start / 60);
    let duration = moment.duration(x.diff(y));
    let diff = Math.round(duration.asMinutes());
    if (diff >= 1) {
        return diff + ' minutes';
    } else {
        x = moment(end);
        y = moment(start);
        duration = moment.duration(x.diff(y));
        diff = Math.round(duration.asSeconds());
        return diff + ' seconds';
    }
}

export const filterByTime = (events: Events, start, end) =>
    events.filter((e) => e.time >= start && e.time <= end);

export const formatTime = (ts: number) => moment(ts).format('mm:ss');
export const formatDate = (ts: number) => moment(ts).format('MMM DD - HH:mm');

export const filterByType = (typesString: string = '', events: Events = []) => {
    let parts: string[] = typesString.split('|');
    return events.filter((e) => parts.indexOf(e.type) !== -1)
};

export const visibleEvents = (events: Events) =>
    filterByType('view|click|input|resize|frame|error', events);

export const eventAt = (relativeTime: number, events: Events = [], range: number) => {
    const nowInEvents = head(events).time + (relativeTime);
    return head(filterByTime(events, nowInEvents + (-1 * range), nowInEvents + range));
}
export const eventAtAbs = (absTime: number, events: Events = [], range: number) =>
    head(filterByTime(events, absTime + (-1 * range), absTime + range));

export const firstOf = (type: EventType, events: Events) => head(filterByType(type, events));

export const time = (event: Event) => prop('time', event);
export const type = (event: Event) => prop('type', event);
export const payload = (event: Event) => propOr({}, 'payload', event) as any;

export const coord = (event: Event) => {
    const { x, y } = payload(event); return { x, y }
}

export const nextEq = (e: Event, events: Events) => {
    events = filterByType(type(e), events)
    events = filterByTime(events, time(e) + 1, time(last(events)));
    return head(events);
}

export const relTime = (event: Event, events: Events) =>
    event.time - head(events).time;

export const distance = (a: Event, b: Event) =>
    Math.sqrt(Math.pow(a.payload.x - b.payload.x, 2) + Math.pow(a.payload.y - b.payload.y, 2));

export const distanceScrollRel = (a: Event, b: Event) =>
    Math.abs(payload(a).top - payload(b).top);

export const distanceMoves = (events: Events) =>
    filterByType('move', events).reduce((last, current, i, array) =>
        last + (array[i + 1] ? distance(current, array[i + 1]) : 0)
        , 0);

export const distanceScroll = (events: Events) =>
    filterByType('scroll', events).reduce((last, current, i, array) =>
        last + (array[i + 1] ? distanceScrollRel(array[i + 1], current) : 0)
        , 0);

// .............................
// ............xxx..............

export const eventAt2 = (time: number, events: Events) => events[0]

export const nextFrom = (now: number, events: any[]) => {
    return false;
}