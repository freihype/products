/* define([
	"dojo/_base/declare",
	"davinci/html/CSSElement",
	"davinci/html/CSSParser",
    "davinci/html/CSSProperty"
    */
import { CSSElement } from './CSSElement';
import { CSSProperty } from './CSSProperty';
import { HTMLComment } from './HTMLComment';
import { mixin } from '@xblox/core/objects';
import {CSSParser} from './';
export class CSSRule extends CSSElement {

    postComment: HTMLComment;
    comment: HTMLComment;
    properties: any[];
    selectors: any[];
    constructor() {
        super();
        this.elementType = 'CSSRule';
        this.selectors = [];
        this.properties = [];
    }

    getText(context) {
        let s = '';
        context = context || [];
        if (this.comment && !context.noComments) {
            s += /*"\n  " +*/ this.comment.getText(context); //#2166
        }
        s += this.getSelectorText(context);
        s = s + ' {';
        for (let i = 0; i < this.properties.length; i++) {
            s = s + '\n    ' + this.properties[i].getText(context);
        }
        s = s + '\n}\n';
        if (this.postComment && !context.noComments) {
            s += /*"\n  " +*/ this.postComment.getText(context); //#2166
        }
        return s;
    }

    setText(text) {
        const options = {
            xmode: 'style',
            css: true
        };

        //ximpl.
        const result = CSSParser['parse'](text, this);
        // first child is actually the parsed element, so replace this with child
        mixin(this, this.children[0])
        const parentOffset = (this.parent) ? this.parent.endOffset : 0;
        this.startOffset = parentOffset + 1;
        this.setDirty(true);

    }

    addProperty(name, value) {
        const property = new CSSProperty(name, value, this);
        this.properties.push(property);
        this.setDirty(true);
        this.onChange();
    }

    insertProperty(name, value, atIndex) {
        /* insert a property at given index */
        let property;
        property = this.getProperty(name);
        if (property) {
            this.removeProperty(name);
        }

        property = new CSSProperty(name, value, this);
        this.properties.splice(atIndex, 0, property);
        this.setDirty(true);
        this.onChange();
    }

    getSelectorText(context) {
        let s = '';
        for (let i = 0; i < this.selectors.length; i++) {
            if (i > 0) {
                s = s + ', ';
            }
            s = s + this.selectors[i].getText(context);
        }
        return s;
    }

    matches(domNode) {
        domNode = this._convertNode(domNode);
        let specific;
        for (let i = 0; i < this.selectors.length; i++) {
            // tslint:disable-next-line:no-conditional-assignment
            if ((specific = this.selectors[i].matches(domNode)) >= 0) {
                return specific;
            }
        }
    }

    visit(visitor) {
        if (!visitor.visit(this)) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].visit(visitor);
            }
            for (let i = 0; i < this.selectors.length; i++) {
                this.selectors[i].visit(visitor);
            }
        }
        if (visitor.endVisit) {
            visitor.endVisit(this);
        }
    }

    hasSelector(selectorText) {
        for (let i = 0; i < this.selectors.length; i++) {
            if (this.selectors[i].getLabel() == selectorText) {
                return true;
            }
        }
        return false;
    }

    matchesSelectors(selectors) {
        for (let j = 0; j < selectors.length; j++) {
            for (let i = 0; i < this.selectors.length; i++) {
                if (this.selectors[i].matchesSelector(selectors[j])) {
                    return true;
                }
            }
        }
        return false;
    }

    getCSSRule() {
        return this;
    }

    getLabel() {
        return this.getSelectorText({});
    }

    getProperty(propertyName) {
        for (let i = 0; i < this.properties.length; i++) {
            if (propertyName == this.properties[i].name) {
                return this.properties[i];
            }
        }
    }

    hasProperty(propertyName) {
        for (let i = 0; i < this.properties.length; i++) {
            if (propertyName == this.properties[i].name) {
                return true;
            }
        }
    }

    /**
	 * If propertyName is not provided, returns all CSS properties declared in this rule.
	 * If propertyName is provide, return all CSS property declarations for that property only.
	 * @param {string} propertyName  CSS propername name (e.g., 'font-size')
	 * @returns {Array[Object]} where Object has single property, such as [{display:'none'},{'font-size':'12px'}]
	 */
    getProperties(propertyName) {
        const values = [];
        for (let i = 0; i < this.properties.length; i++) {
            if (!propertyName || propertyName == this.properties[i].name) {
                values.push(this.properties[i]);
            }
        }
        return values;
    }

    setProperty(name, value) {
        let property = this.getProperty(name);
        if (!value) {
            this.removeProperty(name);
        } else if (property) {
            property.value = value;
        } else {
            property = new CSSProperty();
            property.name = name;
            property.value = value;
            this.properties.push(property);
            property.parent = this;
        }
        this.setDirty(true);
        this.onChange();
    }

    removeProperty(propertyName) {
        for (let i = 0; i < this.properties.length; i++) {
            if (propertyName == this.properties[i].name) {
                this.properties.splice(i, 1);
            }
        }
        this.setDirty(true);
        this.onChange();
    }

    removeAllProperties() {
        this.properties = [];
        this.setDirty(true);
        this.onChange();
    }

    removeStyleValues(propertyNames) {
        let newProperties = [];
        for (let i = 0; i < this.properties.length; i++) {
            let found;
            for (let j = 0; j < propertyNames.length && !found; j++) {
                found = propertyNames[j] == this.properties[i].name;
            }
            if (!found) {
                newProperties = this.properties[i];
            }
        }
        this.properties = newProperties;
        this.setDirty(true);
        this.onChange();
    }
}
