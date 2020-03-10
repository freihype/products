import { Inject } from 'typescript-ioc';
import { GET, Path, PathParam, QueryParam, ContextRequest, ContextResponse } from 'typescript-rest';
import { Repo } from '../database/Repository';
import { SessionReplayEvent, VisualEvent } from '../entities/SessionReplayEvents';
import { filterByType, removeParts, toRawEvents } from './EventsModel';
import { SessionRepo } from './SessionRepo';
import * as request from 'request';

@Path('/resource2')
export class ResourceController extends SessionRepo {
    @Inject
    connection: Repo;

    @GET
    async fetch(
        @ContextResponse res: request.Response,
        @QueryParam('url') url: string = '') {
        /*
    let r = await request.get(decodeURIComponent(url), {
        rejectUnauthorized: false,
        followAllRedirects: true
    });
    console.log('decode url', decodeURIComponent(url), r);
    return r;*/

        /*
            let r = request.get(decodeURIComponent(url), {
                rejectUnauthorized: false,
            }, (err, response2, body) => {
                // console.log('response : ', Promise.resolve(response2.body));
                // res.pipe(response2.body);
                return response2.body;
            });*/

        return new Promise((resolve, reject) => {
            let r = request.get(decodeURIComponent(url), {
                rejectUnauthorized: false
            }, (err, response, body) => {
                console.log('h', response.headers);
                // res.headers = response.headers;
                // res['content-type'] = response['content-type'];
                console.log('decode url', decodeURIComponent(url), res['contentLength']);
                const  t = '' + response['content-type'];
                res['contentType'](t);
                // res['contentType']('text/plain');
                resolve(body);
            });
        });
    }
}
