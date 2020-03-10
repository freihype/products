import { IAuditSample } from "../types";

export class AuditBuffer {
    protected values: IAuditSample[] = [];
    public add(sample: IAuditSample) {
        this.values.push(sample);
    }

    public all() {
        return this.values;
    }
    public toString() {
        return JSON.stringify(this.all());
    }
}