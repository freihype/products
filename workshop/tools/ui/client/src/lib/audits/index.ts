import { IAuditOptions } from '../types';

export * from './LongTasks';
export * from './FPS';
export * from './Audit';
export * from './AuditBuffer';
export * from './DefaultAudit'
export * from './MemoryAudit';

export const noop = () => true;

export const DefaultOptions = (options: IAuditOptions) => {
    return {
        onSample: options.onSample || noop,
        onMax: options.onMax || noop,
        onMin: options.onMin || noop
    } as IAuditOptions;
};

export const DefaultSample = {
    value: 0,
    ts: Date.now(),
    user: {}
}