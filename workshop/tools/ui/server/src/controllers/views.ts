import { Inject } from 'typescript-ioc';
import { GET, Path, PathParam, QueryParam } from 'typescript-rest';
import { Repo } from '../database/Repository';
import { Session } from '../entities/Session';
import { EventFields, SessionReplayEvent, VisualEvent } from '../entities/SessionReplayEvents';
import Comparators from './comparators';
import { filterByType, removeParts, filterByTime, toRawEvents } from './EventsModel';
import { formatTime } from './utils';
import { EVENTS_PAYLOAD_TYPE } from '../common/constants';
import { decoder } from './decoder';
const DEFAULT_RESPONSE = 'OK(BF)|dtCookie=%3D3%3Dsrv%3D1%3Dsn%3DE9I177CVF3OAE86VRSADRRCJL33FT1CA%3Dapp%3Ae84cefa5042eef39%3D1%3Dapp%3Ab8b1100decb60998%3D1%3Dol%3D0%3Dperc%3D100000%3Dmul%3D1|name=ruxitagent|featureHash=ICA2QSVfqr|buildNumber=10159181121170615|lastModification=1542877669194';
// http://localhost:8020/e/1/rest/sessionreplay/sessions/1542817032095x1542817164939xMMVDPGNHIHQJVJDUSDIKDWPVULCLSDTI/views?parts=replayviews&gtf=l_72_HOURS
// https://localhost:9999/bf/1?type=js&session=%3D3%3Dsrv%3D1%3Dsn%3DE9I177CVF3OAE86VRSADRRCJL33FT1CA%3Dapp%3Ae84cefa5042eef39%3D1%3Dapp%3Ab8b1100decb60998%3D1%3Dol%3D0%3Dperc%3D100000%3Dmul%3D1&svrid=1&flavor=cors&referer=http%3A%2F%2Fguenter-dev%3A8081%2F%3Fview%3Dkpi%26selected%3DAgentMemory&visitID=MMVDOCSSWFSPMJDUSCMVWCNXSCCLSDSM&contentType=srBm&modifiedSince=9999999999999&app=e84cefa5042eef39

export const getView = (events: any[] | string) => {
    events = typeof events === 'string' ? JSON.parse(events) : events;
    let flat = [];
    events = (events as any[]).map((e: any) => {
        const payload = e.type === EVENTS_PAYLOAD_TYPE ? typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload :
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
            ret.push(new SessionReplayEvent(e.type, e.time, e.payload, e.timeAbs));
        } else if (e.type === 'frame') {
            ret.push(new SessionReplayEvent(e.type, e.time, e.payload.value ? e.payload : { value: '' }, e.timeAbs));
        }
    });

    return ret;
};

@Path('/views')
export class ViewsController {
    @Inject
    connection: Repo;

    public async getSession(sessionOrVisit: string): Promise<Session> {
        const repo = await this.connection.getRepository(Session);
        if (!repo) {
            console.error('no repo!');
            return null;
        }

        let sessioninDB = await repo.findOne({ session: sessionOrVisit });
        if (!sessioninDB) {
            sessioninDB = await repo.findOne({ visit: sessionOrVisit });
        }
        return sessioninDB;
    }

