import { CSSElement } from './CSSElement';
import { CSSRule } from './CSSRule';
import { CSSSelector } from './CSSSelector';
import { CSSParser } from './CSSParser';

import { mixin } from '@xblox/core/objects';
/*
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "davinci/html/CSSElement",
    "davinci/html/CSSRule",
    "davinci/html/CSSSelector",
    "system/resource",
    "davinci/Workbench"
], (declare, lang, CSSElement, CSSRule, CSSSelector, systemResource, Workbench) => /**

 * @class davinci.html.CSSFile
 * @constructor
 * @extends davinci.html.CSSElement
 */
export class CSSFile extends CSSElement {
    fileName: any;
    includeImports: any;
    errors: any;
    loader: any;
    url: any;
    options: any;
    constructor(args?: any) {
        super();
        this.elementType = 'CSSFile';
        mixin(this, args);
        if (!this.options) {
            this.options = {
                xmode: 'style',
                css: true,
                expandShorthand: false
            };
        }
        let txt = null;

        if (this.url && this.loader) {
            txt = this.loader(this.url);
        } else if (this.url) {
            // const w = Workbench;
            //console.log('find css resource with url : '  + this.url);
            if (this.url === 'app.css') {
                this.setText('BODY {background-color: red!important;}');
            }

        }
        if (txt) {
            this.setText(txt);
        }
    }

    save(isWorkingCopy) {
        console.error('ximpl');
        //ximpl.
        // return systemResource.findResourceAsync(this.url).then(file => file.setContents(this.getText(), isWorkingCopy));
    }

    close() {
        this.visit({
            visit(node) {
                if (node.elementType == 'CSSImport') {
                    node.close();
                }
            }
        });
        // the return of the CSSFile model needs to happen in the CSSImport instead of the CSSFile
        // if we return it in the CSSFile close we end up returning it twice due of the visit logic
        //ximpl.
        /*
        require(['dojo/_base/connect'], function (connect) {
            connect.publish('davinci/model/closeModel', [this]);
        });*/
    }

    addRule(ruleText) {
        const rule = new CSSRule();
        rule.setText(ruleText);
        this.addChild(rule);
        this.setDirty(true);
        return rule;
    }

    setText(text) {
        const oldChildren = this.children;
        this.children = [];

        const result = CSSParser['parse'](text, this);
        if (result.errors.length > 0) {
            console.log('ERROR: ' + this.url);
        }
        this.errors = result.errors;

        if (this.errors.length > 0 && this.errors[this.errors.length - 1].isException) {
            this.children = oldChildren;
        }
        if (this.includeImports) {
            this.children.forEach(child => {
                if (child.elementType == 'CSSImport') {
                    child.load();
                }
            });
        }
        this.onChange();
    }

    getText(context) {
        context = context || {};
        context.indent = 0;

        return this.children.map(child => child.getText(context)).join('');
    }

    getCSSFile() {
        return this;
    }

    getID() {
        return this.fileName;
    }

    getMatchingRules(domElement, rules, matchLevels) {
        domElement = this._convertNode(domElement);
        rules = rules || [];
        matchLevels = matchLevels || [];

        this.children.forEach(child => {
            if (child.elementType == 'CSSRule') {
                const level = child.matches(domElement);
                if (level) {
                    let added = false;
                    for (let j = 0; j < matchLevels.length; j++) {
                        /*
                         * Run the rules and add the rule based on it's match level 0 - NNN
                         *
                         */
                        if (level >= matchLevels[j]) {
                            rules.splice(j, 0, child);
                            matchLevels.splice(j, 0, level);
                            added = true;
                            break;
                        }
                    }
                    /*
                     * The rule is a match but either we have no rules in the array
                     * or all the rules already in the array have a higer match level than this one
                     * So add at the front
                     */
                    if (!added) {
                        rules.splice(0, 0, child);
                        matchLevels.splice(0, 0, level);
                    }
                }
            } else if (child.elementType == 'CSSImport' && child.cssFile) {
                child.cssFile.getMatchingRules(domElement, rules, matchLevels);
            }
        });

        return rules;
    }

    getRule(selector) {
        let matchingRule;
        if (!selector) {
            return [];
        }
        const selectors = CSSSelector.parseSelectors(selector);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child.elementType == 'CSSRule') {
                if (child.matchesSelectors(selectors)) {
                    matchingRule = child;
                    break;
                }
            } else if (child.elementType == 'CSSImport' && child.cssFile) {
                matchingRule = child.cssFile.getRule(selectors) || matchingRule;

            }
        }
        return matchingRule;
    }

    getRules(selector) {
        const selectors = CSSSelector.parseSelectors(selector);
        let matchingRules = [];

        this.children.forEach(child => {
            if (child.elementType == 'CSSRule') {
                if (child.matchesSelectors(selectors)) {
                    matchingRules.push(child);
                }
            } else if (child.elementType == 'CSSImport' && child.cssFile) {
                matchingRules = matchingRules.concat(child.cssFile
                    .getRules(selectors));

            }
        });

        return matchingRules;
    }

    getStyleValue(propertyNames, domElement) {
        const rules = [];
        const matchLevels = [];
        domElement = this._convertNode(domElement);

        this.getMatchingRules(domElement, rules, matchLevels);

        function getMatchingProperty(propertyName) {
            let level = 0;
            let property;
            let prop;
            for (let i = 0; i < rules.length; i++) {
                // tslint:disable-next-line:no-conditional-assignment
                if ((prop = rules[i].getProperty(propertyName))) {
                    if (matchLevels[i] > level) {
                        property = prop;
                        level = matchLevels[i];
                    }
                }
            }
            return property;
        }

        if (typeof propertyNames == 'string') {
            propertyNames = [propertyNames];
        }

        return propertyNames.map(name => getMatchingProperty(name));
    }
}
