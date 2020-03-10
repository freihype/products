import { Inject } from 'typescript-ioc';
import { GET, Path, PathParam, QueryParam } from 'typescript-rest';
import { Repo } from '../database/Repository';
import { Session } from '../entities/Session';
const randomAvatar = require('random-avatar');
import { config } from './config';
import { toRawEvents, filterByType } from './EventsModel';
import { firstOf, lastOf } from '../common/array';
import { SessionRepo } from './SessionRepo';
import { randomIp } from './ip';
import { default as http } from 'axios';
import * as R from 'ramda';
const API_KEY = '2b39f9a2e175cd8db8a9e512813f3576';
import * as get from 'get-value';
import { createSessionId } from './utils';
import * as Queue from 'promise-queue';
import { randomName, randomEmail, randomBrowser, randomIsMobile, randomOS } from './random';
const API_URL = (ip) => `http://api.ipstack.com/${ip}?access_key=${API_KEY}`;
let repo;
const addIf = (where, what) => {
    // tslint:disable-next-line:triple-equals
    if (what != null && where.indexOf(what) === -1) {
        if (typeof what === 'string' && what.length > 0) {
            where.push(what);
        }
    }
};

const mapSessions = (sessions: Session[]) => {
    const ret: any = {};
    const values = {
        'tags.location.country_name': [],
        'tags.location.continent_name': [],
        'tags.user': [],
        'tags.email': [],
        'pages': [],
        'referer': [],
        'tags.agent.family': [],
        'tags.agent.os.family': [],
        'errorMessages': [],
        'tags.ip': []
    };
    ret.sessions = sessions.map((s) => {
        const events = toRawEvents(s.events);
        const pages = filterByType('view', events).map((v) => v.payload.url);
        const tags = JSON.parse(s.tags);
        const errors = filterByType('error', events);

        addIf(values['tags.location.country_name'], get(tags, 'location.country_name'));
        addIf(values['tags.location.continent_name'], get(tags, 'location.continent_name'));
        addIf(values['tags.user'], get(tags, 'user'));
        addIf(values['tags.email'], get(tags, 'email'));
        addIf(values['referer'], s.referer);
        addIf(values['tags.agent.family'], get(tags, 'agent.family'));
        addIf(values['tags.agent.os.family'], get(tags, 'agent.os.family'));
        addIf(values['tags.ip'], get(tags, 'ip'));

        const errorMessages = R.uniq(errors.map((e) => e.payload.info.message));
        values['errorMessages'] = errorMessages;
        pages.forEach((p) => {
            addIf(values['pages'], p);
        });

        return {
            session: s.session,
            status: s.status,
            referer: s.referer,
            visit: s.visit,
            eventsRaw: `${config.api}views/raw/${s.session}`,
            viewsRaw: `${config.api}views/raw/${s.session}?types=view`,
            events: `${config.api}views/events/${s.session}?parse=true&parseMutations=false&convert=true`,
            eventsNoPayload: `${config.api}views/events/${s.session}?parse=true&parseMutations=false&convert=true&hide=payload`,
            eventsSmall: `${config.api}views/events/${s.session}?parse=true&parseMutations=false&convert=true&hide=payload&types=view|frame|click|resize`,
            start: firstOf(events).time,
            end: lastOf(events).time,
            views: `${config.api}views/list/${firstOf(events).time}x${lastOf(events).time}x${s.visit}?hide=duration|sequenceNo`,
            clicks: filterByType('click', events).length,
            moves: filterByType('move', events).length,
            inputs: filterByType('input', events).length,
            viewCount: filterByType('view', events).length,
            errors: errors.length,
            errorMessages,
            duration: (lastOf(events).time - firstOf(events).time) / 1000,
            tags: tags,
            pages: pages
        };
    });
    ret.values = values;
    return ret;
};
async function addLocation(session) {
    return http.get(API_URL(session.ip)).then((d) => {
        session.tags.location = d.data;
    });
}
async function updateLocation(session) {
    const tags = JSON.parse(session.tags);
    // if (!tags.ip) {
    tags.ip = randomIp();
    // }
    return http.get(API_URL(tags.ip)).then((d) => {
        tags.location = d.data;
        session.tags = JSON.stringify(tags);
        repo.save(session);
        return session;
    });
}

async function createNewSession(sessionIn) {
    const newSession = new Session();
    newSession.session = createSessionId();
    const tags = JSON.parse(sessionIn.tags);
    tags.ip = randomIp();
    tags.user = randomName();
    tags.email = randomEmail();
    tags.agent.family = randomBrowser();
    tags.agent.mobile = randomIsMobile();
    tags.agent.os.family = randomOS();
    tags.avatar = 'https://' + randomAvatar({
        email: tags.email
    });
    newSession.events = sessionIn.events;
    const loc = await http.get(API_URL(tags.ip));
    tags.location = loc.data;
    newSession.tags = JSON.stringify(tags);
    await repo.save(newSession);
    return newSession;
}

async function massCreate(session, nb) {
    const maxConcurrent = 1;
    const maxQueue = Infinity;
    const storeQueue = new Queue(maxConcurrent, maxQueue);

    for (let i = 0; i < nb; i++) {
        storeQueue.add(() => createNewSession(session));
    }

}
async function updateSession(session) {
    return await repo.save(session);
}
const addLocations = (sessions) => {
    return Promise.all(sessions.map(addLocation));
};
@Path('/sessions')
export class SessionsController extends SessionRepo {
    @Inject
    connection: Repo;

    public async getSessions(visitor?: string) {
        const repo2 = await this.connection.getRepository(Session);
        if (!repo2) {
            console.error('getSessions:no repo!');
            return [];
        }

        let where = visitor ? {
            where: {
                visit: visitor
            }
        } : null;
        return await repo2.findAndCount(where);
    }

    @Path('raw/')
    @GET
    async sessionEventsRaw(@QueryParam('visitor') visitor: string) {
        let all = await this.getSessions(visitor);
        if (!all) {
            return {
                error: 'no such session '
            };
        }
        let ret = mapSessions(all[0]);
        return ret;
    }

    @Path('update/')
    @GET
    async update() {
        repo = await this.getRepo();
        let all = await this.getSessions();
        if (!all) {
            return {
                error: 'no such session '
            };
        }
        Promise.all(all[0].map(updateLocation));
        return all[0][0].tags;
    }

    @Path('mass/')
    @GET
    async mass(
        @QueryParam('session') sid: string,
        @QueryParam('number') nb: string) {
        repo = await this.getRepo();
        let session = await this.getSession(sid);
        if (!session) {
            return {
                error: 'no such session '
            };
        }
        massCreate(session, nb);
        return false;
        // Promise.all(all[0].map(updateLocation));
        // return all[0][0].tags;
    }

    @Path('remove')
    @GET
    async removeSession(@QueryParam('session') session: string) {
        const sessions = session.split(',');
        let repo2 = await this.getRepo();
        for (let i = 0; i < sessions.length; i++) {
            let sessioninDB = await this.getSession(sessions[i]);
            await repo2.delete(sessioninDB.id);
        }
        return true;
    }
}
