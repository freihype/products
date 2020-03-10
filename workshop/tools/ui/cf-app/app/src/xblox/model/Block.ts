import * as types from '../types';
import * as utils from '../../shared';

import * as _ from 'lodash';
import { remove } from '@xblox/core/arrays';
import { v4 } from 'uuid';
import { Model } from './Base';
import { Scope } from '.';
const debug = true;
const factory: any = {};

const index = (what, items) => {
    for (let j = 0; j < items.length; j++) {
        if (what.id === items[j].id) {
            return j;
        }
    }
}

const toBoolean = (data) => {
    let resInt = false;
    if (data != null) {
        const _dataStr = data[0] ? data[0] : data;
        if (_dataStr != null) {
            resInt = !!((_dataStr === true || _dataStr === 'true' || _dataStr === '1'));
        }
    }
    return resInt;
}

export class Block extends Model {
    //ui
    getStatusIcon() { }
    getStatusClass() { }
    setStatusClass() { }
    onActivity() { }
    onRun(...rest) { }
    onFailed(...rest) { }
    onSuccess(...rest) { }
    getIconClass() { }
    postCreate() {
        if (!this.parentId) {
            this.parentId = '0';
        }

        if (this['type']) {
            delete this['type'];
        }
    }
    items: any[];
    _lastSettings: any;
    _targetReference: any;
    _destroyed: boolean = false;
    id: string = 'noid';
    settings: any;
    _settings: any;

    //run
    _deferredObject: any;
    _return: any[] = [];
    override: any = null;
    _loop: any;
    virtual: any = null;
    _lastResult: null;
    _currentIndex: 0;
    _lastRunSettings: null;
    makeEditable(field, pos, type, title, mode) {
        const editableClass = this.canEdit() ? 'editable' : 'disabled';
        return '<a data-value=\'' + this[field] + '\' tabIndex=\'-1\' pos=\'' + pos + '\' display-mode=\'' + (mode || 'popup') + '\' display-type=\'' + (type || 'text') + '\' data-prop=\'' + field + '\' data-title=\'' + title + '\' class=\'' + editableClass + '\' href=\'#\'>' + this[field] + '</a>';
    }
    /**
     * Store function override
     * @param parent
     * @returns {boolean}
     */
    mayHaveChildren(parent) {
        return this.items != null && this.items.length > 0;
    }
    /**
     * Store function override
     * @param parent
     * @returns {Array}
     */
    getChildren(parent = {}) {
        return this.items;
    }
    getBlockIcon() {
        return '<span class="' + this.icon + '"></span>';
    }

    declaredClass: string = 'xblox.model.Block';
    isCommand: boolean = false;
    outlet: 0;
    scope: Scope;
    icon: string = 'fa-play';
    parentId: string;
    scopeId: string = '';
    group: string = '';
    _store: any;

