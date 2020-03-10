import * as types from '../types';
import * as utils from '../../shared';
import * as _ from 'lodash';
import { remove } from '@xblox/core/arrays';
import { v4 } from 'uuid';
import { Model } from './Base';
import { Block } from './Block';
const debug = true;
const factory: any = {};

export class Variable extends Block {
    declaredClass: 'xblox.model.variables.Variable';
    //name: String
    //  the variable's name, it should be unique within a scope
    name: string = '';

    //value: Current variable value
    value: any;

    register: boolean = true;

    readOnly: boolean = false;

    initial: any = null;

    isVariable: boolean = true;
    flags: number = 0x000001000;
    getValue() {
        return this.value;
    }
    canDisable() {
        return false;
    }
    canMove() {
        return false;
    }
    getIconClass() {
        return 'el-icon-quotes-alt';
    }
    getBlockIcon() {
        return '<span class="' + this.icon + '"></span> ';
    }
    toText() {
        return '<span class=\'text-primary\'>' + this.getBlockIcon() + this.makeEditable('name', 'right', 'text', 'Enter a unique name', 'inline') + '</span>';
    }

    solve() {

        const _result = this.scope.parseExpression(this.getValue(), true);
        //console.log('resolved variable ' + this.title + ' to ' + _result);
        return [];
    }

    getFields() {
        const fields = this.getDefaultFields();
        const thiz = this;

        const defaultArgs = {
            allowACECache: true,
            showBrowser: false,
            showSaveButton: true,
            editorOptions: {
                showGutter: false,
                autoFocus: false,
                hasConsole: false
            },
            aceOptions: {
                hasEmmet: false,
                hasLinking: false,
                hasMultiDocs: false
            },
            item: this
        };

        /*
        fields.push(this.utils.createCI('title', types.ECIType.STRING, this.name, {
            group: 'General',
            title: 'Name',
            dst: 'name'
        }));

        fields.push(this.utils.createCI('value', types.ECIType.EXPRESSION, this.value, {
            group: 'General',
            title: 'Value',
            dst: 'value',
            delegate: {
                runExpression: function (val, run, error) {
                    return thiz.scope.expressionModel.parse(thiz.scope, val, false, run, error);
                }
            }
        }));

        */

        //this.types.ECIType.EXPRESSION_EDITOR
        /*
        fields.push(this.utils.createCI('initial',this.types.ECIType.EXPRESSION,this.initial,{
            group:'General',
            title:'Initial',
            dst:'initial',
            widget:defaultArgs,
            delegate:{
                runExpression:function(val,run,error){
                    if(thiz.group=='processVariables'){
                        var _val = thiz.scope.getVariable("value");
                        var extra = "";
                        if(_val) {
                            _val = _val.value;
                            if(!thiz.isNumber(_val)){
                                _val = ''+_val;
                                _val = "'" + _val + "'";
                            }
                            extra = "var value = " + _val +";\n";
                        }
                    }
                    return thiz.scope.expressionModel.parse(thiz.scope,extra + val,false,run,error);
                }
            }
        }));
        */
        return fields;
    }
}
