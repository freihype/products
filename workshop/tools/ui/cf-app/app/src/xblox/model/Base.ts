import { EventEmitter } from 'events';
import * as types from '../types';
import * as utils from '../../shared';
import * as MD5 from 'md5';
import * as _ from 'lodash';
import { remove } from '@xblox/core/arrays';
import { v4 } from 'uuid';

/**
 * The model mixin for a block
 * @class module:xblox.model.ModelBase
 */
export class Model extends EventEmitter {
    declaredClass: string = 'xblox.model.ModelBase';
    id: string = 'noid';
    description: '';
    parent: any = null;
    parentId: string = '';
    group: string = '';
    order: number = 0;
    _store: any = null;
    ////////////////////////////////////////////////////////////
    //
    //  Functions to expose out & in - lets
    //
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    //
    //  Functions to expose outlets
    //
    ////////////////////////////////////////////////////////////
    /***
     * Standard constructor for all sub classing blocks
     * @param {array} args
     */
    constructor(args) {
        super();
        //simple mixin of constructor arguments
        for (const prop in args) {
            if (args.hasOwnProperty(prop)) {
                this[prop] = args[prop];
            }
        }
        if (!this.id) {
            this.id = v4();
        }
    }
    ////////////////////////////////////////////////////////////
    //
    //  Standard tools
    //
    ////////////////////////////////////////////////////////////
    keys(a) {
        const b = [];
        // tslint:disable-next-line:forin
        for (const c in a) {
            b.push(c);
        }
        return b;
    }
    values(b) {
        const a = [];
        // tslint:disable-next-line:forin
        for (const c in b) {
            a.push(b[c]);
        }
        return a;
    }
    createUUID: () => string = v4;
    canEdit() {
        return true;
    }
    getFields() {
        return null;
    }
    isString(a) {
        return typeof a === 'string'
    }
    isNumber(a) {
        return typeof a === 'number'
    }
    isBoolean(a) {
        return typeof a === 'boolean'
    }
    isObject: (...rest) => boolean = _.isObject
    isArray: (...rest) => boolean = _.isArray
    getValue(val) {
        const _float = parseFloat(val);
        if (!isNaN(_float)) {
            return _float;
        }
        if (val === 'true' || val === true) {
            return true;
        }
        if (val === 'false' || val === false) {
            return false;
        }
        return val;
    }
    isScript(val) {
        return this.isString(val) && (
            val.indexOf('return') !== -1 ||
            val.indexOf(';') !== -1 ||
            val.indexOf('(') !== -1 ||
            val.indexOf('+') !== -1 ||
            val.indexOf('-') !== -1 ||
            val.indexOf('<') !== -1 ||
            val.indexOf('*') !== -1 ||
            val.indexOf('/') !== -1 ||
            val.indexOf('%') !== -1 ||
            val.indexOf('=') !== -1 ||
            val.indexOf('==') !== -1 ||
            val.indexOf('>') !== -1 ||
            val.indexOf('[') !== -1 ||
            val.indexOf('{') !== -1 ||
            val.indexOf('}') !== -1
        );
    }
    replaceAll(find, replace, str) {
        if (this.isString(str)) {
            return str.split(find).join(replace);
        }
        return str;
    }
    isInValidState() {
        return true;
    }
    destroy() { }
}
