let DEFAULT_UPDATE_INTERVAL = 500;
let raf = require('raf');

import { EventEmitter } from 'events';
import { IAuditOptions } from '../types';
import { DefaultOptions } from '.';

export class FPSAudit extends EventEmitter {

    fps: number;
    min: number;
    total: number;
    samples: number;
    lastSample: number;
    lastSampleBatch: number;
    interval: number = DEFAULT_UPDATE_INTERVAL;
    rafHandle: any;

    public constructor(private options: IAuditOptions) {
        super();
        this.options = DefaultOptions(options);
        this.fps = 0;
        this.min = 60;
        this.total = 0;
        this.samples = 0;
        this.lastSample = this.lastSampleBatch = performance.now();
    }

    public start() {
        this.onRAF = this.onRAF.bind(this);
        this.rafHandle = raf(this.onRAF);
        return true;
    }

    public destroy() {
        raf.cancel(this.rafHandle);
        this.rafHandle = null;
    }

    onRAF() {
        if (!this.rafHandle) {
            return;
        }
        // update the new timestamp and total intervals recorded
        let newTS = performance.now();
        this.samples++;
        this.total += newTS - this.lastSample;
        if (newTS - this.lastSampleBatch >= this.interval) {
            // calculate the rolling average
            let fps = 1000 / (this.total / this.samples);
            // clamp to 60, use ~~ as a fast Math.floor()
            fps = fps > 60 ? 60 : ~~fps;
            if (this.fps !== fps) {
                if (this.options.onSample({ ts: new Date().getTime(), value: fps })) {
                    if (fps < this.min) {
                        this.min = fps;
                        this.options.onMin({ ts: new Date().getTime(), value: fps });
                    }
                    this.fps = fps;
                }
            }
            // reset
            this.total = 0;
            this.samples = 0;
            this.lastSampleBatch = newTS;
        }
        this.lastSample = newTS;

        this.rafHandle && raf(this.onRAF);
    }
}