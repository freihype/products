import { Inject } from 'typescript-ioc';
import { GET, Path, PathParam, QueryParam } from 'typescript-rest';
import { Repo } from '../database/Repository';
import { Session } from '../entities/Session';
import { EventFields, SessionReplayEvent, VisualEvent } from '../entities/SessionReplayEvents';
import Comparators from './comparators';
import { filterByType, removeParts, filterByTime, toRawEvents } from './EventsModel';
import { formatTime } from './utils';
import { SessionRepo } from './SessionRepo';
import { EVENTS_PAYLOAD_TYPE } from '../common/constants';

export const getView = (events: any[] | string) => {
    events = typeof events === 'string' ? JSON.parse(events) : events;
    let flat = [];
    events = (events as any[]).map((e: any) => {
        const payload =
            e.type === EVENTS_PAYLOAD_TYPE ?
                typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload :
                {
                    value: e.payload
                };

        return {
            ...e,
            payload
        };
    });
    events.forEach((e) => {
        flat = flat.concat(e.payload);
    });
    return flat.find((e) => e.type === 'view');
};

const toSessionReplayEvents = (events: VisualEvent[]) => {

    const ret: SessionReplayEvent[] = [];

    events.forEach((e) => {
        if (e.type !== 'frame') {
            if (e.type === 'error') {
                ret.push(new SessionReplayEvent(e.type, e.payload.ts, e.payload, e.timeAbs));
            } else {
                ret.push(new SessionReplayEvent(e.type, e.time, e.payload, e.timeAbs));
            }
        } else if (e.type === 'frame') {
            ret.push(new SessionReplayEvent(e.type, e.time, { value: '' }, e.timeAbs));
        }
    });

    return ret;
};

@Path('/timeline')
export class TimelineController extends SessionRepo {
    @Inject
    connection: Repo;

    @Path('events')
    @GET
    async sessionEvents(
        @QueryParam('session') session: string,
        @QueryParam('hide') hide: string = '',
        @QueryParam('types') types: string = '') {
        let sessioninDB = await this.getSession(session);
        if (!sessioninDB) {
            return { error: 'no such session ' + session };
        }

        let events = (sessioninDB as any).events as any[];
        // let view = getView(events);

        events = events.map((e) => {
            return {
                ...e,
                payload: e.type === EVENTS_PAYLOAD_TYPE ? e.payload : e.value
            };
        });

        events = toRawEvents((sessioninDB as any).events as any[]);
        // events = events.filter((e) => e.type !== 'frame');
        const raw = toSessionReplayEvents(events) as any[];
        let out = toSessionReplayEvents(events);

        out = removeParts(hide, out);
        out = filterByType(types, out);
        let tags;
        try {
            tags = JSON.parse(sessioninDB.tags);
        } catch (e) {
            tags = {};
        }
        return {
            id: sessioninDB.id,
            visitID: sessioninDB.visit,
            events: out,
            start: raw[0].time,
            end: raw[raw.length - 1].time,
            tags: tags
        };
    }
}
