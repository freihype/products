import { Contains, EVENTS, Block, BLOCK_OUTLET } from '../';
import { EVENTS as CoreEvents } from '../../shared';
import * as utils from '../../shared';
import * as _ from 'lodash';
import * as types from '../types';
export class RunScript extends Contains {
    getProperties(): any {
        return {
            method: 'string'
        };
    }
    declaredClass: string = 'xblox.model.code.RunScript';
    name: string = 'Run Script';
    method: string = '';
    args: string = '';
    deferred: false;
    sharable: boolean = true;
    context: null;
    icon: string = 'fa-code';
    observed: Array<string> = [
        'method'
    ];
    /*
        public getContext () {
            return this.context || (this.scope.getContext ? this.scope.getContext() : this);
            return this.context || this;
        }
        */
    /*
        solve2(scope, settings, run, error) {
        this._currentIndex = 0;
        this._return = [];
        let _script = '' + this._get('method');
        const thiz = this;
        const ctx = this.getContext();
        if (_script && _script.length) {

            let runScript = function () {
                let _function = new Function('{' + _script + '}');
                let _args = thiz.getArgs(null) || [];
                try {
                    let _parsed = _function.apply(ctx, _args || {});
                    thiz._lastResult = _parsed;
                    if (run) {
                        run('Expression ' + _script + ' evaluates to ' + _parsed);
                    }
                    if (_parsed !== 'false' && _parsed !== false) {
                        thiz.onSuccess(thiz, settings, {
                            result: _parsed
                        });
                    } else {
                        thiz.onFailed(thiz, settings);
                        return [];
                    }
                } catch (e) {
                    if (error) {
                        error('invalid expression : \n' + _script + ': ' + e);
                    }
                    thiz.onFailed(thiz, settings);
                    return [];
                }
            };

            if (scope.global) {
                (function () {
                    window = scope.global;
                    let _args = thiz.getArgs() || [];
                    try {
                        let _parsed = null;
                        if (!ctx['runExpression']!) {
                            let _function = new Function('{' + _script + '}').bind(this);
                            _parsed = _function.apply(ctx, _args || {});
                        } else {
                            _parsed = ctx.runExpression(_script, null, _args);
                        }

                        thiz._lastResult = _parsed;

                        if (run) {
                            run('Expression ' + _script + ' evaluates to ' + _parsed);
                        }
                        if (_parsed !== 'false' && _parsed !== false) {
                            thiz.onSuccess(thiz, settings);
                        } else {
                            thiz.onFailed(thiz, settings);
                            return [];
                        }
                    } catch (e) {
                        thiz._lastResult = null;
                        if (error) {
                            error('invalid expression : \n' + _script + ': ' + e);
                        }
                        thiz.onFailed(thiz, settings);
                        return [];
                    }

                }).call(scope.global);

            } else {
                return runScript();
            }
        } else {
            console.error('have no script');
        }
        let ret = [], items = this[this._getContainer()];
        if (items.length) {
            this.runFrom(items, 0, settings);
        } else {
            this.onSuccess(this, settings);
        }
        this.onDidRun();
        return ret;
    },
    */
    /**
     *
     * @param scope
     * @param settings
     * @param run
     * @param error
     */
    public solve(scope, settings, isInterface, send, run, error) {

        this._currentIndex = 0;
        this._return = [];
        settings = settings || {};
        let _script = send || (this._get('method') ? this._get('method') : this.method);

        if (!scope.expressionModel) {
            throw new Error('na');
        }

        let thiz = this;
        let ctx = this.getContext();
        let items = this[this._getContainer()]

        //outer
        let dfd = {};
        let listener = settings.listener;
        let isDfd = thiz.deferred;
        let expressionModel = scope.getExpressionModel();
        this.onRunThis(settings);
        /*
                function globalEval(text) {
                    var ret;
                    // Properly escape \, " and ' in the input, normalize \r\n to an escaped \n
                    text = text.replace(/["'\\]/g, '\\$&').replace(/\r\n/g, '\\n');

                    // You have to use eval() because not every expression can be used with an assignment operator
                    var where = typeof window !== 'undefined' ? window : global;

                    where.execScript('globalEval.____lastInputResult____ = eval(\'' + text + '\');} }');

                    // Store the result and delete the property
                    ret = globalEval.____lastInputResult____;
                    delete globalEval.____lastInputResult____;

                    return ret;
                }
                */
        if (!expressionModel) {
            console.error('scope has no expression model');
            return false;
        }
        let expression = expressionModel.replaceVariables(scope, _script, null, null);
        let _function = expressionModel.expressionCache[expression];
        if (!_function) {
            _function = expressionModel.expressionCache[expression] = new Function('{' + expression + '}');
        }
        let _args = thiz.getArgs(settings) || [];
        try {
            if (isDfd) {
                ctx['resolve'] = function (result) {
                    if (thiz._deferredObject) {
                        thiz._deferredObject.resolve();
                    }
                    thiz.onDidRunThis(dfd, result, items, settings);
                }
            }
            let _parsed = _function.apply(ctx, _args || {});
            thiz._lastResult = _parsed;
            if (run) {
                run('Expression ' + _script + ' evaluates to ' + _parsed);
            }
            if (!isDfd) {
                thiz.onDidRunThis(dfd, _parsed, items, settings);
            }
            if (_parsed !== 'false' && _parsed !== false) {
                thiz.onSuccess(thiz, settings);
            } else {
                thiz.onFailed(thiz, settings);
            }
        } catch (e) {
            e = e || {};
            thiz.onDidRunItemError(dfd, e, settings);
            thiz.onFailed(thiz, settings);
            if (error) {
                error('invalid expression : \n' + _script + ': ' + e);
            }
        }
        return dfd;
    }
    /////////////////////////////////////////////////////////////////////////////////////
    //
    //  UI
    //
    /////////////////////////////////////////////////////////////////////////////////////
    toText() {

        let result = '<span style="">' + this.getBlockIcon() + ' ' + this.name + ' :: ' + '</span>';
        if (this.method) {
            result += this.method.substr(0, 50);
        }
        return result;
    }
    canAdd() { return true };

    /*
    getFields: function () {
    if (this.description === 'No Description') {
        this.description = Description;
    }
    let fields = this.inherited(arguments) || this.getDefaultFields();
    let thiz = this;
    fields.push(
        utils.createCI('name', 13, this.name, {
            group: 'General',
            title: 'Name',
            dst: 'name'
        })
    );
    fields.push(
        utils.createCI('deferred', 0, this.deferred, {
            group: 'General',
            title: 'Deferred',
            dst: 'deferred'
        })
    );
    fields.push(utils.createCI('arguments', 27, this.args, {
        group: 'Arguments',
        title: 'Arguments',
        dst: 'args'
    }));

    fields.push(
        utils.createCI('value', types.ECIType.EXPRESSION_EDITOR, this.method, {
            group: 'Script',
            title: 'Script',
            dst: 'method',
            select: true,
            widget: {
                allowACECache: true,
                showBrowser: false,
                showSaveButton: true,
                editorOptions: {
                    showGutter: true,
                    autoFocus: false
                },
                item: this
            },
            delegate: {
                runExpression: function (val, run, error) {
                    let old = thiz.method;
                    thiz.method = val;
                    let _res = thiz.solve(thiz.scope, null, run, error);
                }
            }
        }));
    return fields;
}
*/
}
