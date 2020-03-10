import { EventEmitter } from 'events';
import * as types from '../types';
import * as utils from '../../shared';
import * as MD5 from 'md5';
import * as _ from 'lodash';
import { remove } from '@xblox/core/arrays';
import { v4 } from 'uuid';
import { EVENTS } from '../../shared';

const debug = false;
const isIDE = true;
const factory: any = {};
const dcl: any = {};
const lang: any = {};

import { Expression } from './Expression';
import { Variable } from './Variable';
import { BlockMap, createBlock, Block } from '../'
import { BehaviorSubject, Observable, Observer } from 'rxjs';
import { DriverInstance } from '../../shared/driver/DriverInstance'
/**
 * The scope acts as a real scope as usual. All registered variables and blocks are excecuted in this scope only.
 * @class module:xblox/model/Scope
 */
export class Scope extends EventEmitter {
    declaredClass: 'xblox.model.Scope';
    variableStore: any = null;
    serviceObject: any = null;
    context: any = null;
    blockStore: any = null;
    expressionModel: any = null;
    __didStartBlocks: boolean = false;
    instance: DriverInstance;
    _cached: any;
    blocks: any[] = [];
    owner: any;
    variables: any;
    ctx: any;
    driver: any;
    items: any;
    device: any;
    _destroyed: boolean = false;
    basicCommands() {
        return this.getBlocks({
            group: types.COMMAND_TYPES.BASIC_COMMAND
        });
    }
    basicVariables() {
        return this.getBlocks({
            group: types.BLOCK_GROUPS.BASIC_VARIABLES
        });
    }
    start() {
        if (this.__didStartBlocks === true) {
            console.error('already started blocks')
            return
        }
        this.__didStartBlocks = true
        let responseVariable = this.getVariable('value');
        if (!responseVariable) {
            responseVariable = new Variable({
                id: utils.createUUID(),
                name: 'value',
                value: '',
                scope: this,
                type: 13,
                group: 'processVariables',
                gui: false,
                cmd: false
            })

            this.blockStore.putSync(responseVariable)
        }
        let autoBlocks = [];
        const initBlocks = this.getBlocks({
            group: types.COMMAND_TYPES.INIT_COMMAND
        });

        const self = this;
        try {
            initBlocks.forEach(block => {
                if (block.enabled !== false && block.__started !== true) {
                    block.solve(self);
                    block.__started = true
                }
            });
        } catch (e) {
            console.error('starting init blocks failed', e)
        }
        autoBlocks = autoBlocks.concat(this.getBlocks({
            group: types.COMMAND_TYPES.BASIC_COMMAND
        }))

        // console.error('auto blocks : '+autoBlocks.length + ' ' + this.id);
        for (let i = 0; i < autoBlocks.length; i++) {
            const block = autoBlocks[i];
            if (block.enabled && block.start && block.startup && block.__started !== true) {
                block.start()
                block.__started = true
            }
        }
    }

    /**
     *
     * @returns {module:xblox/model/Expression}
     */
    getExpressionModel() {
        if (!this.expressionModel) {
            this.expressionModel = new Expression()
        }
        return this.expressionModel
    }

    /**
     *
     * @param block
     * @param url
     * @returns {*}
     */
    toFriendlyName(block, url) {
        /*
        if (!url || !block) {
            return null
        }
        let blockScope = this;
        const ctx = this.ctx;
        let driver = this.driver;
        const deviceManager = ctx.getDeviceManager();
        const driverManager = ctx.getDriverManager();

        if (url.indexOf('://') === -1) {
            const _block = blockScope.getBlockById(url);
            if (_block) {
                return _block.name
            }
            return url
        }
        let parts = utils.parse_url(url); // strip scheme

        parts = utils.urlArgs(parts.host) // go on with query string
        const _device = deviceManager.getItemById(parts.device.value);
        if (_device) {
            const info = deviceManager.toDeviceControlInfo(_device);
            driver = driverManager.getDriverById(info.driverId)
            const driverInstance = _device.driverInstance;
            if (driverInstance || driver) {
                blockScope = driver.blockScope ? driver.blockScope : driverInstance ? driverInstance.blockScope : blockScope
                block = blockScope.getStore().getSync(parts.block.value)
                if (block) {
                    return info.title + '/' + block.name
                } else if (driverInstance && driverInstance.blockScope) {
                    block = driverInstance.blockScope.getBlock(parts.block.value)
                    if (block) {
                        return info.title + '/' + block.name
                    }
                }
            }
        }*/
        return '';
    }

    getContext() {
        return this.instance;
    }

    toString() {
        const all = {
            blocks: null,
            variables: null
        };
        const blocks = this.blocksToJson();
        try {
            JSON.parse(JSON.stringify(blocks))
        } catch (e) {
            debug && console.error('scope::toString : invalid data in scope')
            return
        }
        all.blocks = blocks
        return JSON.stringify(all, null, 2)
    }
    /**
     * @param data
     * @param errorCB {function}
     */
    initWithData(data, errorCB?) {
        // tslint:disable-next-line:no-unused-expression
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        console.groupCollapsed('parse blocks', data);
        const t = _.find(data, { declaredClass: 'xblox.model.code.RunScript' });
        data && this.blocksFromJson(data, null, errorCB)
        this.clearCache();
        console.groupEnd();
    }
    // ///////////////////////////////////////////////////////
    //
    //  Service uplink related
    //
    // ///////////////////////////////////////////////////////
    /** @member {Object} */
    getService() {
        return this.serviceObject
    }