    /**
     * Switch to include the block for execution.
     * @todo, move to block flags
     * @type {boolean}
     * @default true
     */
    enabled: boolean = true;
    /**
     * Switch to include the block for serialization.
     * @todo, move to block flags
     * @type {boolean}
     * @default true
     */
    serializeMe: true;
    /**
     * Name is used for the interface, mostly as prefix within
     * this.toText() which includes also the 'icon' (as icon font).
     * This should be unique and expressive.
     *
     * This field can be changed by the user. Examples
     * 'Run Script' will result in result 'Run Script + this.script'
     *
     * @todo: move that in user space, combine that with a template system, so any block ui parts gets off from here!
     * @type {string|null}
     * @default null
     * @required false
     */
    name: string = '';
    /**
     * @todo: same as name, move that in user space, combine that with a template system, so any block ui parts gets off from here!
     * @type {string}
     * @default 'No Description'
     * @required true
     */
    shareTitle: string = '';
    /**
     * The blocks internal user description
     * Description is used for the interface. This should be short and expressive and supports plain and html text.
     *
     * @todo: same as name, move that in user space, combine that with a template system, so any block ui parts gets off from here!
     * @type {boolean}
     * @default 'No Description'
     * @required true
     */
    sharable: boolean = false;
    /**
     * Container holding a 'child' blocks. Subclassing block might hold that somewhere else.
     * @type {Block[]}
     * @default null
     * @required false
     */
    /**
     * Parent up-link
     * @type {string|Block}
     * @default null
     * @required false
     */
    parent: any;
    _onLoaded: false;
    /**
     * ignore these due to serialization
     */
    ignoreSerialize: string[] = [
        '_didSubscribe',
        '_currentIndex',
        '_deferredObject',
        '_destroyed',
        '_return',
        'parent',
        '__started',
        'ignoreSerialize',
        '_lastRunSettings',
        '_onLoaded',
        'beanType',
        'sharable',
        'override',
        'virtual',
        '_scenario',
        '_didRegisterSubscribers',
        'additionalProperties',
        'renderBlockIcon',
        'serializeMe',
        '_statusIcon',
        '_statusClass',
        'hasInlineEdits',
        '_loop',
        'help',
        'owner',
        '_lastCommand',
        'allowActionOverride',
        'canDelete',
        'isCommand',
        'lastCommand',
        'autoCreateElse',
        '_postCreated',
        '_counter'
    ]
    _parseString(string, settings, block, flags) {
        let res = '';
        try {
            settings = settings || this._lastSettings || {};
            flags = flags || settings.flags || types.CIFLAG.EXPRESSION;
            const scope = this.scope;
            let value = string;
            // tslint:disable-next-line:no-bitwise
            const parse = !(flags & types.CIFLAG.DONT_PARSE);
            // tslint:disable-next-line:no-bitwise
            const isExpression = (flags & types.CIFLAG.EXPRESSION);
            // tslint:disable-next-line:no-bitwise
            if (flags & types.CIFLAG.TO_HEX) {
                value = utils.to_hex(value);
            }
            if (parse !== false) {
                value = utils.convertAllEscapes(value, 'none');
            }
            const override = settings.override || this.override || {};
            const _overrides = (override && override.variables) ? override.variables : null;

            // tslint:disable-next-line:prefer-conditional-expression
            if (isExpression && parse !== false) {
                res = scope.parseExpression(value, null, _overrides, null, null, null, override.args, flags);
            } else {
                res = '' + value;
            }
        } catch (e) {
            console.error(e);
        }
        return res;
    }

