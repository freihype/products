import { DefaultSample, DefaultOptions } from "..";
import { IAudit, IAuditOptions, last } from "..";

const mapToSample = (pe: PerformanceEntry | undefined) => {
    return pe ? {
        value: pe.duration,
        ts: pe.startTime,
        user: pe
    } : DefaultSample
};

export class LongTaskAudit implements IAudit {

    private observer: PerformanceObserver;
    private entries: PerformanceEntry[] = [];
    private lastMaximum: PerformanceEntry;

    constructor(private options: IAuditOptions) {
        this.options = DefaultOptions(options);
    }

    private updateMax(entry: PerformanceEntry) {
        if (!this.lastMaximum || entry.duration > this.lastMaximum.duration) {
            this.lastMaximum = entry;
            this.options.onMax(mapToSample(entry));
        }
        return this.lastMaximum;

    }
    private collector(list: PerformanceObserverEntryList) {
        let perfEntries = list.getEntries();
        perfEntries.forEach((p) => {
            if (this.options.onSample(mapToSample(p))) {
                this.entries.push(p);
                this.updateMax(p);
            }
        });
    }

    private init(collector: (list: PerformanceObserverEntryList) => void) {
        this.stop();
        this.observer = new PerformanceObserver(collector.bind(this));
    }

    public start() {
        try {
            this.init(this.collector);
            this.observer.observe({ entryTypes: ["longtask"], buffered: true });
        } catch (e) {
            console.error('Error using PerformanceObserver', e);
            this.destroy();
            return false;
        }
        return true;
    }
    public stop() {
        this.destroy();
    }
    public destroy() {
        this.clear();
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
    public clear() {
        this.lastMaximum = null;
        this.entries = [];
    }

    // utilities, currently not used
    public max() {
        return mapToSample(this.lastMaximum);
    }
    public last() {
        return mapToSample(last(this.entries));
    }
}