    /**
     * @url sessions/1543486811270x1543486826031xCGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR/
     *
     * 1543486811270x1543486826031xCGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR
     *  start : 1543486811270
     *  end :   1543486826031
     *  visit : CGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR
     *
     * views?parts_replayviews=3561236e-a9cf-48ea-b82d-2c4d054754aa
     * &parts=replayviews&gtf=l_6_HOURS
     *
     * full : 1543486811270x1543486826031xCGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR/views?parts_replayviews=3561236e-a9cf-48ea-b82d-2c4d054754aa
     *
     * http://localhost:3000/views/raw/CGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR?types=view
     */
    @Path('raw/:session')
    @GET
    async sessionEventsRaw(@PathParam('session') session: string,
        @QueryParam('hide') hide: string = '',
        @QueryParam('types') types: string = '') {
        let sessionDB: any = await this.getSession(session);
        if (!sessionDB) {
            return {
                error: 'no such session ' + session
            };
        }
        let raw = toRawEvents((sessionDB as any).events as any[], 0, true);

        let events = removeParts(hide, raw);
        events = filterByType(types, events);
        events.sort(Comparators.comparing('time').thenComparing('sequenceNo'));
        return {
            session: sessionDB.session,
            visit: sessionDB.visit,
            sessionOrVisit: session,
            events
        };
    }
    /**
     * @url sessions/1543486811270x1543486826031xCGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR/
     *
     * 1543486811270x1543486826031xCGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR
     *  start : 1543486811270
     *  end :   1543486826031
     *  visit : CGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR
     *
     * views?parts_replayviews=3561236e-a9cf-48ea-b82d-2c4d054754aa
     * &parts=replayviews&gtf=l_6_HOURS
     *
     * full : 1543486811270x1543486826031xCGJTTXHPSWVBTXXKZHEVFMFFYUTURSNR/views?parts_replayviews=3561236e-a9cf-48ea-b82d-2c4d054754aa&
     * parts=replayviews&gtf=l_6_HOURS
     */
    @Path('list/')
    @GET
    async sessionViews(
        @QueryParam('start') start: number = 0,
        @QueryParam('end') end: number = 0,
        @QueryParam('session') visitId: string = '',
        @QueryParam('hide') hide: string = '',
        @QueryParam('debug') debug: boolean = false
    ) {
        // const sessionParts = parts.split('x');
        // const start = parseInt(sessionParts[0], 10),
        //    end = parseInt(sessionParts[1], 10),
        //    visitId = sessionParts[2];

        const sessioninDB = await this.getSession(visitId);
        if (!sessioninDB) {
            return {
                error: 1,
                message: `No such session ${visitId}`
            };
        }

        const views = (session: Session) => {
            let events = toRawEvents(session.events, 0, true);
            events = removeParts(hide, events);
            const viewsI = filterByType('view', events);
            // console.log('e', viewsI);
            return filterByTime(viewsI.sort(Comparators.comparing('time')), start, end).map((v) => {
                return {
                    ...v,
                    id: '' + v.times.s,
                    tabId: v.payload.tabId,
                    start: v.times.s,
                    end: v.times.e,
                    url: v.payload.url,
                };
            });
        };

        const updateTimes = (events: any[]) => {
            for (let i = 0; i < events.length; i++) {
                const next = events[i + 1];
                if (next) {
                    events[i].end = next.start;
                }
            }

            if (events && events[0]) {
                events[0].start = start;
                events[events.length - 1].end = end;
            } else {
                console.warn('weird, no events');
            }
            return events;
        };
        // console.log('--', views(sessioninDB as Session));
        if (debug) {
            let outEvents = removeParts('', views(sessioninDB as Session));
            updateTimes(outEvents);
            return {
                start: start,
                startAbs: formatTime(start),
                end: end,
                endAbs: formatTime(end),
                visitId: visitId,
                views: outEvents
            };
        } else {
            let outEvents = removeParts('times|payload|timeAbs|time|viewId', views(sessioninDB as Session));
            if (!outEvents) {
                console.error('invalid events !');
            } else {
                updateTimes(outEvents);
            }
            return {
                start: start,
                end: end,
                views: outEvents
            };
        }
    }

    @Path('events')
    @GET
    async sessionEvents(
        @QueryParam('session') session: string,
        @QueryParam('parse') parse: boolean = true,
        @QueryParam('convert') convert: boolean = true,
        @QueryParam('hide') hide: string = '',
        @QueryParam('types') types: string = '',
        @QueryParam('start') start: string = '',
        @QueryParam('parseMutations') parseMutations: boolean = false,
        @QueryParam('stats') stats: boolean = false) {



        let sessioninDB = await this.getSession(session);
        if (!sessioninDB) {
            return { error: 'no such session ' + session };
        }
        let events = (sessioninDB as any)['events'] as any[];
        let view = getView(events);
        if (!view) {
            console.log('have no view ! ');
            // return;
        }

        // console.log('start events : ' + start + ' = ' + view.viewId);

        if (parse) {
            events = events.map((e) => {
                return {
                    ...e,
                    payload: e.type === EVENTS_PAYLOAD_TYPE ? e.payload : e.value
                };
            });
            view && convert && (events = toRawEvents((sessioninDB as any).events as any[], parseInt(start, 10)));
        }
        const raw = toSessionReplayEvents(events) as any[];

        let out = convert ? toSessionReplayEvents(events) : events;
        if (parseMutations) {
            out = out.map((e) => {
                return {
                    ...e,
                    payload: e.type === 'frame' ? decoder(e.payload.value) : e.payload
                };
            });
        }

        out = removeParts(hide, out);
        out = filterByType(types, out);
        let statistics;
        if (stats) {
            statistics = {
                frames: filterByType('frame', raw).length,
                clicks: filterByType('click', raw).length,
                moves: filterByType('move', raw).length,
                inputs: filterByType('input', raw).length
            };
        }
        return {
            id: sessioninDB.id,
            visitID: sessioninDB.visit,
            events: out,
            start: raw[0].time,
            end: raw[raw.length - 1].time,
            statistics: statistics
        };
    }
}
