// Pure audit types
export interface IAudit {
    // lifecycle & controls
    start: () => void;
    stop: () => void;
    clear: () => void;
    destroy: () => void;

    // value access
    max?: () => IAuditSample;
    last: () => IAuditSample;

}
export interface IAuditSample {
    readonly value: number;
    readonly ts?: number;
    // audit specific data
    readonly user?: any;
}

export interface IAuditOptions {
    // common callbacks
    onSample?: (sample: IAuditSample) => boolean;
    onMax?: (sample: IAuditSample) => void;
    onMin?: (sample: IAuditSample) => void;
}

export enum EKPIErrorCode {
    OK,
    GENERAL,
    FATAL
}