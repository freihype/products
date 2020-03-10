
const isServer = false;
const _debug = false;
import { EventEmitter } from 'events';
import * as types from '../types';
import * as utils from '../../shared';
import * as MD5 from 'md5';
import * as _ from 'lodash';
import { remove } from '@xblox/core/arrays';
import { v4 } from 'uuid';
import { Model } from './Base';
/**
 * The expression
 * @class module:xblox.model.Expression
 * @extends module:xblox/model/ModelBase
 */
export class Expression extends Model {
    id: null
    context: null
    // Constants
    variableDelimiters: any = {
        begin: '[',
        end: ']'
    }

    blockCallDelimiters: any = {
        begin: '{',
        end: '}'
    }
    expressionCache: any
    variableFuncCache: any
    constructor() {
        super({});
        this.reset();
    }
    reset() {
        this.expressionCache = {};
        this.variableFuncCache = {};
    }
    /**
     * Replace variable calls width variable values
     * @param scope
     * @param expression
     * @param _evaluate
     * @param _escape
     * @param variableOverrides
     * @returns {*}
     */
    replaceVariables(scope, expression, _evaluate, _escape, variableOverrides, useVariableGetter, variableDelimiters, flags) {
        const FLAG = types.CIFLAG;
        variableDelimiters = variableDelimiters || this.variableDelimiters;
        flags = flags || FLAG.NONE;
        if (flags & FLAG.DONT_ESCAPE) {
            _escape = false;
        }
        if (flags & FLAG.DONT_PARSE) {
            _evaluate = false;
        }
        const occurrence = this.findOccurrences(expression, variableDelimiters);
        if (occurrence) {
            for (let n = 0; n < occurrence.length; n++) {
                // Replace each variable call width the variable value
                let oc = occurrence[n];
                oc = oc.replace(variableDelimiters.begin, '');
                oc = oc.replace(variableDelimiters.end, '');
                const _var = this._getVar(scope, oc);
                if (_var && _var.flags & FLAG.DONT_PARSE) {
                    _evaluate = false;
                }
                let value = null;
                if (_var) {
                    if (useVariableGetter) {
                        expression = expression.replace(occurrence[n], 'this.getVariable(\'' + _var.name + '\')');
                        continue;
                    }
                    value = this.getValue(_var.value);
                    if (variableOverrides && _var.name in variableOverrides) {
                        value = variableOverrides[_var.name];
                    }
                    if (this.isScript(value) && _evaluate !== false) {
                        try {
                            //put other variables on the stack: should be avoided
                            const _otherVariables = scope.variablesToJavascript(_var, true);
                            if (_otherVariables) {
                                value = _otherVariables + value;
                            }
                            // tslint:disable-next-line:quotemark
                            const _parsed = (new Function("{\n" + value + "\n}")).call(scope.context || {});
                            //wasnt a script
                            if (_parsed === 'undefined' || typeof _parsed === 'undefined') {
                                value = '' + _var.value;
                            } else {
                                value = _parsed;
                                // tslint:disable-next-line:quotemark
                                !(flags & FLAG.DONT_ESCAPE) && (value = "'" + value + "'");
                            }
                        } catch (e) {
                            console.log(' parsed variable expression failed \n' + value, e);
                        }
                    } else {
                        if (!this.isNumber(value)) {
                            if (_escape !== false) {
                                value = '\'' + value + '\'';
                            }
                        }
                    }
                } else {
                    _debug && console.log('   expression failed, no such variable :' + occurrence[n] + ' ! setting to default ' + '');
                    value = occurrence[n];
                }
                expression = expression.replace(occurrence[n], value);
            }
        }
        return expression;
    }
    /**
     *
     * @param scope
     * @param expression
     * @param addVariables
     * @param runCallback
     * @param errorCallback
     * @param context
     * @param variableOverrides
     * @param args {[*]}
     * @param flags {CIFLAGS}
     * @returns {*}
     */
    parse(scope, expression, addVariables, runCallback, errorCallback, context, variableOverrides, args, flags) {
        expression = this.replaceAll('\'\'', '\'', expression);
        const expressionContext = context || scope.context || scope.getContext() || {};
        const useVariableGetter = expressionContext['getVariable'] != null;
        expression = this.replaceVariables(scope, expression, null, null, variableOverrides, useVariableGetter, null, flags);
        const isExpression = this.isScript(expression);
        if (!isExpression && (this.isString(expression) || this.isNumber(expression))) {
            if (runCallback) {
                runCallback('Expression ' + expression + ' evaluates to ' + expression);
            }
            return expression;
        }
        if (expression.indexOf('return') === -1 && isExpression) {
            expression = 'return ' + expression;
        }
        addVariables = false;
        if (addVariables === true) {
            const _otherVariables = scope.variablesToJavascript(null, expression);
            if (_otherVariables) {
                expression = _otherVariables + expression;
                expression = this.replaceAll('\'\'', '\'', expression);
            }
        }
        let parsed: any = this;
        try {
            expression = this.replaceAll('\'\'', '\'', expression);
            let _function = this.expressionCache[expression];
            if (!_function) {
                _debug && console.log('create function ' + expression);
                _function = new Function('{' + expression + '; }');
                this.expressionCache[expression] = _function;
            } else {

            }
            parsed = _function.apply(expressionContext, args);
        } catch (e) {
            console.error('invalid expression : \n' + expression, e);
            if (errorCallback) {
                errorCallback('invalid expression : \n' + expression + ': ' + e, e);
            }
            parsed = '' + expression;
            return parsed;
        }
        if (parsed === true) {
            _debug && console.log('expression return true! : ' + expression);
        }

        if (runCallback) {
            runCallback('Expression ' + expression + ' evaluates to ' + parsed);
        }
        return parsed;
    }
    parseVariable(scope, _var, _prefix, escape, allowCache, context, args) {
        let value = '' + _var.value;
        _prefix = _prefix || '';
        let _function: any = null;
        if (allowCache !== false) {
            _function = this.variableFuncCache[scope.id + '|' + _var.title];
            if (!_function) {
                _function = new Function('{' + _prefix + value + '}');
                this.variableFuncCache[scope.id + '|' + _var.title] = _function;
            }
        } else {
            _function = new Function('{' + _prefix + value + '}');
        }
        const _parsed = _function.apply(context || scope.context || {}, args || []);
        if (_parsed === 'undefined' || typeof _parsed === 'undefined') {
            value = '' + _var.value;
        } else {
            if (!this.isNumber(_parsed) && escape !== false) {
                value = '' + _parsed;
                value = '\'' + value + '\'';
            } else {
                value = _parsed;
            }
        }
        return value;
    }
    // Replace block call with block result
    replaceBlockCalls(scope, expression) {
        const occurrences = this.findOccurrences(expression, this.blockCallDelimiters);
        if (occurrences) {
            for (let n = 0; n < occurrences.length; n++) {
                // Replace each block call with block result
                const blockName = this._removeDelimiters(occurrences[n], this.blockCallDelimiters);
                const blockResult = scope.solveBlock(blockName).join('\n');
                expression = expression.replace(occurrences[n], blockResult);
            }
        }
        return expression;
    }
    // gets a variable from the scope using text [variableName]
    _getVar(scope, string) {
        return scope.getVariable(this._getVarName(string));
    }
    _getVarName(string) {
        return this._removeDelimiters(string, this.variableDelimiters);
    }
    _removeDelimiters(text, delimiters) {
        return text.replace(delimiters.begin, '').replace(delimiters.end, '');
    }
    // escape regular expressions special chars
    _escapeRegExp(string) {
        const special = ['[', ']', '(', ')', '{', '}', '*', '+', '.'];
        for (let n = 0; n < special.length; n++) {
            string = string.replace(special[n], '\\' + special[n]);
        }
        return string;
    }
    /**
     * Finds a term in an expression by start and end delimiters
     * @param expression
     * @param delimiters
     * @private
     */
    findOccurrences(expression, delimiters) {
        const d = {
            begin: this._escapeRegExp(delimiters.begin),
            end: this._escapeRegExp(delimiters.end)
        };
        return expression.match(new RegExp(d.begin + '(' + '[^' + d.end + ']*' + ')' + d.end, 'g'));
    }
}
