import { Request } from 'express';
import { Inject } from 'typescript-ioc';
import { ContextRequest, GET, Path, PathParam, POST, QueryParam } from 'typescript-rest';
import { Beacon } from '../beacons/EventBeacon';
import { BeaconParser } from '../beacons/Parser';
import { Repo } from '../database/Repository';
import { SimpleHello, SimpleHelloType } from '../models/simple-model';
import { Session, SessionStatus } from '../entities/Session';
import { parse } from 'url';
import { getSessionId, createSessionId } from './utils';
import * as log from '../log';
import { SessionRepo } from './SessionRepo';
import * as Queue from 'promise-queue';
import * as userAgent from 'useragent';
import { EVENTS_PAYLOAD_TYPE, MUTATIONS_PAYLOAD_TYPE, SESSION_STATE_V3_KEY_SESSION_ID } from '../common/constants';

const STORE_BEACONS = true;
const DEBUG_REQUEST = false;
const DEBUG_CORE = true;
const CHECK_SESSION_CLOSED = true;
const DEBUG_TYPE = true;

const defaultResponse = (sessionId: string) => {
    const cookiepart = encodeURIComponent(`=3=${SESSION_STATE_V3_KEY_SESSION_ID}=${sessionId}=id:e84cefa5042eef39=1=ox=0=perc=100000=mul=1`);
    return `OK(BF)|srC=${cookiepart}|name=ruxitagent|featureHash=ICA23QSVfqrtu|buildNumber=10159181203155412|lastModification=1543849470229`;
    // return `OK(BF)|dtCookie=%3D3%3Dsrv%3D1%3Dsn%3D${sessionId}%3Dapp%3Ae84cefa5042eef39%3D1%3Dapp%3Ab8b1100decb60998%3D1%3Dol%3D0%3Dperc%3D100000%3Dmul%3D1|name=ruxitagent|featureHash=ICA2QSVfqr|buildNumber=10159181123110056|lastModification=1543154759195`;
};

const maxConcurrent = 1;
const maxQueue = Infinity;
const beaconStoreQueue = new Queue(maxConcurrent, maxQueue);

const browserTag = (request: Request) => {

    const ua = request.headers['user-agent'] as string;
    const agent = userAgent.parse(ua || '');
    return {
        ...agent,
        mobile: /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(ua) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4)),
        os: agent.os
    };
};

/**
 * This is a demo operation to show how to use typescript-rest library.
 */
@Path('/bf6')
export class BeaconForwarder6 extends SessionRepo {
    @Inject
    connection: Repo;

    public storeBeacon(beacon: Beacon, session: string, visitID: string, referer: string, tags: string = '', request: Request): Promise<Session> {
        return new Promise((resolve) => {
            this.getRepo().then((repo) => {
                if (!repo) {
                    log.error('no repo!');
                    return null;
                }

                const save = (sessionToSave) => {
                    let events = typeof sessionToSave.events === 'string' ? JSON.parse(sessionToSave.events) : sessionToSave.events;
                    (events as any).push(beacon);
                    sessionToSave.events = JSON.stringify(events);

                    let sessionTags = sessionToSave.tags;
                    try {
                        sessionTags = JSON.parse(sessionTags);
                    } catch (e) {
                        sessionTags = {};
                    }

                    let newTags = {};
                    try {
                        newTags = JSON.parse(decodeURIComponent(tags));
                    } catch (e) {
                        newTags = {};
                    }

                    let tagsString = '';
                    try {
                        tagsString = JSON.stringify(sessionTags = {
                            ...sessionTags,
                            ...newTags,
                            ... {
                                agent: browserTag(request),
                                ip: request.headers['x-forwarded-for'] || request.connection.remoteAddress
                            }
                        });
                    } catch (e) {
                        tagsString = '';
                    }

                    sessionToSave.tags = tagsString;

                    try {
                        repo.save(sessionToSave).then((savedSession) => {
                            resolve(savedSession);
                        });
                    } catch (e) {
                        log.error('error saving beacon', e);
                    }
                };

                this.getSession(session).then((sessioninDB) => {
                    if (!sessioninDB) {
                        this.createSession(session, referer, visitID).then((sessionInDB2) => {
                            save(sessionInDB2);
                        });
                    } else {
                        save(sessioninDB);
                    }
                });
            });
        });

    }

