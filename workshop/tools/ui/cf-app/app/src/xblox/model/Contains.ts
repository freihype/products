import { Block } from './Block';
import { EVENTS } from '../index';
export class Contains extends Block {
    declaredClass: string = 'xblox.model.Contains';
    runByType(outletType, settings) {
        const items = this.getItemsByType(outletType);
        if (items.length) {
            this.runFrom(items, 0, settings);
        }
    }
    getItemsByType(outletType) {
        const items = this.items;
        if (!outletType) {
            return items;
        }
        const result = [];
        items.forEach((item => {
            if (item.outlet & outletType) {
                result.push(item);
            }
        }));
        return result;
    }
    getContainer() {
        return this[this._getContainer()];
    }
    /**
     * Store is asking this!
     * @param parent
     * @returns {boolean}
     */
    mayHaveChildren(parent) {
        const items = this[this._getContainer()];
        return items != null && items.length > 0;
    }
    /**
     * Store function
     * @param parent
     * @returns {Array}
     */
    getChildren(parent) {
        return this[this._getContainer()];
    }
    //  standard call from interface
    canAdd() {
        return true;
    }
    /***
     * Generic: run sub blocks
     * @param scope
     * @param settings
     * @param run
     * @param error
     * @returns {Array}
     */
    _solve2(scope, settings, run, error) {
        if (!this._lastRunSettings && settings) {
            this._lastRunSettings = settings;
        }
        settings = this._lastRunSettings || settings;
        this._currentIndex = 0;
        this._return = [];
        const ret = [];
        const items = this[this._getContainer()];
        if (items.length) {
            const res = this.runFrom(items, 0, settings);
            this.onSuccess(this, settings);
            return res;
        } else {
            this.onSuccess(this, settings);
        }
        return ret;
    }
    onDidRunItem(dfd, result) {
        this.emit(EVENTS.ON_RUN_BLOCK_SUCCESS, this);
        dfd.resolve(result);
    }
    onDidRunItemError(dfd, result, ...rest) {
        dfd.reject(result);
    }
    onRunThis(...rest) {
        this.emit(EVENTS.ON_RUN_BLOCK, this);
    }
    onDidRunThis(dfd, result, items, settings) {
        /*
        const thiz = this;
        //more blocks?
        if (items && items.length) {
            const subDfds = thiz.runFrom(items, 0, settings);
            all(subDfds).then(() => {
                thiz.onDidRunItem(dfd, result, settings);
            }, err => {
                thiz.onDidRunItem(dfd, err, settings);
            });

        } else {
            thiz.onDidRunItem(dfd, result, settings);
        }
        */
    }
}
