export enum EventFields {
    TYPE_FIELD = 'type',
    VIEWID_FIELD = 'viewId',
    PARENTEVIEWID_FIELD = 'parentViewId',
    ISIFRAME_FIELD = 'isIframe',
    TIME_FIELD = 'time',
    TABID_FIELD = 'tabId',
    USERAGENT_FIELD = 'userAgent',
    DURATION_FIELD = 'duration',
    URL_FIELD = 'url',
    SEQUENCENO_FIELD = 'sequenceNo',
    VALUE_FIELD = 'value',

    WIDTH_FIELD = 'width',
    HEIGHT_FIELD = 'height',
    ORIENTATION_FIELD = 'orientation',

    FRAME_VALUE = 'frame',

    EVENT_TYPE_FRAME_VALUE = 'frame',
    EVENT_TYPE_MOVE_VALUE = 'move',
    EVENT_TYPE_RESIZE_VALUE = 'resize',
    EVENT_TYPE_VIEW_VALUE = 'view',
    EVENT_TYPE_CLICK_VALUE = 'click',
    EVENT_TYPE_GESTURE_VALUE = 'gesture'
}

const compare = (x: number, y: number): number => {
    return (x < y) ? -1 : ((x === y) ? 0 : 1);
};
/*
const hash = 0;
const hashCode = (value: string) => {
    let h = hash;
    if (h === 0 && value.length > 0) {
        let val[] = value;

        for (int i = 0; i < value.length; i++) {
            h = 31 * h + val[i];
        }
        hash = h;
    }
    return h;
}*/

class BaseEntityImpl {
}

export class SessionReplayEvent {

    private type: string;
    private time: number;
    private payload: any;
    private timeAbs: string;
    constructor(type, time, payload, timeAbs) {
        this.type = type;
        this.time = time;
        this.payload = payload;
        this.timeAbs = timeAbs;
    }

    public getType() {
        return this.type;
    }

    public getTime() {
        return this.time;
    }

    public getPayload() {
        return this.payload;
    }
}

interface UITimeframe {
    getStartTime();
    getEndTime();
}

class VisualReplayBaseEntity {
    private baseEntityImpl: BaseEntityImpl;

    public getBaseEntity() {
        return this.baseEntityImpl;
    }

    // @JsonIgnore
    public getBaseEntityImpl() {
        if (this.baseEntityImpl === null) {
            this.baseEntityImpl = new BaseEntityImpl();
        }
        return this.baseEntityImpl;
    }

    public getTimeframes(): Map<String, UITimeframe> {
        return null;
    }
}

export class VisualEvent {
    public viewId: string;
    public type: string;
    public time: number;
    public duration: number;
    public sequenceNo: number;
    public payload: any;
    public tabId: string;
    public timeAbs: string;
    public times: any;

    constructor(
        viewId,
        type,
        time,
        duration,
        sequenceNo,
        payload,
        tabId, times?) {

        this.viewId = viewId;
        this.type = type;
        this.time = time;
        this.duration = duration;
        this.sequenceNo = sequenceNo;
        this.payload = payload;
        this.tabId = tabId;
        const d = new Date(this.time);
        this.timeAbs = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
        this.times = times;
    }

    public getViewId() {
        return this.viewId;
    }

    public getType() {
        return this.type;
    }

    public getTime() {
        return this.time;
    }

    public getDuration() {
        return this.duration;
    }

    public getSequenceNo() { return this.sequenceNo; }

    public getPayload() {
        return this.payload;
    }

    public getTabId() {
        return this.tabId;
    }

    public getEnd() {
        return this.time + this.duration;
    }

    public compareTo(o: VisualEvent) {
        const isEqualObj = this.type === o.type;
        if (this.equals(o)) {
            return 0;
        } else if (this.time === o.time && !isEqualObj) {
            return 1;
        } else {
            return compare(this.time, o.getTime());
        }
    }

    public equals(obj: any) {
        if (obj === null) {
            return false;
        }

        // if (getClass() != obj.getClass()) {
        //    return false;
        // }

        const event: VisualEvent = obj as VisualEvent;
        return this.viewId === event.viewId && this.time === event.time && this.type === event.type;
    }

    /*
    public int hashCode() {
        const result = type.hashCode();
        result = 31 * result + viewId.hashCode();
        result = 31 * result + Objects.hashCode(time);
        return result;
    }
    */

    /*
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("replayElement {")
            .append("viewId: ").append(viewId)
            .append(", type: ").append(type)
            .append(", time: ").append(time)
            .append(", duration: ").append(duration)
            .append(", sequenceNo: ").append(sequenceNo)
            .append(", payload: ").append(payload)
            .append(", tabId: ").append(tabId);
        return sb.toString();
    }
    */
}
class SessionReplayEventsRecord {

    private replayEvents: VisualEvent[] = [];

    protected merge(record: SessionReplayEventsRecord) {
        if (record !== null) {
            this.replayEvents.concat(record.getReplayEvents());
        }
    }

    public getReplayEvents() {
        return this.replayEvents;
    }

    addReplayEvent(visualEvent: VisualEvent) {
        if (visualEvent !== null) {
            this.replayEvents.push(visualEvent);
        }
    }
}

export class SessionReplayEvents extends VisualReplayBaseEntity {

    private start: number;
    private end: number;
    private events: SessionReplayEvent[] = [];

    public getStart() {
        return this.start;
    }

    public setStart(start) {
        this.start = start;
    }

    public getEnd() {
        return this.end;
    }

    public setEnd(end) {
        this.end = end;
    }

    public getEvents() {
        return this.events;
    }
}
