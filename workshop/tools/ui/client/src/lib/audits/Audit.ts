import { IAuditSample } from "../types";

export const DefaultAuditSample = (): IAuditSample => {
    return {
        value: 0,
        ts: new Date().getTime()
    };
};