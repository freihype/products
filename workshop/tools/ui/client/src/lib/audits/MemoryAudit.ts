import { IAudit, DefaultSample } from "..";
import { DefaultAudit } from "./DefaultAudit";

const memory = typeof performance !== 'undefined' && (performance as any).memory ?
    (performance as any).memory : { usedJSHeapSize: -1 };

export class MemoryAudit extends DefaultAudit implements IAudit {
    public last() {
        return {
            ...DefaultSample,
            value: memory.usedJSHeapSize / (1024 * 1024),
            ts: Date.now()
        }
    }
}