import { DRIVER_FLAGS, EVENTS, RESPONSE_SETTINGS, COMMAND_SETTINGS } from '../shared';
import * as utils from '../shared';
import { EventEmitter } from 'events';
import * as _ from 'lodash';
import { remove } from '@xblox/core/arrays';
import { IDevice } from '../types';
//////////////////////////////////////////////////////////
//
//  Constants
//
const isServer = true;
const isIDE = false;
const _debug = false;
const MAX_BUFFER_COUNT = 1024;

//////////////////////////////////////////////////////////
//
//  Helpers
//

/**
 *
 * @param buffer {integer[]}
 * @returns {string}
 */
function toString(buffer) {
    let result = '';
    for (let i = 0; i < buffer.length; i++) {
        result += String.fromCharCode(buffer[i]);
    }
    return result;
}

/**
 * Compare 2 buffers
 * @param arr1 {integer[]}
 * @param arr2 {integer[]}
 * @returns {boolean}
 */
function isEqual(arr1, arr2) {
    const isArray = Array.isArray;
    if (!isArray(arr1) || !isArray(arr2) || arr1.length !== arr2.length) {
        return false;
    }
    const l = arr1.length;
    for (let i = 0; i < l; i += 1) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

//////////////////////////////////////////////////////////
//
//  Implementation
//

/**
 * Driver Base Class
 *
 * @class module:xcf/driver/DriverBase
 */
export class DriverInstance extends EventEmitter {

    constructor(device: IDevice) {
        super();
        this.sendSettings = (device.commandSettings as any) as COMMAND_SETTINGS;
        this.responseSettings = (device.settings as any) as RESPONSE_SETTINGS;
    }

    declaredClass: 'system_drivers/DriverBase'
    /**
     * The xBlox scope object for this driver. It contains all commands, variables and settings. You can blocks
     * through here
     * @private
     * @access private
     */
    blockScope: any;

    _destroyed: boolean = false;
    /**
     * Our delegate is in charge to send messages
     * @private
     * @access private
     */
    delegate: any;
    /**
     * @type {string}
     * @default \r
     */
    lineBreak: string = '\r';

    /**
     * sendSettings contains the constants for receiving and sending data to a device
     * its being set at initialization time and has this structure:
     * @example
     * @type {object}
     */
    sendSettings: COMMAND_SETTINGS;
    /**
     * responseSettings contains the constants for receiving data from a device
     * its being set at initialization time and has this structure:
     * @example
     * @type {object}
     */
    responseSettings: any;
    /**
     * currently outgoing message queue
     * @private
     * @type {message[]}
     */
    outgoing: any[];
    /**
     * currently incoming message queue
     * @private
     * @type {message[]}
     */
    incoming: any[];
    /**
     * incoming message string
     * @private
     * @type {string|null}
     */
    incomingBuf: string;

    bytesIncomeBuf: any;
    // reference to a Javascript timer object, used for sending outgoing messages. private!
    /**
     * @private
     */
    queueTimer: any;
    /**
     * private!in case processOutgoing is busy
     * @private
     */
    busy: boolean = false;

    _lastInterval: any;
    _onReplyTimeout: any;
    onReplyStatus: boolean = false;
    /**
     * Method to add a logging message.
     *
     * @param level {string} This can be error, warning, info, trace or custom
     * @param type {string} An additional string, by default this is set to "Device"
     * @param message {string} The message it self
     * @param data {object} An optional object/data you want to include
     *
     * @example
     *
     */
    log(level, type, message, data) {
        // return this.inherited(arguments);
    }
    /**
     * Callback when we got changed by an external editor or the IDE.
     */
    onReloaded(evt) {
    }
    /***
     * Unescape string from line breaks
     * @param str
     * @returns {*}
     */
    unescape(str) {

        str = utils.convertAllEscapes(str, 'none');
        try {
            if (str) {
                //return JSON.parse('"' + str + '"');
            }
        } catch (e) {
            console.error('-bad');
        }
        const _a2 = str.length;
        return str;
    }
    complete(str, _end) {
        const end = JSON.parse('"' + _end + '"');
        let out = '' + str;
        for (let i = 0; i < end.length; i++) {
            let hex = end.charCodeAt(i);
            hex = String.fromCharCode(hex);
            out += hex;
        }
        out = utils.convertAllEscapes(out, 'none');
        return out;
    }
    completeBegin(str, _start) {
        const end = JSON.parse('"' + _start + '"');
        let begin = '';

        const out = '' + str;

        for (let i = 0; i < end.length; i++) {
            let hex = end.charCodeAt(i);
            hex = String.fromCharCode(hex);
            begin += hex;
        }
        return utils.convertAllEscapes(begin, 'none') + out;
    }
    /**
     * Surround command with 'start' and 'end' constant, specified in the command settings
     * of the driver.
     * @param msg
     * @param toBuffer {boolean} Return a buffer, serialized with commas : '01,02,03'
     * @returns {*|string|String}
     */
    prepareMessage(msg: string, toBuffer: boolean = true) {
        let _m = '' + msg;
        // add 'start'
        if (this.sendSettings.start) {
            _m = '' + this.completeBegin('' + msg, this.sendSettings.start);
        }
        // add 'end'
        if (this.sendSettings.end) {
            _m = this.complete(_m, this.sendSettings.end);
        }
        return toBuffer !== false ? utils.stringToBufferStr(_m) : _m;
    }

    /***
     * Process outgoing sends last message from this.outgoing
     * @param force
     */
    processOutgoing(force: boolean = false) {
        //if mode == 1 its on reply, if mode ===false its on interval
        const mode = this.sendSettings.sendMode;

        if (force === true || mode) {
            this.busy = false;
        }

        //locked?
        if (this.busy) {
            _debug && console.log('busy, abort');
            return;
        }
        this.busy = true;

        const thiz = this;

        if (!this.outgoing) {
            this.outgoing = [];
        }
        /************************************************************/
        /*  update timers                                           */
        let interval = this.sendSettings.interval;
        //set the interval to 0 in case its not specified:
        if (!mode && !interval) {
            interval = 0;
        }

        //clear interval timer in case user changed settings to "onReply"
        if (mode === 1 && this.queueTimer) {
            clearTimeout(this.queueTimer);
            this.queueTimer = null;
            _debug && console.log('cleared interval timer!');
        } else if (mode === 0 && this._onReplyTimeout) {
            this._clearOnReplyTimeout();
            return;
        }

        _debug && console.log('process , mode = ' + mode + ' | interval = ' + interval + ' | messages to send = ' + this.outgoing.length);

        //send via interval
        if (!mode && interval > 0) {
            //interval has changed
            if (this._lastInterval && this._lastInterval !== interval && this.queueTimer) {
                clearTimeout(this.queueTimer);
                this.queueTimer = null;
            }

            //create a timer
            if (!this.queueTimer) {
                this.queueTimer = setInterval(() => {
                    thiz.busy = false; //reset lock
                    this.processOutgoing();
                }, interval);
                this._lastInterval = interval;
            }
        }

        const messageToSend = this.outgoing[0]; //pick the first
        const delegate = this.delegate;

        //now finally send it out
        if (messageToSend) {
            if (!messageToSend.didPrepare) {
                messageToSend.msg = '' + this.prepareMessage(messageToSend.msg);
                messageToSend.didPrepare = true;
            }

            //delegate : nxapp.manager.DeviceManager || xcf.manager.DeviceManager

            //send via interval mode
            if (!mode) {
                try {
                    if (delegate && delegate.sendDeviceCommand) {
                        _debug && console.log('-send message : ' + messageToSend.msg);
                        delegate.sendDeviceCommand(thiz, messageToSend.msg, messageToSend.src, messageToSend.id, null, messageToSend.wait, messageToSend.stop, messageToSend.pause, null, messageToSend.args);
                    } else {
                        console.error('have no delegate');
                    }
                } catch (e) {
                    console.error('error sending message : ' + e.message);
                }
                //remove from out going
                remove(thiz.outgoing, messageToSend);
            } else {

                //send via onReply mode

                //special case, first command && nothing received yet:
                if (/*force==true || mode*/ this.onReplyStatus) {
                    try {

                        if (delegate && delegate.sendDeviceCommand) {
                            delegate.sendDeviceCommand(thiz, messageToSend.msg, messageToSend.src, messageToSend.id, null, messageToSend.wait, messageToSend.stop, messageToSend.pause, null, messageToSend.args);
                        } else {
                            console.error('have no delegate');
                        }
                    } catch (e) {
                        console.error('error sending message : ' + e.message);
                    }
                    //remove from out going
                    remove(thiz.outgoing, messageToSend);
                    thiz.busy = false; //reset lock
                    this.onReplyStatus = false;

                    if (thiz.hasMessages()) {
                        //setup new timer
                        thiz._updateOnReplyTimeout();
                    }
                }
            }
        }
    }
    /**
     * Send message send a string to the device. Basing on the send settings this message will be queued or send
     * on reply.
     * @param msg {string} the string to send
     * @param now {string} force sending now!
     * @param src {string} the id of the source block
     * @param id {string} the id of the send job
     */
    callMethod(method, args, src, id) {
        if (this.delegate && this.delegate.callMethod) {
            if (!_.isString(args)) {
                args = JSON.stringify(args);
            }
            return this.delegate.callMethod(this, method, args, src, id);
        }
    }
    /**
     * @param msg {string} the string to send
     * @param now {string} force sending now!
     * @param src {string} the id of the source block
     * @param id {string} the id of the send job
     */
    runShell(code, args, src, id, block) {
        if (this.delegate && this.delegate.runShell) {
            if (!_.isString(args)) {
                args = JSON.stringify(args);
            }
            return this.delegate.runShell(this, code, args, src, id, block);
        } else {
            console.error('-run shell failed');
        }
    }
    /**
     * Clear the onReply timeout, reset busy and proceed sending
     * @private
     */
    _clearOnReplyTimeout() {
        clearTimeout(this._onReplyTimeout);
        delete this._onReplyTimeout;
        this.busy = false;
        delete this.incoming;
        this.onReplyStatus = true;
        this.processOutgoing();
    }
    /**
     * Create a timeout if we're in "onReply" mode
     * @private
     */
    _updateOnReplyTimeout() {
        if (this.sendSettings.sendMode) {
            const thiz = this;
            if (this._onReplyTimeout) {

            } else {
                this._onReplyTimeout = setTimeout(() => {
                    thiz._clearOnReplyTimeout();
                }, this.sendSettings.timeout || 100);
            }
        }
    }
    /**
     * Send message send a string to the device. Basing on the send settings this message will be queued or send
     * on reply.
     * @param msg {string} the string to send
     * @param now {string} force sending now!
     * @param src {string} the id of the source block
     * @param id {string} the id of the send job
     * @param wait {boolean}
     * @param stop {boolean}
     * @param pause {boolean}
     * @param args {object}
     */
    sendMessage(msg, now, src, id, wait, stop, pause, args) {

        if (!this.sendSettings) {
            console.error('have no send settings');
            return;
        }

        //check we have a queue array
        if (!this.outgoing) {
            this.outgoing = [];
        }

        /**
         * if this.sendSettings.send.mode == false, its sending via 'interval', if true its on 'reply'
         */
        if (now !== false) {
            const _interval = this.sendSettings.interval || 0;

            //we send per interval
            if (!this.sendSettings.sendMode && _interval > 0) {
                //add it to the queue
                this.outgoing.push({
                    msg: msg,
                    src: src,
                    id: id,
                    wait: wait,
                    stop: stop,
                    pause: pause,
                    args: args
                });

                //trigger outgoing
                this.processOutgoing();

            } else if (!_interval) {
                if (this.delegate && this.delegate.sendDeviceCommand) {
                    return this.delegate.sendDeviceCommand(this, msg, src, id, null, wait, stop, pause, null, args);
                } else {
                    console.error('have no delegate');
                }
            } else if (this.sendSettings.sendMode) {
                //we send on reply
                if (this.outgoing.length === 0 && !this._onReplyTimeout) {
                    this.onReplyStatus = true;
                }
                this._updateOnReplyTimeout();
                //first message, set onReplyState to true
                //add it to the queue
                this.outgoing.push({
                    msg: msg,
                    src: src,
                    id: id,
                    wait: wait
                });

                //trigger outgoing
                this.processOutgoing();

                return;
            }

            return;
        }

        //we send directly
        if (this.delegate && this.delegate.sendDeviceCommand) {
            return this.delegate.sendDeviceCommand(this, msg, src, id, null, wait, stop, pause, null, args);
        } else {
            console.error('have no delegate');
        }

        return false;
    }
    /**
     * Deal with Javascript special characters, indexOf("\n") fails otherwise
     * @returns {string}
     */
    getLineBreakSend() {
        if (!this.sendSettings) {
            return '';
        }
        const lineBreak = '' + this.sendSettings.end;
        const lb = JSON.parse('"' + lineBreak + '"');
        return lb || '\r';
    }
    /**
     * Deal with Javascript special characters, indexOf("\n") fails otherwise
     * @returns {string}
     */
    getLineBreak() {
        if (!this.responseSettings || !this.responseSettings.cTypeDelimiter) {
            return '';
        }
        return utils.convertAllEscapes(this.responseSettings.delimiter, 'none');
    }
    /**
     * Splits a message string from the device server into an array of messages. Its using 'responseSettings'
     * @param str
     * @returns {string[]}
     */
    split(str) {
        if (!this.responseSettings || !this.getLineBreak()) {
            return [str];
        }
        if (this.responseSettings.cTypeDelimiter) {
            const lineBreak = this.getLineBreak();
            const has = str.indexOf(lineBreak);
            if (has !== -1) {
                const _split = str.split(lineBreak);
                return _split;
            }
            return [];
        }
        return [];
    }
    /////////////////////////////////////////////////////////////////////////////////////
    //
    //  Utils
    //
    /////////////////////////////////////////////////////////////////////////////////////
    /**
     * Return true if we have message
     * @returns {boolean}
     */
    hasMessages() {
        return this.outgoing && this.outgoing.length > 0;
    }
    /**
     *
     * @param message
     */
    updateOnReplyStatus(message) {
        const _onReplyString = '' + this.unescape(this.sendSettings.onReply);
        const _messageString = '' + this.unescape(message);
        this.onReplyStatus = _onReplyString === _messageString || _onReplyString === '' || _messageString.indexOf(_onReplyString) !== -1;
        _debug && console.log(' matches: ' + this.onReplyStatus + ' | ' + utils.stringToHex(_onReplyString) + ' - ' + utils.stringToHex(_messageString));
        return this.onReplyStatus;
    }
    byteDelimiter(delimiter, cb) {
        if (!_.isArray(delimiter)) {
            delimiter = [delimiter];
        }
        let buf = [];
        let nextDelimIndex = 0;
        return buffer => {
            for (let i = 0; i < buffer.length; i++) {
                buf[buf.length] = buffer[i];
                if (isEqual(delimiter, buf.slice(-delimiter.length))) {
                    cb(buf, i);
                    buf = [];
                    nextDelimIndex = 0;

                }
            }
        };
    }
    /**
     * Standard callback when we have a RAW message, not split by the delimiter.
     * @param data
     */
    onMessageRaw(data) {

        const bytes = data.bytes;
        let bytesArray = utils.bufferFromDecString(bytes);
        if (!this.bytesIncomeBuf) {
            this.bytesIncomeBuf = [];
        }

        bytesArray = this.bytesIncomeBuf.concat(bytesArray);
        const messages = [];
        let lastDelimiterPos = 0;
        const responseSettings = this.responseSettings;
        const sendSettings = this.sendSettings;
        let delimiterBytes;

        function onPart(_part, lastPos) {
            let part = _part.slice();
            part = part.slice(0, -delimiterBytes.length);
            const str = toString(part);
            messages.push({
                string: str,
                bytes: part
            });
            lastDelimiterPos = lastPos;

        }

        //collect data if we're in delimiter mode
        if (responseSettings && responseSettings.cTypeDelimiter && responseSettings.delimiter && responseSettings.delimiter.length > 0) {
            const delimiter = utils.convertAllEscapes(responseSettings.delimiter, 'none');
            delimiterBytes = utils.stringToBuffer(delimiter);
            const delimiterFn = this.byteDelimiter(delimiterBytes, onPart);
            delimiterFn(bytesArray);
        }

        if (sendSettings && sendSettings.sendMode) {
            if (this.updateOnReplyStatus(data.message) && this.hasMessages()) {
                this.processOutgoing();
            }
        }

        //remove found parts
        if (lastDelimiterPos > 0) {
            for (let i = 0; i < lastDelimiterPos + 1; i++) {
                bytesArray.shift();
            }
            this.bytesIncomeBuf = bytesArray;
        }

        if (this.bytesIncomeBuf.length > MAX_BUFFER_COUNT) {
            this.bytesIncomeBuf = [];
        }

        if (messages.length) {
            return messages;
        } else {
            return [];
        }
    }
    /**
     * Standard callback when we have a message from the device we're bound to (specified in profile).
     * 1. put the message in the incoming queue, tag it as 'unread'
     * 2. in case we have messages to send and we are in 'onReply' mode, trigger outgoing queue
     *
     * @param data {Object} : Message Struct build by the device manager
     * @param data.device {Object} : Device info
     * @param data.device.host {String} : The host
     * @param data.device.port {String} : The host's port
     * @param data.device.protocol {String} : The host's protocol
     * @param data.message {String} : RAW message, untreated
     *
     * @example
     */

    onMessage(data) {
        _debug && console.log('incoming message : ' + data.message);
    }
    /***
     * Standard callback when we have a feedback message from any device. The message data contains
     * all needed info like which device, the response, etc...
     * @param msg
     */
    onBroadcastMessage(msg) {
    }
    /**
     * Main entry when this instance is started
     * @returns {boolean}
     */
    start() {
        this.outgoing = [];
        this.incoming = [];
        return true;
    }
    /**
     * Set a variable's value
     * @param title {string} the name of the variable
     * @param value {string} the new value
     * @param save {boolean} the new value will be saved
     * @param publish {boolean} the new value will published in the internal MQTT storage
     * @param highlight {boolean} enable/disable highlighting in the interface.
     */
    setVariable(title, value, save, publish, highlight) {
        //console.log('setVariable : '+publish);
        const _variable = this.blockScope.getVariable(title);
        if (_variable) {
            _variable.value = value;
            if (highlight === false) {
                _variable.__ignoreChangeMark = true;
            }
            _variable.set('value', value);
            if (highlight === false) {
                _variable.__ignoreChangeMark = false;
            }
        } else {

            _debug && console.log('no such variable : ' + title);
            return;
        }

        if (publish === 'undefined' || publish == null) {
            //console.log('publish true');
            publish = true;
        }
        //console.log('setVariable : '+publish);
        this.emit(EVENTS.ON_DRIVER_VARIABLE_CHANGED, {
            item: _variable,
            scope: this.blockScope,
            owner: this,
            save: save === true,
            publish: publish
        });
    }
    /**
     * Return a variable's value
     * @param title {string} the name of the variable
     * @returns {string} the value of the variable
     */
    getVariable(title) {
        const _variable = this.blockScope.getVariable(title);
        if (_variable) {
            return _variable.value;
        }
        return '';
    }
    callCommand(title, settings) {
        const _block = this.blockScope.getBlockByName(title);
        if (_block) {
            return _block.solve(this.blockScope, settings);
        } else {
            console.warn('cant call command by name: ' + title + ' not found');
        }

    }
    getCommand(title) {
        return this.blockScope.getBlockByName(title);
    }
    onLostServer() {
    }
    destroy() {
        this._destroyed = true;
        clearInterval(this.queueTimer);
        delete this.queueTimer;
        if (this.blockScope) {
            this.blockScope.destroy();
        }
        delete this.blockScope;
    }
}
