import { Contains, EVENTS, Block, BLOCK_OUTLET } from '../';
import { EVENTS as CoreEvents } from '../../shared';
import * as utils from '../../shared';
import * as _ from 'lodash';
import * as types from '../types';

const debug = true;
/**
 * The command model. A 'command' consists out of a few parameters and a series of
 *  XCF - Command - Block expressions. Those expressions need to be evaluated before send them to the device
 * @class module:xcf/model/Command
 * @augments module:xide/mixins/EventedMixin
 * @extends module:xblox/model/Block_UI
 * @extends module:xblox/model/Block
 * @extends module:xblox/model/ModelBase
 */
export class Command extends Contains {
    lastCommand: string;
    declaredClass: string = 'xcf.model.Command';
    isCommand: boolean = true;
    /**
     *  3.12.10.3. The “Startup” checkbox indicates whether or not the associated command
     *  should be automatically sent at startup once communications have been established
     *  with the device.
     * @type {Boolean}
     */
    startup: boolean = false;
    /**
     * 3.12.10.3. The “Auto” field is used to set a time interval at which the command is
     * automatically continually sent when necessary for applications such as polling.
     * @type {Boolean}
     */
    auto: boolean = false;
    /**
     * 3.12.10.3. “Send” field containing the actual string or hexadecimal sequence used to communicate with the device.
     * @type {String}
     */
    send: string = '';
    /**
     * Name of the block
     * @type {String}
     */
    name: string = 'No Title';
    observed: [
        'send'
    ]
    interval: string = '';
    flags: number = 0x00000800;
    _runningDfd: any = null;
    __started: boolean = false;
    _solving: any;
    getItems(outletType) {
        return this.getItemsByType(outletType);
    }
    /**
     * onCommandFinish will be excecuted which a driver did run a command
     * @param msg {object}
     * @param msg.id {string} the command job id
     * @param msg.src {string} the source id, which is this block id
     * @param msg.cmd {string} the command string being sent
     */
    onCommandFinish(msg) {
        const result = {};
        let dfd = null;
        if (msg.params && msg.params.id) {
            const id = msg.params.id;
            dfd = this.getDeferred(id);
            delete this._solving[id];
            msg.lastResponse && this.storeResult(msg.lastResponse);
            this.emit('finished', {
                msg: msg,
                result: this._lastResult
            });
        }
        const items = this.getItems(BLOCK_OUTLET.FINISH);
        if (items.length) {
            this.runFrom(items, 0, this._lastSettings);
        }
        this.resolve(result);
        this.onSuccess(this, this._lastSettings);
        if (dfd) {
            dfd.resolve(this._lastResult);
        }
        return this._lastResult;
    }
    /**
     * onCommandPaused
     * @param msg {object}
     * @param msg.id {string} the command job id
     * @param msg.src {string} the source id, which is this block id
     * @param msg.cmd {string} the command string being sent
     */
    onCommandPaused(msg) {
        const params = msg.params;
        if (params && params.id) {
            msg.lastResponse && this.storeResult(msg.lastResponse);
            this.emit('paused', {
                msg: msg,
                result: this._lastResult,
                id: params.id
            });
        }
        const items = this.getItems(BLOCK_OUTLET.PAUSED);
        if (items.length) {
            this.runFrom(items, 0, this._lastSettings);
        }
    }
    /**
     * onCommandPaused
     * @param msg {object}
     * @param msg.id {string} the command job id
     * @param msg.src {string} the source id, which is this block id
     * @param msg.cmd {string} the command string being sent
     */
    onCommandStopped(msg) {
        this.reset();
        const params = msg.params;
        if (params && params.id) {
            this.emit('stopped', {
                msg: msg,
                result: this._lastResult,
                id: params.id
            });
        }
        const items = this.getItems(BLOCK_OUTLET.STOPPED);
        if (items.length) {
            this.runFrom(items, 0, this._lastSettings);
        }
    }
    /**
     * onCommandFinish will be excecuted which a driver did run a command
     * @param msg {object}
     * @param msg.id {string} the command job id
     * @param msg.src {string} the source id, which is this block id
     * @param msg.cmd {string} the command string being sent
     */
    onCommandProgress(msg) {
        const params = msg.params;
        if (params && params.id) {
            msg.lastResponse && this.storeResult(msg.lastResponse);
            this.emit('progress', {
                msg: msg,
                result: this._lastResult,
                id: params.id
            });
        }
        const items = this.getItems(BLOCK_OUTLET.PROGRESS);
        if (items.length) {
            this.runFrom(items, 0, this._lastSettings);
        }
    }

