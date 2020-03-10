import { default as http } from 'axios';
import { parse } from 'url';
import { getConfig } from '../../config';
const parsed = parse(location.href);
const config = {
    API_URL2: `${parsed.protocol.replace(':', '')}://${parsed.hostname}:3000`,
    API_URL: `https://${parsed.hostname}:8443`
}

const endPoint = (slug: string) => {
    const sr = window['sessionReplay'];
    if (sr && sr.config && sr.config.router && sr.toUrl) {
        return sr.toUrl(slug);
    }
    return `${config.API_URL}/${slug}`;
}
export class SessionAPI {
    public static async sessions(visitor?: string) {
        return http.get(endPoint('sessions/raw'), {
            params: {
                visitor: visitor
            }
        }).then((response) => response.data);
    }

    public static async views(session: string, start, end) {
        return http.get(endPoint(`views/list`), {
            params: {
                hide: 'duration|sequenceNo',
                start,
                end,
                session
            }
        }).then((response) => response.data);
    }

    public static async events(session: string, start) {
        return http.get(endPoint(`views/events`), {
            params: {
                parse: true,
                parseMutations: false,
                convert: true,
                session: session,
                start: start
            }
        }).then((response) => response.data);
    }

    public static async timeline(session: string) {
        return http.get(endPoint(`timeline/events`), {
            params: {
                types: 'input|move|click|view|scroll|error',
                session: session
            }
        }).then((response) => response.data);
    }

    public static async configSave(config: any) {
        return http.post(endPoint(`config/save`), config).then((response) => response.data);
    }
    public static async configGet() {
        if (getConfig('hasConfig') !== true) {
            return http.get(endPoint(`config/get`)).then((response) => response.data);
        } else {
            return Promise.resolve(getConfig('config'));
        }
    }

    public static async removeSession(session: string) {
        return http.get(endPoint(`sessions/remove`), {
            params: {
                session
            }
        });
    }
}