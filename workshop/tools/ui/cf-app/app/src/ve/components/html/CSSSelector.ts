import { CSSElement } from './CSSElement';
import { CSSFile } from './CSSFile';
/**
 * @class davinci.html.CSSSelector
 * @constructor
 * @extends davinci.html.CSSElement
 */

export class CSSSelector extends CSSElement {
    attribute: any;
    pseudoElement: any;
    pseudoRule: any;
    id: any;
    element: any;
    cls: any;
    constructor() {
        super();
        this.elementType = 'CSSSelector';
    }

    matchesSelector(selector) {
        if (selector.elementType == this.elementType && this.id == selector.id &&
            this.cls == selector.cls && this.element == selector.element &&
            this.pseudoRule == selector.pseudoRule) {
            return true;
        }
    }
    getText(context) {
        let s = '';
        if (this.element) {
            s = s + this.element;
        }
        if (this.id) {
            s = s + '#' + this.id;
        }
        if (this.cls) {
            s = s + '.' + this.cls;
        }
        if (this.pseudoRule) {
            s = s + ':' + this.pseudoRule;
        }
        if (this.pseudoElement) {
            s = s + '::' + this.pseudoElement;
        }
        if (this.attribute) {
            s = s + '[' + this.attribute.name;
            if (this.attribute.type) {
                s = s + this.attribute.type + '"' + this.attribute.value + '"';
            }
            s = s + ']';
        }
        return s;
    }

    matches(domNode, index) {
        // FIXME: Will produce incorrect results if more than 9 class matches
        // Should use a very higher "base", not just base 10
        const inx = index || 0;
        const node = domNode[inx];
        let specific = 0;
        let anymatches = false;
        if (this.id) {
            if (this.id != node.id) {
                return -1;
            }
            specific += 100;
            anymatches = true;
        }
        if (this.element) {
            if (this.element == '*') {
                anymatches = true;
            } else {
                if (this.element != node.tagName) {
                    if (this.element.toUpperCase() != node.tagName) {
                        return -1;
                    }
                }
                specific += 1;
                anymatches = true;
            }
        }
        if (this.cls && node.classes) {
            const classes = node.classes;
            if (this.cls.indexOf('.') >= 0) {
                const matchClasses = this.cls.split('.');
                for (let j = 0; j < matchClasses.length; j++) {
                    let found = false;
                    for (let i = 0; i < classes.length; i++) {
                        // tslint:disable-next-line:no-conditional-assignment
                        if (found = (classes[i] == matchClasses[j])) {
                            break;
                        }
                    }
                    if (!found) {
                        return -1;
                    }
                }
                specific += (matchClasses.length * 10);
                anymatches = true;
            } else {
                let found = false;
                for (let i = 0; i < classes.length; i++) {
                    // tslint:disable-next-line:no-conditional-assignment
                    if (found = ((classes[i] == this.cls) && (!this.pseudoRule))) { // FIXME need to do something better with pseudoRule issue #1760
                        break;
                    }
                }
                if (!found) {
                    return -1;
                }
                specific += 10;
                anymatches = true;
            }
        }
        if (!anymatches) {
            return -1;
        } else {
            return specific;
        }
    }

    getCSSRule() {
        if (this.parent.elementType == 'CSSRule') {
            return this.parent;
        }
        return this.parent.parent;
    }

    static parseSelectors = selector => {

        if (typeof selector == 'string') {
            selector = selector + '{}';
            //ximpl.
            // const cssFileClass = require('davinci/html/CSSFile');
            const cssFile = new CSSFile();
            cssFile.setText(selector);
            return cssFile.children[0].selectors;
        } else {
            return selector; // already parsed
        }
    }
}