    // ///////////////////////////////////////////////////////
    //
    //  Store related
    //
    // ///////////////////////////////////////////////////////
    getStore() {
        return this.blockStore
    }
    reset() {
        this.getExpressionModel().reset()
    }
    /**
     *
     */
    empty() {
        this.clearCache()
        const store = this.blockStore;
        const allBlocks = this.getBlocks();
        store.silent(true)
        _.each(allBlocks, block => {
            if (block) {
                store.removeSync(block.id)
            } else {
                debug && console.error('have no block')
            }
        })
        store.setData([])
        store.silent(false)
    }

    fromScope(source) {
        const store = this.blockStore;
        store.silent(true)
        this.empty()
        const _t = source.blocksToJson();

        this.blocksFromJson(_t);

        store.silent(false)
    }
    /**
     *
     */
    clearCache() {
        this.getExpressionModel().reset()
    }
    getVariableStore() {
        return this.blockStore
    }
    getBlockStore() {
        return this.blockStore
    }
    getVariables(query: any | undefined = null) {
        const all = this.getBlocks();
        const out = [];
        if (query && query.group === 'processVariables') {
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < all.length; i++) {
                if (all[i].group === 'processVariables') {
                    out.push(all[i])
                }
            }
            return out
        }
        // query = query || {id:/\S+/};//all variables
        if (!query) {
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < all.length; i++) {
                const block = all[i];
                const cls = block.declaredClass;
                if (cls === 'xblox.model.variables.Variable' || cls === 'xcf.model.Variable') {
                    out.push(block)
                }
            }
            return out
        }
        // return this.blockStore.query(query)
        return [];
    }
    loopBlock(block, settings?: any) {

        if (block._destroyed === true) {
            console.error('block destroyed')
        }
        const interval = block.getInterval ? block.getInterval() : 0;
        if (block && interval > 0 && block.enabled && block._destroyed !== true) {
            const thiz = this;
            if (block._loop) {
                clearInterval(block._loop)
            }
            block._loop = setInterval(() => {
                if (!block.enabled || block._destroyed) {
                    clearInterval(block._loop)
                    block._loop = null
                    return
                }
                block.solve(thiz, settings || block._lastSettings)
            }, interval)
        }
    }

    getEventsAsOptions(selected) {
        let result = [];
        // tslint:disable-next-line:forin
        for (const e in types.EVENTS) {
            const label = types.EVENTS[e];

            const item = {
                label: label,
                value: types.EVENTS[e]
            };
            result.push(item)
        }
        result = result.concat([{
            label: 'onclick',
            value: 'onclick'
        },
        {
            label: 'ondblclick',
            value: 'ondblclick'
        },
        {
            label: 'onmousedown',
            value: 'onmousedown'
        },
        {
            label: 'onmouseup',
            value: 'onmouseup'
        },
        {
            label: 'onmouseover',
            value: 'onmouseover'
        },
        {
            label: 'onmousemove',
            value: 'onmousemove'
        },
        {
            label: 'onmouseout',
            value: 'onmouseout'
        },
        {
            label: 'onkeypress',
            value: 'onkeypress'
        },
        {
            label: 'onkeydown',
            value: 'onkeydown'
        },
        {
            label: 'onkeyup',
            value: 'onkeyup'
        },
        {
            label: 'onfocus',
            value: 'onfocus'
        },
        {
            label: 'onblur',
            value: 'onblur'
        },
        {
            label: 'onchange',
            value: 'onchange'
        }
        ])

        // select the event we are listening to
        for (let i = 0; i < result.length; i++) {
            const obj = result[i];
            if (obj.value === selected) {
                obj.selected = true
                break;
            }
        }
        return result
    }

    /**
     *
     * @returns {{}}
     */
    getVariablesAsObject() {
        const variables = this.getVariables();
        const result = {};
        for (let i = 0; i < variables.length; i++) {
            result[variables[i].title] = variables[i].value
        }
        return result
    }

    getVariablesAsOptions() {
        const variables = this.getVariables();
        const result = [];
        if (variables) {
            for (let i = 0; i < variables.length; i++) {
                result.push({
                    label: variables[i].label,
                    value: variables[i].variable
                })
            }
        }
        return result
    }

    getCommandsAsOptions(labelField) {
        const items = this.getBlocks({
            declaredClass: 'xcf.model.Command'
        });
        const result = [];
        if (items) {
            for (let i = 0; i < items.length; i++) {
                const item = {};
                item[labelField || 'label'] = items[i].name
                item['value'] = items[i].name
                result.push(item)
            }
        }
        return result
    }

    getBlocks(query: any = {}, allowCache: boolean = true): any[] {
        const blocks = this.blocks.map((s) => s.getValue());
        return _.filter(blocks, query);
    }
    /***
     * Register a variable into the scope
     *
     * The variable title is unique within the scope
     *
     * @param variable  =>  xblox.model.Variable
     */
    registerVariable(variable) {
        this.variables[variable.title] = variable
        if (this.blockStore) {
            this.blockStore.putSync(variable)
        }
    }
    /***
     * Returns a variable from the scope
     *
     * @param title => variable title
     * @return variable
     */
    getVariable(title) {
        const _variables = this.getVariables();
        for (let i = 0; i < _variables.length; i++) {
            const obj = _variables[i];
            if (obj.name === title) {
                return obj
            }
        }
        return null
    }
    /***
     * Returns a variable from the scope
     *
     * @param title => variable title
     * @return variable
     */
    getVariableById(id) {
        if (!id) {
            return null
        }
        const parts = id.split('/');
        let scope = this;
        if (parts.length === 2) {
            const owner = scope.owner;
            if (owner && owner.hasScope) {
                if (owner.hasScope(parts[0])) {
                    scope = owner.getScope(parts[0])
                } else {
                    console.error('have scope id but cant resolve it', this)
                }
            }
            id = parts[1]
        }
        const _var = scope.blockStore.getSync(id);
        if (_var) {
            return _var
        }
        return null
    }
    /***
     * Register a block into the scope
     *
     * The block name is unique within the scope
     *
     * @param block   =>    xblox.model.Block
     */
    blockObserver: any = null;
    _next: any;
    registerBlock(block, publish) {
        if (!this.blockObserver) {
            const observer = Observable.from(this.blocks);
            observer.subscribe((next) => {
                console.log('next:', next);
            }, (error) => {

            });
            this.blockObserver = observer;
        }
        const b = new BehaviorSubject(block);
        block.subject = b;
        this.blocks.push(b);
        // this.blockObserver.next(this.blocks);
        return block;
        /*
        const store = this.blockStore;
        if (store) {
            const added = store.getSync(block.id);
            if (added) {
                debug && console.warn('block already in store! ' + block.id, block)
                return added
            }
            let result = null;
            // custom add block to store function
            // tslint:disable-next-line:prefer-conditional-expression
            if (block.addToStore) {
                result = block.addToStore(store)
            } else {
                result = store.putSync(block, publish)
            }
            return result
        }
        */
    }
    /***
     * Return all blocks
     *
     * @returns {xblox.model.Block[]}
     */
    allBlocks(query: any | undefined = null, allowCache: boolean = true): Block[] {
        return this.getBlocks({}, allowCache);
    }
    /**
     * Returns whether there is any block belongs to a given group
     * @param group {String}
     * @returns {boolean}
     */
    hasGroup(group) {
        const all = this.allGroups();
        for (let i = 0; i < all.length; i++) {
            const obj = all[i];
            if (obj === group) {
                return true
            }
        }
        return false
    }
    /**
     * Return all block groups
     * @returns {String[]}
     */
    allGroups() {
        const result = [];
        const all = this.allBlocks({}, false);
        const _has = what => {
            for (let i = 0; i < result.length; i++) {
                if (result[i] === what) {
                    return true
                }
            }
            return false
        };
        for (let i = 0; i < all.length; i++) {
            const obj = all[i];
            if (obj.parentId) {
                continue;
            }
            if (obj.group) {
                if (!_has(obj.group)) {
                    result.push(obj.group)
                }
            } else {
                if (!_has('No Group')) {
                    result.push('No Group')
                }
            }
        }
        return result
    }
    /**
     * Serializes all variables
     * @returns {Array}
     */
    variablesToJson() {
        const result = [];
        const data = this.variableStore ? this.getVariables() : this.variables;
        // tslint:disable-next-line:forin
        for (const e in data) {
            const variable = data[e];
            if (variable.serializeMe === false) {
                continue;
            }
            if (variable.keys == null) {
                continue;
            }
            const varOut = {};
            for (const prop in variable) {
                // copy all serializables over
                if (
                    _.isString(variable[prop]) ||
                    _.isNumber(variable[prop]) ||
                    _.isBoolean(variable[prop])
                ) {
                    varOut[prop] = variable[prop]
                }
            }

            result.push(varOut)
        }
        return result
    }
    isScript(val) {
        return _.isString(val) && (
            val.indexOf('return') !== -1 ||
            val.indexOf(';') !== -1 ||
            val.indexOf('[') !== -1 ||
            val.indexOf('{') !== -1 ||
            val.indexOf('}') !== -1
        )
    }
    /**
     * Serializes all variables
     * @returns {Array}
     */
    variablesToJavascriptEx(skipVariable, expression) {
        const result = [];
        const data = this.variableStore ? this.getVariables() : this.variables;
        for (let i = 0; i < data.length; i++) {
            const _var = data[i];
            // tslint:disable-next-line:triple-equals
            if (_var == skipVariable) {
                continue;
            }
            let _varVal = '' + _var.value;

            // optimization
            if (skipVariable && skipVariable.value && skipVariable.value.indexOf(_var.title) === -1) {
                continue;
            }
            if (expression && expression.indexOf(_var.title) === -1) {
                continue;
            }

            if (_varVal.length === 0) {
                continue;
            }
            // tslint:disable-next-line:quotemark
            if (!this.isScript(_varVal) && _varVal.indexOf("'") === -1) {
                // tslint:disable-next-line:quotemark
                _varVal = "'" + _varVal + '\''
            } else if (this.isScript(_varVal)) {
                _varVal = this.expressionModel.parseVariable(this, _var)
            }
            // tslint:disable-next-line:quotemark
            if (_varVal === "''") {
                // tslint:disable-next-line:quotemark
                _varVal = "'0'"
            }
            result.push(_varVal)
        }
        return result
    }
    variablesToJavascript(skipVariable, expression) {
        let result = '';
        const data = this.variableStore ? this.getVariables() : this.variables || [];
        for (let i = 0; i < data.length; i++) {
            const _var = data[i];
            // tslint:disable-next-line:triple-equals
            if (_var == skipVariable) {
                continue;
            }
            let _varVal = '' + _var.value;

            // optimization
            if (skipVariable && skipVariable.value && skipVariable.value.indexOf(_var.title) === -1) {
                continue;
            }
            if (expression && expression.indexOf(_var.title) === -1) {
                continue;
            }

            if (_varVal.length === 0) {
                continue;
            }
            if (!this.isScript(_varVal) && _varVal.indexOf('\'') === -1) {
                _varVal = '\'' + _varVal + '\''
            } else if (this.isScript(_varVal)) {
                // _varVal = "''";
                _varVal = this.expressionModel.parseVariable(this, _var)
            }

            if (_varVal === '\'\'') {
                _varVal = '\'0\''
            }
            result += 'var ' + _var.title + ' = ' + _varVal + ';'
            result += '\n'
        }

        return result
    }
    /**
     * Convert from JSON data. Creates all Variables in this scope
     * @param data
     * @returns {Array}
     */
    variablesFromJson(data) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const variable = data[i];
            variable['scope'] = this
            if (!variable.declaredClass) {
                console.log('   variable has no class ')
                continue;
            }
            /*
            const _class = utils.replaceAll('.', '/', variable.declaredClass);
            const variableClassProto = require(_class);
            if (!variableClassProto) {
                continue;
            }
            result.push(new variableClassProto(variable)) // looks like a leak but the instance is tracked and destroyed in this scope
            */
        }
        return result
    }
    regenerateIDs(blocks) {
        const thiz = this;
        const updateChildren = block => {
            const newId = utils.createUUID();
            const children = thiz.getBlocks({
                parentId: block.id
            });
            if (children && children.length > 0) {
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    child.parentId = newId
                    updateChildren(child)
                }
            }
            block.id = newId
        };
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            updateChildren(block)
        }
    }
    /**
     * Clone blocks
     * @param blocks
     * @returns {module:xblox/model/Block[]}
     */
    cloneBlocks2(blocks, forceGroup) {
        let blocksJSON = this.blocksToJson(blocks);
        const tmpScope = this.owner.getScope(utils.createUUID(), null, false);
        let newBlocks = tmpScope.blocksFromJson(blocksJSON, false);
        const store = this.blockStore;
        newBlocks = tmpScope.allBlocks();
        tmpScope.regenerateIDs(newBlocks);
        blocksJSON = tmpScope.blocksToJson(newBlocks);
        if (forceGroup) {
            for (let i = 0; i < blocksJSON.length; i++) {
                const block = blocksJSON[i];
                if (block.parentId == null) { // groups are only needed for top level blocks
                    block.group = forceGroup;
                }
            }
        }
        const result = [];
        newBlocks = this.blocksFromJson(blocksJSON); // add it to our scope
        _.each(newBlocks, block => {
            result.push(store.getSync(block.id));
        })
        return result
    }
    /*
     * Clone blocks
     * @param blocks
     */
    cloneBlocks(blocks) {
        const blocksJSON = this.blocksToJson(blocks);
        const tmpScope = this.owner.getScope(utils.createUUID(), null, false);
        let newBlocks = tmpScope.blocksFromJson(blocksJSON, false);
        newBlocks = tmpScope.allBlocks()
        for (let i = 0; i < newBlocks.length; i++) {
            const block = newBlocks[i];
            block.id = utils.createUUID()
            block.parentId = null
        }

        this.blocksToJson(newBlocks)
        this.blocksFromJson(newBlocks) // add it us
        return newBlocks
    }
    /**
     *
     * @param block
     * @returns {Object}
     */
    blockToJson(block) {
        const blockOut = {
            // this property is used to recreate the child blocks in the JSON -> blocks process
            _containsChildrenIds: []
        };
        for (const prop in block) {
            if (prop === 'ctrArgs') {
                continue;
            }

            if (typeof block[prop] !== 'function' && !block.serializeField(prop)) {
                continue;
            }

            // copy all strings over
            if (_.isString(block[prop]) ||
                _.isNumber(block[prop]) ||
                _.isBoolean(block[prop])) {
                blockOut[prop] = block[prop]
            }
            // flatten children to ids. Skip "parent" field
            if (prop !== 'parent') {
                if (this.isBlock(block[prop])) {
                    // if the field is a single block container, store the child block's id
                    blockOut[prop] = block[prop].id

                    // register this field name as children ID container
                    blockOut._containsChildrenIds.push(prop)
                } else if (this.areBlocks(block[prop])) {
                    // if the field is a multiple blocks container, store all the children blocks' id
                    blockOut[prop] = []

                    for (let i = 0; i < block[prop].length; i++) {
                        blockOut[prop].push(block[prop][i].id)
                    }

                    // register this field name as children IDs container
                    blockOut._containsChildrenIds.push(prop)
                }
            }
        }

        return blockOut
    }
    /**
     * Serializes all blocks to JSON data.
     * It needs a custom conversation because we're having cyclic
     * object dependencies.
     * @returns {Array}
     */
    blocksToJson(data: any[] | undefined = null) {
        let result = [];
        data = data || this.getBlocks();
        data = data.map((b) => {
            if (b.subject) {
                return b.subject.getValue();
            } else {
                console.error('have no subject ', b);
            }
            return b;
        });
        try {
            // data = (data && data.length) ? data : (this.blockStore ? this.blockStore.data : this.blocks)
            // tslint:disable-next-line:forin
            data.forEach((data) => {
                const block = data;
                if (block.keys == null) {
                    //console.log('skip by keys', block);
                    // return;
                }
                if (block.serializeMe === false) {
                    console.log('skip seri', block);
                    return;
                }
                const blockOut = {
                    // this property is used to recreate the child blocks in the JSON -> blocks process
                    _containsChildrenIds: []
                };

                for (const prop in block) {
                    if (prop === 'ctrArgs') {
                        continue;
                    }

                    if (typeof block[prop] !== 'function' && block.serializeField && block.serializeField(prop) === false) {
                        continue;
                    }

                    // copy all strings over
                    if (_.isString(block[prop]) ||
                        _.isNumber(block[prop]) ||
                        _.isBoolean(block[prop])) {
                        blockOut[prop] = block[prop]
                    }

                    if (_.isObject(block[prop]) && block.serializeObject) {
                        if (block.serializeObject(prop) === true) {
                            blockOut[prop] = JSON.stringify(block[prop], null, 2)
                        }
                    }

                    // flatten children to ids. Skip "parent" field

                    if (prop !== 'parent') {
                        if (this.isBlock(block[prop])) {
                            // if the field is a single block container, store the child block's id
                            blockOut[prop] = block[prop].id

                            // register this field name as children ID container
                            blockOut._containsChildrenIds.push(prop)
                        } else if (this.areBlocks(block[prop])) {
                            // if the field is a multiple blocks container, store all the children blocks' id
                            blockOut[prop] = []

                            for (let i = 0; i < block[prop].length; i++) {
                                blockOut[prop].push(block[prop][i].id)
                            }

                            // register this field name as children IDs container
                            blockOut._containsChildrenIds.push(prop)
                        }
                    }
                }
                result.push(blockOut)
            });
        } catch (e) {
            console.error('from json failed : ' + e, e)
        }
        return result;
    }
    _createBlockStore() { }
    blockFromJson(block) {
        /*
        block['scope'] = this
        if (block._containsChildrenIds == null) {
            block._containsChildrenIds = []
        }

        // Store all children references into "children"
        const children = {};
        for (let cf = 0; cf < block._containsChildrenIds.length; cf++) {
            const propName = block._containsChildrenIds[cf];
            children[propName] = block[propName]
            block[propName] = null
        }
        delete block._containsChildrenIds

        // Create the block
        if (!block.declaredClass) {
            console.log('   not a class ')
            return null
        }
        let blockClassProto = null;
        let _class = null;
        try {
            _class = utils.replaceAll('.', '/', block.declaredClass)
            blockClassProto = require(_class)
        } catch (e) {
            try {
                _class = utils.replaceAll('/', '.', block.declaredClass)
                blockClassProto = require(_class)
            } catch (e) {
                debug && console.error('couldnt resolve class ' + _class)
            }
            debug && console.error('couldnt resolve class ' + _class)
        }
        if (!blockClassProto) {
            blockClassProto = dcl.getObject(block.declaredClass)
        }
        if (!blockClassProto) {
            debug && console.log('couldn`t resolve ' + _class)
            return null
        }

        let blockOut = null;
        try {
            blockOut = factory.createBlock(blockClassProto, block)
        } catch (e) {
            debug && console.error('error in block creation ', e)
            return null
        }

        // assign the children references into block._children
        blockOut._children = children

        return blockOut
        */
    }
    /**
     * Convert from JSON data. Creates all blocks in this scope
     * @param data
     * @returns {Array}
     */
    blocksFromJson(data, check: boolean = false, errorCB: (e) => void = null) {
        const resultSelected = [];
        const childMap = {};
        for (let i = 0; i < data.length; i++) {
            let block = data[i];
            block['scope'] = this;

            if (block._containsChildrenIds == null) {
                block._containsChildrenIds = []
            }

            // Store all children references into "children"
            const children = {};
            for (let cf = 0; cf < block._containsChildrenIds.length; cf++) {
                let propName = block._containsChildrenIds[cf]
                children[propName] = block[propName]
                block[propName] = null
            }
            delete block._containsChildrenIds

            // Create the block
            if (!block.declaredClass) {
                console.error('not a class')
                continue;
            }
            let _class = utils.replaceAll('.', '/', block.declaredClass);
            let blockClassProto = BlockMap[_class];
            if (!blockClassProto) {
                console.error('couldnt resolve ' + _class, block);
                blockClassProto = BlockMap['*'];
                errorCB('   couldnt resolve block: ' + block.declaredClass);
                continue;
            }

            let blockOut = null;
            try {
                blockOut = createBlock(blockClassProto, block, false);
            } catch (e) {
                console.error('error in block creation ', e + ' ' + block.declaredClass)
                continue;
            }

            // assign the children references into block._children
            blockOut._children = children
            childMap[blockOut.id] = children
            resultSelected.push(blockOut)
        }
        // 2nd pass, update child blocks
        const allBlocks = this.allBlocks();
        for (let i = 0; i < allBlocks.length; i++) {
            let block = allBlocks[i] as any;
            block._children = childMap[block.id]
            if (block._children) {
                // get all the block container fields
                for (let propName in block._children) {
                    if (typeof block._children[propName] === 'string') {
                        // single block
                        let child = this.getBlockById(block._children[propName])
                        if (!child) {
                            this.blockStore.removeSync(block._children[propName])
                            if (errorCB) {
                                errorCB(' couldnt resolve child: ' + block._children[propName] + '@' + block.name + ':' + block.declaredClass)
                            }
                            console.log(' couldnt resolve child: ' + block._children[propName] + '@' + block.name + ':' + block.declaredClass)
                            continue;
                        }
                        block[propName] = child
                        child.parent = block;
                        if (child.postCreate) {
                            child.postCreate()
                        }
                    } else if (typeof block._children[propName] === 'object') {
                        // multiple blocks
                        block[propName] = []
                        for (let j = 0; j < block._children[propName].length; j++) {
                            let child = this.getBlockById(block._children[propName][j])
                            if (!child) {
                                if (errorCB) {
                                    errorCB('   couldnt resolve child: ' + block._children[propName] + '@' + block.name + ':' + block.declaredClass)
                                }
                                console.log('   couldnt resolve child: ' + block._children[propName][j] + '@' + block.name + ':' + block.declaredClass)
                                continue;
                            }
                            block[propName].push(child)
                            const _parent = this.getBlockById(child.parentId);
                            if (_parent) {
                                child.parent = _parent
                            } else {
                                console.error('child has no parent')
                            }
                        }
                    }
                }
                delete block._children
            }

            if (check !== false && block.parentId != null) {
                const parent = this.getBlockById(block.parentId);
                if (parent == null) {
                    debug && console.error('have orphan block!', block)
                    block.parentId = null
                }
            }
            block.postCreate && block.postCreate();
        }

        const result = this.allBlocks();
        console.info('did create blocks', result);
        return resultSelected
    }
    /**
     *
     * @param url {String}
     * @returns {module:xblox/model/Block[]}
     */
    resolveDevice(url) {
        /*
        const blockScope = this;
        const ctx = this.ctx;
        const driver = this.driver;
        const device = this.device;
        const deviceManager = ctx.getDeviceManager()
        const driverManager = ctx.getDriverManager();

        if (url.indexOf('://') === -1) {
            const _block = this.getBlockById(url);
            if (_block) {
                return _block
            }
            return url
        }
        let parts = utils.parse_url(url); // strip scheme

        parts = utils.urlArgs(parts.host) // go on with query string
        let _device = deviceManager.getItemById(parts.device.value);
        // support device by name
        if (!_device) {
            const _instance = deviceManager.getInstanceByName(parts.device.value);
            if (_instance) {
                _device = _instance.device
            }
        }
        return device || _device;*/
    }

    /**
     *
     * @param url {String}
     * @returns {module:xblox/model/Block[]}
     */
    resolveBlock(url) {
        /*
        let blockScope = this;
        const ctx = this.ctx;
        let driver = this.driver;
        const device = this.device;
        const deviceManager = ctx.getDeviceManager();
        const driverManager = ctx.getDriverManager();

        if (url.indexOf('://') === -1) {
            const _block = this.getBlockById(url);
            if (_block) {
                return _block
            }
            return url
        }
        let parts = utils.parse_url(url); // strip scheme

        parts = utils.urlArgs(parts.host) // go on with query string
        let _device = deviceManager.getItemById(parts.device.value);
        // support device by name
        if (!_device) {
            const _instance = deviceManager.getInstanceByName(parts.device.value);
            if (_instance) {
                _device = _instance.device
            }
        }
        if (_device) {
            const info = deviceManager.toDeviceControlInfo(_device);
            if (!info) {
                console.warn('cant get device info for ' + _device.title, device);
                return;
            }

            driver = driverManager.getDriverById(info.driverId)
            const driverInstance = _device.driverInstance;
            if (driverInstance || driver) {
                blockScope = driverInstance ? driverInstance.blockScope : driver.blockScope
                const block = blockScope ? blockScope.getStore().getSync(parts.block.value) : null;
                if (block) {
                    return block
                }
            }
        }
        */
    }
    getBlock(id) {
        return this.getBlockById(id)
    }
    /***
     * Returns a block from the scope
     * @param name {String}
     * @return block {module:xblox/model/Block[]}
     */
    getBlockByName(name) {
        if (name.indexOf('://') !== -1) {
            let block = this.resolveBlock(name)
            if (block) {
                return block
            }
        }
        const allBlocks = this.getBlocks();
        for (let i = 0; i < allBlocks.length; i++) {
            let block = allBlocks[i]
            if (block.name === name) {
                return block
            }
        }
        const blocks = this.blockStore.query({
            name: name
        });
        return blocks && blocks.length > 0 ? blocks[0] : null
    }
    /***
     * Returns a block from the scope
     *
     * @param name  =>  block name
     * @return block
     */
    getBlockById(id) {

        const blocks = this.allBlocks();
        return _.find(blocks, {
            id: id
        });
        // return this.blockStore.getSync(id);

        /* || this.variableStore.getSync(id) */
    }
    /**
     * Returns an array of blocks
     * @param blocks {module:xblox/model/Block[]
     * @returns {module:xblox/model/Block[]}
     */
    _flatten(blocks) {
        const result = [];
        // tslint:disable-next-line:forin
        for (const b in blocks) {
            const block = blocks[b];
            if (block.keys == null) {
                continue;
            }
            result.push(block)
            for (const prop in block) {
                if (prop === 'ctrArgs') {
                    continue;
                }
                // flatten children to ids. Skip "parent" field
                if (prop !== 'parent') {
                    if (this.isBlock(block[prop])) {
                        // if the field is a single block container, store the child block's id
                        result.push(block[prop])
                    } else if (this.areBlocks(block[prop])) {
                        for (let i = 0; i < block[prop].length; i++) {
                            result.push(block[prop][i])
                        }
                    }
                }
            }
        }
        return result
    }
    /**
     *
     * @param blocks {module:xblox/model/Block[]}
     * @returns {module:xblox/model/Block[]}
     */
    flatten(blocks) {
        let result = [];
        // tslint:disable-next-line:forin
        for (const b in blocks) {
            const block = blocks[b];

            if (block.keys == null) {
                continue;
            }
            let found = _.find(result, {
                id: block.id
            });

            if (found) {
                // console.error('already in array  : ' +found.name);
            } else {
                result.push(block)
            }

            for (const prop in block) {
                if (prop === 'ctrArgs') {
                    continue;
                }
                // flatten children to ids. Skip "parent" field
                if (prop !== 'parent') {
                    const value = block[prop];
                    if (this.isBlock(value)) {
                        // if the field is a single block container, store the child block's id
                        found = _.find(result, {
                            id: value.id
                        })
                        if (found) {

                        } else {
                            result.push(value)
                        }
                    } else if (this.areBlocks(value)) {
                        for (let i = 0; i < value.length; i++) {
                            const sBlock = value[i];
                            found = _.find(result, {
                                id: sBlock.id
                            })
                            if (found) { } else {
                                result.push(sBlock)
                            }
                            result = result.concat(this.flatten([sBlock]))
                        }
                    }
                }
            }
        }
        // `result = _.uniq(result, false, item => item.id)
        result = _.uniqBy(result, item => item.id);
        return result
    }
    _getSolve(block) {
        return block.prototype ? block.prototype.solve : block.__proto__.solve
    }
    solveBlock(mixed: any, settings: any, force: boolean, isInterface: boolean = false) {
        console.log('solve block', mixed);
        settings = settings || {
            highlight: false
        }
        let block: Block = null;
        if (_.isString(mixed)) {
            block = this.getBlockByName(mixed)
            if (!block) {
                block = this.getBlockById(mixed)
            }
        } else if (_.isObject(mixed)) {
            block = mixed
        }
        let result = null;
        if (block) {
            if (settings.force !== true && block.enabled === false) {
                return null
            }
            if (settings.force === true) {
                settings.force = false
            }
            const _class = utils.replaceAll('/', '.', block.declaredClass);
            const _module = BlockMap[_class];
            if (_module) {
                if (_module.prototype && _module.prototype.solve) {
                    result = _module.prototype.solve.apply(block, [this, settings])
                }
            } else {
                result = block.solve(block.getScope(), settings, force, isInterface)
                delete block.override
                block.override = {}
            }
        } else {
            debug && console.error('solving block failed, have no block! ', mixed)
        }
        return result
    }
    /***
     * Solves all the commands into [items]
     *
     * @param manager   =>  BlockManager
     * @return  list of commands to send
     */
    solve(scope, settings) {
        let ret = '';
        for (let n = 0; n < this.items.length; n++) {
            ret += this.items[n].solve(scope, settings)
        }
        return ret
    }
    /***
     * Parses an expression
     *
     * @param expression
     * @returns {String} parsed expression
     */
    /**
     *
     * @param expression
     * @param addVariables
     * @param variableOverrides
     * @param runCallback
     * @param errorCallback
     * @param context
     * @param args
     * @returns {*}
     */
    parseExpression(expression: string, addVariables?: boolean, variableOverrides?: any, runCallback?: any, errorCallback?: any, context?: any, args?: any[], flags?: any) {
        return this.getExpressionModel().parse(this, expression, addVariables, runCallback, errorCallback, context, variableOverrides, args, flags)
    }
    isBlock(a) {
        let ret = false;

        if ((typeof a === 'object') && (a != null) && (a.length === undefined)) {
            if (a.serializeMe) {
                ret = true
            }
        }
        return ret
    }
    areBlocks(a) {
        let ret = false;

        if ((typeof a === 'object') && (a != null) && (a.length > 0)) {
            if (this.isBlock(a[0])) {
                ret = true
            }
        }
        return ret
    }
    /**
     *
     * @private
     */
    _onVariableChanged(evt) {
        if (evt.item && this.getExpressionModel().variableFuncCache[evt.item.title]) {
            delete this.expressionModel.variableFuncCache[evt.item.title]
        }
    }

    init() {
        this.getExpressionModel() // create
        this.on(EVENTS.ON_DRIVER_VARIABLE_CHANGED, this._onVariableChanged);
    }
    /**
     *
     */
    _destroy() {
        const allblocks = this.allBlocks();
        for (let i = 0; i < allblocks.length; i++) {
            const obj = allblocks[i] as any;
            if (!obj) {
                continue;
            }
            try {
                if (obj && obj.stop) {
                    obj.stop(true)
                }

                if (obj && obj.reset) {
                    obj.reset()
                }
                if (obj && obj._destroy) {
                    obj._destroy()
                }
                if (obj && obj.destroy) {
                    obj.destroy()
                }
                /*
                    if (obj._emit) {
                        obj._emit(EVENTS.ON_ITEM_REMOVED, {
                            item: obj
                        })
                    }
                    */
            } catch (e) {
                debug && console.error('Scope::_destroy: error destroying block ' + e.message, obj ? (obj.id + ' ' + obj.name) : 'empty')
                debug && console.trace()
            }
        }
    }
    destroy() {
        this._destroy()
        this.reset()
        this._destroyed = true
        delete this.expressionModel
    }
    moveTo(source, target, before, add) {
        console.log('move to : ', arguments);
        /**
         * treat first the special cases of adding an item
         */
        if (add) {
            // remove it from the source parent and re-parent the source
            if (target.canAdd && target.canAdd()) {
                let sourceParent = this.getBlockById(source.parentId)
                if (sourceParent) {
                    sourceParent.removeBlock(source, false)
                }
                return target.add(source, null, null);
            } else {
                console.error('cant reparent')
                return false
            }
        }

        // for root level move
        if (!target.parentId && add === false) {
            // if source is part of something, we remove it
            let sourceParent = this.getBlockById(source.parentId);
            if (sourceParent && sourceParent.removeBlock) {
                sourceParent.removeBlock(source, false);
                source.parentId = null;
                source.group = target.group
            }

            const itemsToBeMoved = [];
            const groupItems = this.getBlocks({
                group: target.group
            });

            const rootLevelIndex = [];
            const store = this.getBlockStore();

            const sourceIndex = store.storage.index[source.id];
            const targetIndex = store.storage.index[target.id];
            for (let i = 0; i < groupItems.length; i++) {
                const item = groupItems[i];
                // keep all root-level items

                if (groupItems[i].parentId == null && // must be root
                    // tslint:disable-next-line:triple-equals
                    groupItems[i] != source // cant be source
                ) {
                    const itemIndex = store.storage.index[item.id];
                    let add = before ? itemIndex >= targetIndex : itemIndex <= targetIndex;
                    if (add) {
                        itemsToBeMoved.push(groupItems[i]);
                        rootLevelIndex.push(store.storage.index[groupItems[i].id])
                    }
                }
            }

            // remove them the store
            for (let j = 0; j < itemsToBeMoved.length; j++) {
                store.remove(itemsToBeMoved[j].id)
            }

            // remove source
            this.getBlockStore().remove(source.id);

            // if before, put source first
            if (before) {
                this.getBlockStore().putSync(source)
            }

            // now place all back
            for (let j = 0; j < itemsToBeMoved.length; j++) {
                store.put(itemsToBeMoved[j])
            }

            // if after, place source back
            if (!before) {
                this.getBlockStore().putSync(source)
            }
            return true;
            // we move from root to lower item
        } else if (!source.parentId && target.parentId && add === false) {
            source.group = target.group;

            // we move from root to into root item
        } else if (!source.parentId && !target.parentId && add) {
            if (target.canAdd && target.canAdd()) {
                source.group = null;
                target.add(source, null, null)
            }
            return true;

            // we move within the same parent
        } else if (source.parentId && target.parentId && add === false && source.parentId === target.parentId) {
            const parent = this.getBlockById(source.parentId);
            if (!parent) {
                return false
            }
            let items = parent[parent._getContainer(source)];
            let cIndexSource = source.indexOf(items, source);
            let cIndexTarget = source.indexOf(items, target);
            let direction = cIndexSource > cIndexTarget ? -1 : 1;
            let distance = Math.abs(cIndexSource - (cIndexTarget + (before === true ? -1 : 1)))
            for (let i = 0; i < distance - 1; i++) {
                source.move(direction);
            }
            return true;
            // we move within the different parents
        } else if (source.parentId && target.parentId && add === false && source.parentId !== target.parentId) {
            let sourceParent = this.getBlockById(source.parentId);
            if (!sourceParent) {
                return false
            }

            const targetParent = this.getBlockById(target.parentId);
            if (!targetParent) {
                return false
            }

            // remove it from the source parent and re-parent the source
            if (sourceParent && sourceParent.removeBlock && targetParent.canAdd && targetParent.canAdd()) {
                sourceParent.removeBlock(source, false);
                targetParent.add(source, null, null)
            } else {
                return false
            }

            // now proceed as in the case above : same parents
            let items = targetParent[targetParent._getContainer(source)];
            if (items == null) {
                console.error('weird : target parent has no item container')
            }
            let cIndexSource = targetParent.indexOf(items, source);
            let cIndexTarget = targetParent.indexOf(items, target);
            if (!cIndexSource || !cIndexTarget) {
                console.error(' weird : invalid drop processing state, have no valid item indicies')
                return
            }
            let direction = cIndexSource > cIndexTarget ? -1 : 1;
            let distance = Math.abs(cIndexSource - (cIndexTarget + (before === true ? -1 : 1)))
            for (let i = 0; i < distance - 1; i++) {
                targetParent.move(direction);
            }
            return true
        }

        return false
    }
}
