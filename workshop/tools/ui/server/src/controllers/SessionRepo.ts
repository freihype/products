import { Repo } from '../database/Repository';
import { Session, SessionStatus } from '../entities/Session';
import * as log from '../log';
import { Repository } from 'typeorm';

let sessionPending = {

};

export class SessionRepo {
    connection: Repo;
    public async createSession(session: string, referer: string, visit: string) {

        if (sessionPending[session]) {
            // console.log('already in request ' + session);
            return sessionPending[session];
        }
        const promise = new Promise((resolve, reject) => {
            this.getSession(session).then((sessioninDB) => {
                if (sessioninDB) {
                    return resolve(sessioninDB);
                }
                this.getRepo().then((repo) => {
                    if (!repo) {
                        log.error('no repo!');
                        return null;
                    }

                    const s = new Session();
                    s.session = session;
                    s.visit = visit;
                    s.referer = referer;
                    log.warn('create new session : ' + session, ' visit = ' + visit + ' ts : ' + Date.now());
                    repo.save(s).then((sessionInDB2) => {
                        // console.log('resolved session ' + session);
                        delete sessionPending[session];
                        resolve(sessionInDB2);
                    });
                });
            });
        });

        sessionPending[session] = promise;
        return promise;
    }

    public async getRepo(): Promise<Repository<Session>> {
        if (!this.connection) {
            log.error('have no connection');
            return null;
        }
        return await this.connection.getRepository(Session);
    }
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
    public async closeSession(id: string) {
        let sessioninDB = await this.getSession(id);
        if (!sessioninDB) {
            log.error('close session : invalid session id ' + id);
            return;
        }
        sessioninDB.status = SessionStatus.CLOSED;
        const repo = await this.getRepo();
        await repo.save(sessioninDB);
    }
}