    /**
     *
     * @param clz
     * @returns {Array}
     */
    childrenByClass(clz) {
        const all = this.getChildren();
        const out = [];

        all.forEach(obj => {
            if (obj.isInstanceOf(clz)) {
                out.push(obj);
            }
        });

        return out;
    }
    /**
     *
     * @param clz
     * @returns {Array}
     */
    childrenByNotClas(clz) {
        const all = this.getChildren();
        const out = [];

        all.forEach(obj => {
            if (!obj.isInstanceOf(clz)) {
                out.push(obj);
            }
        });

        return out;
    }
    /**
     *
     * @returns {null}
     */
    getInstance() {
        const instance = this.scope.instance;
        if (instance) {
            return instance;
        }
        return null;
    }
    pause() { }
    mergeNewModule(source) {
        // tslint:disable-next-line:forin
        for (const i in source) {
            const o = source[i];
            if (o && _.isFunction(o)) {
                this[i] = o; //swap
            }
        }
    }
    reparent() {
        const item = this;
        if (!item) {
            return false;
        }
        const parent = item.getParent();
        if (parent) { } else {
            const _next = item.next(null, 1) || item.next(null, -1);
            if (_next) {
                item.group = null;
                _next._add(item);
            }
        }
    }
    unparent(blockgroup, move) {
        const item = this;
        if (!item) {
            return false;
        }
        const parent = item.getParent();
        if (parent && parent.removeBlock) {
            parent.removeBlock(item, false);
        }

        item.group = blockgroup;
        item.parentId = null;
        item.parent = null;
        if (move !== false) {
            item._place(null, -1, null);
            item._place(null, -1, null);
        }
    }
    move(dir) {
        const item = this;
        if (!item) {
            return false;
        }
        const parent = item.getParent();
        let items = null;
        const store = item._store;
        if (parent) {
            items = parent[parent._getContainer(item)];
            if (!items || items.length < 2 || !this.containsItem(items, item)) {
                return false;
            }
            const cIndex = this.indexOf(items, item);
            if (cIndex + (dir) < 0) {
                return false;
            }
            const upperItem = items[cIndex + (dir)];
            if (!upperItem) {
                return false;
            }
            items[cIndex + (dir)] = item;
            items[cIndex] = upperItem;
            return true;
        } else {
            item._place(null, dir);
            return true;
        }
    }
    _place(ref, direction, items = []) {
        const store = this._store;
        let dst = this;
        ref = ref || dst.next(null, direction);
        if (!ref) {
            console.error('have no next', this);
            return;
        }
        ref = _.isString(ref) ? store.getSync(ref) : ref;
        dst = _.isString(dst) ? store.getSync(dst) : dst;
        items = items || store.storage.fullData;
        direction = direction === -1 ? 0 : 1;
        remove(items, dst);
        if (direction === -1) {
            direction = 0;
        }
        items.splice(Math.max(index(ref, items) + direction, 0), 0, dst);
        store._reindex();
    }
    index() {
        const item = this;
        const parent = item.getParent();
        let items = null;
        const group = item.group;
        const store = this._store;

        if (parent) {
            items = parent[parent._getContainer(item)] || [];
            items = items.filter(item => item.group === group);
            if (!items || items.length < 2 || !this.containsItem(items, item)) {
                return false;
            }
            return this.indexOf(items, item);
        } else {
            items = store.storage.fullData;
            items = items.filter(item => item.group === group);
            return this.indexOf(items, item);
        }
    }
    numberOfParents() {
        let result = 0;
        const parent = this.getParent();
        if (parent) {
            result++;
            result += parent.numberOfParents();
        }
        return result;
    }
    getTopRoot() {
        let last = this.getParent();
        if (last) {
            const next = last.getParent();
            if (next) {
                last = next;
            }
        }
        return last;
    }
    next(items = this._store.storage.fullData, dir) {
        function _next(item, items, dir, step, _dstIndex) {
            const start = item.indexOf(items, item);
            const upperItem = items[start + (dir * step)];
            if (upperItem) {
                if (!upperItem.parentId && upperItem.group && upperItem.group === item.group) {
                    _dstIndex = start + (dir * step);
                    return upperItem;
                } else {
                    step++;
                    return _next(item, items, dir, step, _dstIndex);
                }
            }
            return null;
        }
        return _next(this, items, dir, 1, 0);
    }
    /**
     *
     * @param createRoot
     * @returns {module:xblox/model/Block|null}
     */
    getParent() {
        if (this.parentId) {
            return this.scope.getBlockById(this.parentId);
        }
    }
    getScope() {
        let scope = this.scope;
        if (this.scopeId && this.scopeId.length > 0) {
            const owner = scope.owner;
            if (owner && owner.hasScope) {
                if (owner.hasScope(this.scopeId)) {
                    scope = owner.getScope(this.scopeId);
                } else {
                    console.error('have scope id but cant resolve it', this);
                }
            }
        }
        return scope;
    }
    canAdd() {
        return false;
    }
    getTarget() {
        let _res = this._targetReference;
        if (_res) {
            return _res;
        }
        const _parent = this.getParent();
        if (_parent && _parent.getTarget) {
            _res = _parent.getTarget();
        }
        return _res;
    }
    // adds array2 at the end of array1 => useful for returned "solve" commands
    addToEnd(array1, array2) {
        if (array2 && array1.length != null && array2.length != null) {
            array1.push.apply(array1, array2);
        }
        return array1;
    }
    /**
     *
     * @param what
     * @param del delete block
     */
    removeBlock(what, del) {
        if (what) {
            if (del !== false && what.empty) {
                what.empty();
            }
            if (del !== false) {
                delete what.items;
            }
            what.parent = null;
            what.parentId = null;
            if (this.items) {
                remove(this.items, what);
            }
        }
    }
    /////////////////////////////////////////////////////////////////////////////////////
    //
    //  Accessors
    //
    /////////////////////////////////////////////////////////////////////////////////////
    _getContainer(item = null) {
        return 'items';
    }
    /////////////////////////////////////////////////////////////////////////////////////
    //
    //  Utils
    //
    /////////////////////////////////////////////////////////////////////////////////////
    empty(what) {
        try {
            this._empty(what)
        } catch (e) {

            debugger;
        }
    }
    /*
     * Empty : removes all child blocks, recursively
     * @param proto : prototype|instance
     * @param ctrArgs
     * @returns {*}
     */
    _empty(what) {
        const data = what || this.items;
        if (data) {
            data.forEach(subBlock => {
                if (subBlock && subBlock.empty) {
                    subBlock.empty();
                }
                if (subBlock && this.scope && this.scope.blockStore) {
                    this.scope.blockStore.remove(subBlock.id);
                }
            });
        }
    }
    /**
     * This was needed. FF bug.
     * @param data
     * @param obj
     * @returns {boolean}
     */
    containsItem(data, obj) {
        let i = data.length;
        while (i--) {
            if (data[i].id === obj.id) {
                return true;
            }
        }
        return false;
    }
    /**
     * This was needed. FF bug
     * @param data
     * @param obj
     * @returns {*}
     */
    indexOf(data, obj) {
        let i = data.length;
        while (i--) {
            if (data[i].id === obj.id) {
                return i;
            }
        }
        return -1;
    }
    _getBlock(dir) {
        const item = this;
        if (!item || !item.parentId) {
            return false;
        }
        //get parent
        const parent = this.scope.getBlockById(item.parentId);
        if (!parent) {
            return null;
        }
        const items = parent[parent._getContainer(item)];
        if (!items || items.length < 2 || !this.containsItem(items, item)) {
            return null;
        }
        const cIndex = this.indexOf(items, item);
        if (cIndex + (dir) < 0) {
            return false;
        }
        const upperItem = items[cIndex + (dir)];
        if (upperItem) {
            return upperItem;
        }
        return null;
    }
    getPreviousBlock() {
        return this._getBlock(-1);
    }
    getNextBlock() {
        return this._getBlock(1);
    }
    _getPreviousResult() {
        const parent = this.getPreviousBlock() || this.getParent();
        if (parent && parent._lastResult != null) {
            if (_.isArray(parent._lastResult)) {
                return parent._lastResult;
            } else {
                return [parent._lastResult];
            }
        }
        return null;
    }
    getPreviousResult() {
        let parent = null;
        const prev = this.getPreviousBlock();
        // tslint:disable-next-line:prefer-conditional-expression
        if (!prev || !prev._lastResult || !prev.enabled) {
            parent = this.getParent();
        } else {
            parent = prev;
        }

        if (parent && !parent._lastResult) {
            const _newParent = parent.getParent();
            if (_newParent) {
                parent = _newParent;
            }
        }

        if (parent && parent._lastResult != null) {
            if (_.isArray(parent._lastResult)) {
                return parent._lastResult;
            } else {
                return parent._lastResult;
            }
        }
        return null;
    }
    _getArg(val, escape: boolean = false) {
        const _float = parseFloat(val);
        if (!isNaN(_float)) {
            return _float;
        } else {
            if (val === 'true' || val === 'false') {
                return val === 'true';
            } else if (val && escape && _.isString(val)) {
                return '\'' + val + '\'';
            }
            return val;
        }
    }
    getArgs(settings?: any) {
        let result = [];
        settings = settings || {};
        let _inArgs = settings.args || this._get('args');
        if (settings.override && settings.override.args) {
            _inArgs = settings.override.args;
        }
        if (_inArgs) { //direct json
            result = utils.getJson(_inArgs, null, false);
        }
        //try comma separated list
        if (result && result.length === 0 && _inArgs && _inArgs.length && _.isString(_inArgs)) {

            if (_inArgs.indexOf(',') !== -1) {
                const splitted = _inArgs.split(',');
                // tslint:disable-next-line:prefer-for-of
                for (let i = 0; i < splitted.length; i++) {
                    //try auto convert to number
                    const _float = parseFloat(splitted[i]);
                    if (!isNaN(_float)) {
                        result.push(_float);
                    } else {
                        if (splitted[i] === 'true' || splitted[i] === 'false') {
                            result.push(toBoolean(splitted[i]));
                        } else {
                            result.push(splitted[i]); //whatever
                        }
                    }
                }
                return result;
            } else {
                result = [this._getArg(_inArgs)]; //single argument
            }
        }

        // tslint:disable-next-line:no-unused-expression
        !_.isArray(result) && (result = []);

        //add previous result
        const previousResult = this.getPreviousResult();
        if (previousResult != null) {
            if (_.isArray(previousResult) && previousResult.length === 1) {
                result.push(previousResult[0]);
            } else {
                result.push(previousResult);
            }
        }

        return result || [_inArgs];
    }
    /*
     * Remove : as expected, removes a block
     * @param proto : prototype|instance
     * @param ctrArgs
     * @returns {*}
     */
    remove(what) {
        this._destroyed = true;
        if (this.parentId != null && this.parent == null) {
            this.parent = this.scope.getBlockById(this.parentId);
        }
        if (this.parent && this.parent.removeBlock) {
            this.parent.removeBlock(this);
            return;
        }
        what = what || this;
        if (what) {
            if (what.empty) {
                what.empty();
            }
            delete what.items;
            what.parent = null;
            if (this.items) {
                remove(this.items, what);
            }
        }
    }
    prepareArgs(ctorArgs) {
        if (!ctorArgs) {
            ctorArgs = {};
        }
        //prepare items
        if (!ctorArgs['id']) {
            ctorArgs['id'] = v4();
        }
        if (!ctorArgs['items']) {
            ctorArgs['items'] = [];
        }
        if (!ctorArgs['parentId']) {
            ctorArgs['parentId'] = '0';
        }
    }
    /**
     * Private add-block function
     * @param proto
     * @param ctrArgs
     * @param where
     * @param publish
     * @returns {*}
     * @private
     */
    _add(proto, ctrArgs, where, publish: boolean = false) {
        let block = null;
        try {
            //create or set
            if (ctrArgs) {
                //use case : normal object construction
                this.prepareArgs(ctrArgs);
                block = factory.createBlock(proto, ctrArgs, null, publish);
            } else {
                //use case : object has been created so we only do the leg work
                if (ctrArgs == null) {
                    block = proto;
                }
                //@TODO : allow use case to use ctrArgs as mixin for overriding
            }
            ///////////////////////
            //  post work

            //inherit scope
            block.scope = this.scope;
            //add to scope
            if (this.scope) {
                block = this.scope.registerBlock(block, publish);
            }
            if (debug) {
                if (block.id === this.id) {
                    console.error('adding new block to our self');
                    debugger;
                }
            }
            block.parent = this;
            block.parentId = this.id;
            block.scope = this.scope;

            const container = where || this._getContainer();
            if (container) {
                if (!this[container]) {
                    this[container] = [];
                }
                const index = this.indexOf(this[container], block);
                if (index !== -1) {
                    console.error(' have already ' + block.id + ' in ' + container);
                } else {
                    if (this.id === block.id) {
                        console.error('tried to add our self to ' + container);
                        return;
                    }
                    this[container].push(block);
                }
            }
            block.group = null;
            return block;
        } catch (e) {
            console.error(e, '_add');
        }
        return null;

    }
    getStore() {
        return this.getScope().getStore();
    }
    /**
     * Public add block function
     * @param proto {}
     * @param ctrArgs
     * @param where
     * @returns {*}
     */
    add(proto, ctrArgs, where) {
        const block = this._add(proto, ctrArgs, where);
        return block.getStore().getSync(block.id);
    }
    /////////////////////////////////////////////////////////////////////////////////////
    //
    //  Run
    //
    /////////////////////////////////////////////////////////////////////////////////////
    getContext() {
        if (this.scope.instance && this.scope.instance) {
            return this.scope.instance;
        }
        return null;
    }
    resolved() {
        if (this._deferredObject) {
            this._deferredObject.resolve();
            delete this._deferredObject;
        }
    }
    /***
     * Solves all the commands into items[]
     *
     * @param manager   =>  BlockManager
     * @return  list of commands to send
     */
    _solve(
        scope,
        settings = {
            highlight: false
        }
    ) {
        const ret = [];

        this.items.forEach(block => {
            this.addToEnd(ret, block.solve(scope, settings));
        });

        return ret;
    }
    /***
     * Solves all the commands into items[]
     *
     * @param manager   =>  BlockManager
     * @return  list of commands to send
     */
    ___solve(
        scope,
        settings = {
            highlight: false
        }
    ) {
        const ret = [];

        this.items.forEach(block => {
            this.addToEnd(ret, block.solve(scope, settings));
        });

        return ret;
    }
    solve(...rest) {

    }
    /***
 * Solves all the commands into items[]
 *
 * @param manager   =>  BlockManager
 * @return  list of commands to send
 */
    solveMany(scope, settings) {
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
    runFrom(blocks, index, settings) {
        const thiz = this;
        blocks = blocks || this.items;
        if (!this._return) {
            this._return = [];
        }
        const onFinishBlock = (block, results) => {
            block._lastResult = block._lastResult || results;
            thiz._currentIndex++;
            thiz.runFrom(blocks, thiz._currentIndex, settings);
        };
        const wireBlock = block => {
            block._deferredObject.then(results => {
                onFinishBlock(block, results);
            });
        };

        if (blocks.length) {
            for (let n = index; n < blocks.length; n++) {
                const block = blocks[n];
                if (block.deferred === true) {
                    block._deferredObject = new Promise((r, h) => { });
                    this._currentIndex = n;
                    wireBlock(block);
                    this.addToEnd(this._return, block.solve(this.scope, settings));
                    break;
                } else {
                    this.addToEnd(this._return, block.solve(this.scope, settings));
                }
            }
        } else {
            this.onSuccess(this, settings);
        }
        return this._return;
    }
    serializeField(name) {
        return this.ignoreSerialize.indexOf(name) === -1; //is not in our array
    }
    onLoad() { }
    activate() { }
    deactivate() { }
    _get(what) {
        if (this.override) {
            return (what in this.override ? this.override[what] : this[what]);
        }
    }
    onDidRun() {
        if (this.override) {
            // tslint:disable-next-line:no-unused-expression
            this.override.args && delete this.override.args;
            delete this.override;
        }
    }
    destroy() {
        this.stop(true);
        this.reset();
        this._destroyed = true;
        delete this.virtual;
    }
    reset() {
        this._lastSettings = {};
        clearTimeout(this._loop);
        this._loop = null;
        delete this.override;
        this.override = null;
        delete this._lastResult;
        this.override = {};
    }
    stop(...rest) {
        this.reset();
        // this.getItems && _.invoke(this.getItems(), 'stop');
    }
    getDefaultFields(icon: string = this.icon, share: boolean = false) {
        /*
        const fields = [];
        if (this.canDisable && this.canDisable() !== false) {
            fields.push(
                utils.createCI('enabled', 0, this.enabled, {
                    group: 'General',
                    title: 'Enabled',
                    dst: 'enabled',
                    actionTarget: 'value',
                    order: 210
                })
            );
        }
        fields.push(utils.createCI('description', 26, this.description, {
            group: 'Description',
            title: 'Description',
            dst: 'description',
            useACE: false
        }));

        icon !== false && fields.push(utils.createCI('icon', 17, this.icon, {
            group: 'General',
            title: 'Icon',
            dst: 'icon',
            useACE: false,
            order: 206
        }));

        outlets !== false && fields.push(utils.createCI('outlet', 5, this.outlet, {
            group: 'Special',
            title: 'Type',
            dst: 'outlet',
            order: 205,
            data: [
                {
                    value: 0x00000001,
                    label: 'Progress',
                    title: 'Executed when progress'
                },
                {
                    value: 0x00000002,
                    label: 'Error',
                    title: "Executed when errors"
                },
                {
                    value: 0x00000004,
                    label: 'Paused',
                    title: "Executed when paused"
                },
                {
                    value: 0x00000008,
                    label: 'Finish',
                    title: "Executed when finish"
                },
                {
                    value: 0x00000010,
                    label: 'Stopped',
                    title: "Executed when stopped"
                }
            ],
            widget: {
                hex: true
            }
        }));
        if (this.sharable) {
            fields.push(
                utils.createCI('enabled', 13, this.shareTitle, {
                    group: 'Share',
                    title: 'Title',
                    dst: 'shareTitle',
                    toolTip: 'Enter an unique name to share this block!'
                })
            );
        }
        return fields;
        */
        return [];
    }

    getProperties(): any {
        return {};
    }

    getPropertyGroup(attribute: string): string {
        return 'Misc';
    }
}
