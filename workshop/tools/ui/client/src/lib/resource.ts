import { default as http } from 'axios';
import { isDev } from '../env';

// currently resource urls have to be resolved for different scenarios:
// app - design time (yarn start)
// app - release mode (yarn build->static html): this is being controlled by the web-pack production mode config
// served via JSP iframe (using app - release mode)

// in release mode however, we don't need the './dist' prefix because the application is loaded from ./dist

const RESOURCE_PREFIX = isDev ? './dist/assets' : './assets'; // is set by web-pack env - plugin

const resource_path = (url: string) => `${RESOURCE_PREFIX}/${url}`;
const RESOURCE_CACHE = {};

// return resource body via http or false when error
export const getResource = async (url: string) =>
    http.get(resource_path(url))
        .then((response) => response.data)
        .catch(() => false);


export const resourceCached = async (what: string) => {
    return new Promise<string | boolean>((resolve, reject) => {
        if (what in RESOURCE_CACHE) {
            resolve(RESOURCE_CACHE[what]);
        } else {
            getResource(what).then((resource) => {
                if (!resource) {
                    reject(`Couldnt load HTML resource : ${resource}`)
                } else {
                    RESOURCE_CACHE[what] = resource;
                    resolve(resource);
                }
            })
        }
    });
}