    storeResult(lastResponse) {
        const data = utils.getJson(lastResponse, null, false);
        let result = null;
        if (data && data.result && _.isString(data.result)) {
            const str = data.result;
            const isJSON = str.indexOf('{') !== -1 || str.indexOf('[') !== -1;
            let lastResult = str;
            if (isJSON) {
                const tmp = utils.getJson(str, true, false);
                if (tmp) {
                    lastResult = tmp;
                }
            }
            // tslint:disable-next-line:prefer-conditional-expression
            if (lastResult !== null) {
                this._lastResult = result = lastResult;
            } else {
                this._lastResult = null;
            }
        }
        return result;
    }
    resolve(data) {
        data = data || this._lastResult;
        if (this._runningDfd) {
            this._runningDfd.resolve(data);
        }
    }
    onCommandError(msg) {
        const params = msg.params;
        if (params.id) {
            msg.lastResponse && this.storeResult(msg.lastResponse);
            this.emit('cmd:' + msg.cmd + '_' + params.id, msg);
            this.emit('error', {
                msg: msg,
                result: this._lastResult,
                id: params.id
            });
        }
        this.onFailed(this, this._settings);
        const items = this.getItems(types.BLOCK_OUTLET.ERROR);
        if (items.length) {
            this.runFrom(items, 0, this._lastSettings);
        }
    }
    sendToDevice(msg: string, settings: any = {}, stop: boolean = false, pause: boolean = false, id: string = '') {
        if (this._destroyed) {
            return;
        }
        msg = this.replaceAll('\'', '', msg);
        id = id || utils.createUUID();
        const self = this;
        const wait = (this.flags & types.CIFLAG.WAIT) ? true : false;
        this.lastCommand = '' + msg;
        if (!this.scope.instance) {
            debug && console.error('have no device!');
            this.emit('status', {
                text: 'Command ' + this.name + ' : have no device',
                type: 'error',
                delay: 1000
            });
            return false;
        } else {
            if (wait) {
                this.on('cmd:' + msg + '_' + id, msg => {
                    if (msg.error) {
                        self.onFailed(self, settings);
                    } else {
                        self.onSuccess(self, settings);
                    }
                });
            }
            this.scope.instance.sendMessage(msg, null, this.id, id, wait, stop, pause, this.getSendOptions());
        }
        return id;
    }
    reset() {
        delete this._runningDfd;
        this._lastSettings = {};
        if (this._loop) {
            clearTimeout(this._loop);
            this._loop = null;
        }
        delete this.override; this.override = null;
        delete this._lastResult; this.override = null;
        this.override = {};
    }
    addDeferred(id) {
        if (!this._solving) {
            this._solving = {};
        }
        // this._solving[id] = new Deferred();
        return this._solving[id];
    }
    getDeferred(id) {
        if (!this._solving) {
            this._solving = {};
        }
        return this._solving[id];
    }
    getSendOptions() {
        let result = {};
        const DriverModule = this.getDriverModule();
        if (DriverModule && DriverModule.getCommandArgs) {
            result = DriverModule.getCommandArgs(this) || result;
        }
        return result;
    }
    _resolve(string: string, settings: any = {}, useDriverModule: boolean = false) {
        if (_.isNumber(string) || _.isBoolean(string)) {
            return string;
        }
        const scope = this.scope;
        let value = string || this._get('send');
        settings = settings || {};
        const flags = settings.flags || this.flags;
        const parse = !(flags & types.CIFLAG.DONT_PARSE);
        const isExpression = (flags & types.CIFLAG.EXPRESSION);
        if (flags & types.CIFLAG.TO_HEX) {
            value = utils.to_hex(value);
        }

        if (parse !== false) {
            value = utils.convertAllEscapes(value, 'none');
        }

        settings = settings || this._lastSettings || {};
        const override = settings.override || this.override || {};
        const _overrides = (override && override.variables) ? override.variables : null;
        if (_overrides) {
            for (const prop in _overrides) {
                if (_.isNumber(_overrides[prop])) {
                    _overrides[prop] = Math.round(_overrides[prop]);
                }
            }
        }
        let res = '';
        const DriverModule = this.getDriverModule();
        if (DriverModule && DriverModule.resolveBefore && useDriverModule !== false) {
            value = DriverModule.resolveBefore(this, value) || value;
        }
        // tslint:disable-next-line:prefer-conditional-expression
        if (isExpression && parse !== false) {
            res = scope.parseExpression(value, null, _overrides, null, null, null, override.args);
        } else {
            res = '' + value;
        }
        if (DriverModule && DriverModule.resolveAfter && useDriverModule !== false) {
            res = DriverModule.resolveAfter(this, res) || res;
        }
        return res;
    }
    /**
     *
     * @param scope
     * @param settings
     * @param isInterface
     * @param send
     * @returns {*}
     */
    solve(scope: any, settings: any = {}, force?: boolean, isInterface: boolean = false, send: string = null) {
        let dfd = null;
        scope = scope || this.scope;
        settings = this._lastSettings = settings || this._lastSettings || {};
        if (settings && settings.override && settings.override.mixin) {
            _.extend(this.override, settings.override.mixin);
        }
        let value = send || this._get('send') || this.send;
        const parse = !(this.flags & types.CIFLAG.DONT_PARSE);
        const wait = (this.flags & types.CIFLAG.WAIT) ? true : false;
        const id = utils.createUUID();

        if (this.flags & types.CIFLAG.TO_HEX) {
            value = utils.to_hex(value);
        }

        if (parse !== false) {
            value = utils.convertAllEscapes(value, 'none');
        }

        if (!this.enabled && isInterface !== true) {
            this.reset();
            return;
        }

        //we're already running
        if (isInterface === true && this._loop) {
            this.reset();
        }
        if (wait !== true) {
            this.onRun(this, settings);
        } else {
            this.onRun(this, settings, {
                timeout: false
            });
            dfd = this.addDeferred(id);
        }
        if (this.items && this.items.length > 0) {
            if (value && value.length > 0) {
                let res = this._resolve(this.send, settings);
                if (res && res.length > 0) {
                    if (!this.sendToDevice(res, settings)) {
                        this.onFailed(this, settings);
                    } else {
                        this.onSuccess(this, settings);
                    }
                }
            }
            if (wait) {
                return dfd;
            }
            const ret = [];

            for (const block of this.items) {
                if (block.enabled) {
                    ret.push(block.solve(scope, settings));
                }
            }

            return ret;
        } else if (value.length > 0) {
            let res = this._resolve(this.send, settings);
            if (res && res.length > 0) {
                if (!this.sendToDevice(res, settings, null, null, id)) {
                    this.onFailed(this, settings);
                }
            }
            if (wait !== true) {
                this.onSuccess(this, settings);

            } else {
                this._settings = settings;
            }
            if (isInterface) {
                if (this.auto && this.getInterval() > 0) {
                    this.scope.loopBlock(this, settings);
                }
            }
            return !wait ? [res] : dfd;
        }
        return false;
    }

