import { EventEmitter } from 'events';
import { remove } from '@xblox/core/arrays';
import * as lodash from 'lodash';

export type EventType = string | symbol;

/**
 * The base event object, which provides a `type` property
 */
export interface EventObject<T = EventType> {
    /**
	 * The type of the event
	 */
    readonly type: T;
}

export interface EventErrorObject<T = EventType> extends EventObject<T> {
    /**
	 * The error that is the subject of this event
	 */
    readonly error: Error;
}

/**
 * An interface for an object which provides a cancelable event API.  By calling the
 * `.preventDefault()` method on the object, the event should be cancelled and not
 * proceed any further
 */
export interface EventCancelableObject<T = EventType> extends EventObject<T> {
    /**
	 * Can the event be canceled?
	 */
    readonly cancelable: boolean;

    /**
	 * Was the event canceled?
	 */
    readonly defaultPrevented: boolean;

    /**
	 * Cancel the event
	 */
    preventDefault(): void;
}

export type EventedCallback<T = EventType, E extends EventObject<T> = EventObject<T>> = (event: E) => boolean | void;

/**
 * Used through the toolkit as a consistent API to manage how callers can "cleanup"
 * when doing a function.
 */
export interface Handle {
    /**
	 * Perform the destruction/cleanup logic associated with this handle
	 */
    destroy(): void;
    type: EventType;
    fn: EventedCallback;
    destroyed: boolean;
}

export const destroy = (handle: Handle) => {
    if (handle) {
        handle.destroy();
        handle.destroyed = true;
    }
}

export const on = (type, listener, node?: any, owner?: any): Handle => {
    let who = owner;
    const wrapped = (...rest) => listener.apply(who, [...rest]);
    if (!node) {
        EventEmitter.prototype.on(type, wrapped);
    } else if (node && node.on) {
        node.on(type, wrapped);
    } else if (node && !node.on) {
        console.error('invalid node for Evented.on');
    }

    const handle = {
        type: type,
        destroy: () => {
            remove(who._handles, handle);
            if (!node) {
                EventEmitter.prototype.removeListener(type, wrapped);
            } else if (node && node.on) {
                node.off(type, wrapped);
            }
        },
        fn: wrapped,
        destroyed: false
    }
    return handle;
}


export class Evented {
    _handles: any[] = [];
    on(type, listener, node?: any, owner?: any): Handle {
        let who = owner || this;
        const wrapped = (...rest) => listener.apply(who, [...rest]);
        if (!node) {
            EventEmitter.prototype.on(type, wrapped);
        } else if (node && node.on) {
            node.on(type, wrapped);
        } else if (node && !node.on) {
            console.error('invalid node for Evented.on');
        }

        const handle = {
            type: type,
            destroy: () => {
                remove(who._handles, handle);
                if (!node) {
                    EventEmitter.prototype.removeListener(type, wrapped);
                } else if (node && node.on) {
                    node.off(type, wrapped);
                }
            },
            fn: wrapped,
            destroyed: false
        }

        this._handles.push(handle);

        return handle;
    }
    emit(type, ...rest) {
        const handle = lodash.find(this._handles, {
            type: type
        })
        if (handle && !handle.destroyed) {
            EventEmitter.prototype.emit(type, ...rest);
        }
    }
    public destroyHandles() {
        this._handles.forEach((h) => h.destroy());
    }
    destroy() {
        this.destroyHandles();
    }
}
