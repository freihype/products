import { IAudit, DefaultSample } from "..";
export class DefaultAudit implements IAudit {
    public start() { return true; }
    public stop() { }
    public clear() { }
    public destroy() { }
    public max() { return DefaultSample; }
    public last() { return DefaultSample; };
}