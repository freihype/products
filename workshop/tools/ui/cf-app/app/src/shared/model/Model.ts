import { createUUID } from '../';
import { EventEmitter } from 'events';
export class Model extends EventEmitter {
    id: string;
    _destroyed: boolean = false;
    constructor() {
        super();
        this.id = createUUID();
    }
    destroy() {
        this._destroyed = true;
    }
    isDestroyed = () => this._destroyed;
    
    public on2(event: string, handler: () => any) {
        debugger;
        console.error('---');
        super.on(event, handler);
        return this;
    }
}