    @Path('signal/?')
    @POST
    async signal(
        @ContextRequest request: Request,
        @QueryParam('s') session: string,
        @QueryParam('v') visitID: string,
        @QueryParam('t') contentType: string,
        @QueryParam('r') referer: string,
        @QueryParam('f') tags: string = '',
        @QueryParam('ms') start: number = 0,
        @QueryParam('me') end: number = 0,
        @QueryParam('sn') seq: number = 0,
        @QueryParam('c') compressed: boolean = true) {

        const sessionIn = decodeURIComponent(session);
        if (sessionIn && sessionIn.indexOf('$') !== -1) {
            session = sessionIn.substring(sessionIn.indexOf('$') + 1, sessionIn.length);
        } else {
            session = getSessionId(decodeURIComponent(parse(request.url).query as string));
        }
        if (!session && sessionIn.indexOf(`${SESSION_STATE_V3_KEY_SESSION_ID}=`) !== -1) {
            session = getSessionId(sessionIn);
        }

        let sessioninDB = await this.getSession(session);
        if (sessioninDB && sessioninDB.status === SessionStatus.CLOSED && CHECK_SESSION_CLOSED) {
            session = createSessionId();
            log.error(`session ${session} is already closed, change to ${session}`);
            return defaultResponse(session);
        }

        DEBUG_TYPE && log.debug('2. Session in ' + session + ' cType = ' + contentType);
        if (!session || session === 'null') {
            session = createSessionId();
            log.log('have no session id ! ' + contentType, ' new session id : ' + session);
        }
        DEBUG_REQUEST && log.log('request', {
            url: decodeURIComponent(request.url),
            query: request.query,
            cookies: request.cookies,
            session: session,
            visitID: visitID,
            contentType: contentType
        });

        let beacon: Beacon;
        let sessionClosed = false;
        if (contentType === EVENTS_PAYLOAD_TYPE) {
            beacon = BeaconParser.parseEvent(request.body);
        } else if (contentType === MUTATIONS_PAYLOAD_TYPE) {
            beacon = BeaconParser.parseBinary(request.body, request.headers['user-agent'] === 'cli', compressed, start, end, seq);
        } else {
            DEBUG_CORE && log.log('core beacon : ', session, visitID, decodeURIComponent(request.body));
            const decodedBody = decodeURIComponent(request.body);
            if (decodedBody.includes('end')) {
                DEBUG_CORE && console.log('end session ! ' + session);
                setTimeout(() => {
                    STORE_BEACONS && this.closeSession(session);
                    log.log('close session ' + session);
                    sessionClosed = true;
                }, 2000);
                session = createSessionId();
                return defaultResponse(session);

            }
        }
        if (!beacon && (contentType === EVENTS_PAYLOAD_TYPE || contentType === MUTATIONS_PAYLOAD_TYPE)) {
            log.error('couldnt create beacon for ' + contentType);
            return false;
        }
        if (beacon && STORE_BEACONS && !sessionClosed) {
            try {
                beaconStoreQueue.add(() => this.storeBeacon(beacon, session, visitID, referer, tags, request));
            } catch (e) {
                log.error('error storing beacon : ' + contentType, e);
            }
        }
        /*
        if (beacon && DEBUG_VIEW) {
            sessioninDB = await this.getSession(session);
            if (sessioninDB) {
                log.inspect('view', getView(sessioninDB.events));
            } else {
                log.error('debug view : cant get session ' + session);
            }
        }
        // sessioninDB = await this.getSession(session);
        if (!sessioninDB) {
            log.error('end: invalid session! ');
        }
        */
        return defaultResponse(session);
    }
    /**
     * Send a list of objects with greeting message.
     * @return Array<SimpleHello> simple array of objects
     */
    @GET
    sayArrayObjectHello(): Array<SimpleHello> {
        return [
            new SimpleHello('1'),
            new SimpleHello('2')
        ];
    }
    /**
     * Send a list of typed objects with greeting message.
     * @param name The name that will receive our greeting message
     * @param typeName The typeName that will receive our greeting message
     * @return SimpleHelloType simple hello object
     */
    @Path(':name/types/:typeName')
    @GET
    saySimpleHelloType(@PathParam('name') name: string, @PathParam('typeName') typeName: string): SimpleHelloType {
        return new SimpleHello(name + '_' + typeName);
    }

    /**
     * Send a object with greeting message.
     * @param name The name that will receive our greeting message
     * @return SimpleHello simple hello object
     */
    @Path(':name')
    @GET
    sayObjectHello(@PathParam('name') name: string): SimpleHello {
        return new SimpleHello(name);
    }

    /**
     * Send a list of objects with greeting message wrapped in Promise
     * @param name The name that will receive our greeting message
     * @return Array<SimpleHello> simple array of objects
     */
    @Path(':name/promises')
    @GET
    sayArrayObjectPromiseHello(@PathParam('name') name: string): Promise<Array<SimpleHello>> {
        return new Promise((resolve) => {
            resolve([
                new SimpleHello(name + '1'),
                new SimpleHello(name + '2')
            ]);
        });
    }

    /**
     * Send a object with greeting message wrapped in Promise
     * @param name The name that will receive our greeting message
     * @param promiseName The promiseName that will receive our greeting message
     * @return SimpleHello simple hello object
     */
    @Path(':name/promises/:promiseName')
    @GET
    sayObjectPromiseHello(@PathParam('name') name: string, @PathParam('promiseName') promiseName: string): Promise<SimpleHello> {
        return new Promise((resolve) => {
            resolve(new SimpleHello(name + '_' + promiseName));
        });
    }
}
