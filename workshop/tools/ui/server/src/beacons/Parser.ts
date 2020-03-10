import { Beacon } from './EventBeacon';
import * as log from '../log';
// tslint:disable-next-line:variable-name
const SnappyJS = require('snappyjs');
// import { decoder } from '../controllers/decoder';

export class BeaconParser {

    public static parseEvent(payload: any) {
        // const times = payload.match(/\d+/g);
        payload = JSON.parse(payload);
        return new Beacon(
            payload.v,
            payload.n,
            payload.s,
            payload.e,
            -1,
            payload.evts,
            'e'
        );
    }
    public static parseBinary(response: Buffer, isReplay: boolean, compressed: boolean, start, end, seq) {
        if (typeof response === 'string') {
            log.error('response is string !');
            response = new Buffer(response);
        }
        // const str = response.toString();
        // let times = str.match(/\d+/g);
        // let outimes = [times[0], times[1], times[2], times[3], times[4]];
        // let timesLength = new Buffer(outimes.join(',') + ',').byteLength;
        // let ob =  response.slice(timesLength, response.byteLength);
        let ob = response;
        let snappy;
        if (compressed) {
            if (isReplay) {
                ob = Buffer.from(ob.toString(), 'ascii');
            }
            try {
                snappy = SnappyJS.uncompress(ob);
            } catch (e) {

                log.error('error parsing binary buffer = ' + typeof ob);
                try {
                    ob = Buffer.from(ob.toString(), 'ascii');
                    snappy = SnappyJS.uncompress(ob);
                } catch (e) {
                    log.error('error  parsing binary buffer 2 = ' + typeof ob);
                }
                snappy = new Buffer('[]');
            }
        } else {
            snappy = ob;
        }
        return new Beacon(
            1, Date.now(), start, end, seq,
            snappy.toString('base64'),
            'b'
        );
    }
}