    canAdd() {
        return true;
    }

    mayHaveChildren() {
        return this.items != null && this.items.length > 0;
    }
    /**
     * Store function override
     * @returns {Array}
     */
    getChildren(): Array<any> {
        return this.items;
    }
    hasInlineEdits: true
    getIcon(...rest) { return '' }
    toText(icon, label, detail, breakDetail) {
        let out = '';
        if (icon !== false) {
            out += '<span class=\'text-primary inline-icon\'>' + this.getBlockIcon() + '</span>';
        }
        label !== false && (out += '' + this.makeEditable('name', 'bottom', 'text', 'Enter a unique name', 'inline') + '');
        breakDetail === true && (out += '<br/>');
        detail !== false && (out += ('<span class=\'text-muted small\'> Send:<kbd class=\'text-warning\'>' + this.makeEditable('send', 'bottom', 'text', 'Enter the string to send', 'inline')) + '</kbd></span>');
        if (icon !== false) {
            this.startup && (out += this.getIcon('fa-bell inline-icon text-warning', 'text-align:right;float:right;', ''));
            this.auto && this.getInterval() > 0 && (out += this.getIcon('fa-clock-o inline-icon text-warning', 'text-align:right;float:right', ''));
        }
        out = this.getDriverToText(out) || out;
        return out;
    }
    getInterval() {
        return parseInt(this.interval, 10);
    }
    start() {
        if (this.startup && !this.auto) {
            this.solve(this.scope);
        } else if (this.auto && this.getInterval() > 0) {
            this.scope.loopBlock(this);
        }
    }
    /**
     * Return the driver's code module
     * @returns {module:xcf/driver/DriverBase|null}
     */
    getDriverModule() {
        let DriverModule = null;
        const instance = this.getInstance();
        if (instance) {
            DriverModule = instance.Module;
        } else {
            const driver = this.getScope().driver;
            if (driver && driver.Module) {
                DriverModule = driver.Module;
            }
        }
        return DriverModule;
    }
    getDriverToText(text) {
        const DriverModule = this.getDriverModule();
        if (DriverModule && DriverModule.toText) {
            return DriverModule.toText(this, text);
        }
    }
    getDriverFields(fields) {
        const DriverModule = this.getDriverModule();
        let result = [];
        if (DriverModule && DriverModule.getFields) {
            result = DriverModule.getFields(this, fields) || [];
        }
        return result;
    }
    getFields() {
        /*
        let fields = this.inherited(arguments) || this.getDefaultFields();
        const thiz = this;
        fields.push(this.utils.createCI('name', 13, this.name, {
            group: 'General',
            title: 'Name',
            dst: 'name',
            order: 200
        }));
        fields.push(this.utils.createCI('startup', 0, this.startup, {
            group: 'General',
            title: 'Send on Startup',
            dst: 'startup',
            order: 199
        }));
        fields.push(this.utils.createCI('auto', 0, this.auto, {
            group: 'General',
            title: 'Auto Send',
            dst: 'auto',
            order: 198
        }));
        fields.push(this.utils.createCI('interval', 13, this.interval, {
            group: 'General',
            title: 'Interval',
            dst: 'interval',
            order: 197
        }));
        fields.push(this.utils.createCI('send', types.ECIType.EXPRESSION_EDITOR, this.send, {
            group: 'Send',
            title: 'Send',
            dst: 'send',
            widget: {
                instantChanges: false,
                allowACECache: true,
                showBrowser: false,
                showSaveButton: true,
                style: 'height:inherit;',
                editorOptions: {
                    showGutter: false,
                    autoFocus: false
                },
                aceOptions: {
                    hasEmmet: false,
                    hasLinking: false,
                    hasMultiDocs: false
                },
                item: this
            },
            delegate: {
                runExpression(val, run, error) {
                    return thiz.scope.expressionModel.parse(thiz.scope, val, false, run, error);
                }
            }
        }));
        fields.push(this.utils.createCI('flags', 5, this.flags, {
            group: 'General',
            title: 'Flags',
            dst: 'flags',
            data: [
                {
                    value: 0x000001000,
                    label: 'Dont parse',
                    title: 'Do not parse the string and use it as is'
                },
                {
                    value: 0x00000800,//2048
                    label: 'Expression',
                    title: 'Parse it as Javascript'
                },
                {
                    value: 0x000008000,
                    label: 'Wait',
                    title: 'Wait for response'
                }
            ],
            widget: {
                hex: true
            }
        }));
        fields = fields.concat(this.getDriverFields(fields));
        return fields;
        */
    }
    // icon =  'fa-exclamation';
    getIconClass() {
        return 'el-icon-play-circle';
    }
    getBlockIcon() {
        return '<span class="' + this.icon + '"></span> ';
    }
    canEdit() {
        return true;
    }
    onChangeField(field, newValue, cis) {
        const interval = this.getInterval();
        if (field === 'auto') {
            if (newValue === true) {
                interval > 0 && this.scope.loopBlock(this);
            } else {
                if (this._loop) {
                    this.reset();
                }
            }
        }
        if (field === 'enabled') {
            if (newValue === false) {
                this.reset();
            } else {
                if (interval) {
                    this.scope.loopBlock(this);
                }
            }
        }
        if (field === 'interval') {
            if (interval > 0 && this.auto) {
                this.scope.loopBlock(this);
            } else {
                this.reset();
            }
        }
        // this.inherited(arguments);
    }
    destroy() {
        this.reset();
    }
    pause() {
        const last = this.lastCommand || this._resolve(this.send, this._lastSettings);
        if (last !== null) {
            this.sendToDevice(last, this._lastSettings, false, true);
        }
    }
    stop(isDestroy) {
        if (isDestroy === true) {
            return;
        }
        this.onSuccess(this, {
            highlight: true
        });
        this.resolve('');
        const last = this.lastCommand || this._resolve(this.send, this._lastSettings);
        if (!_.isEmpty(last)) {
            this.sendToDevice(last, this._lastSettings, true, false);
        }
        delete this._runningDfd;
    }
    getProperties(): any {
        return {
            send: 'string'
        };
    }
}
