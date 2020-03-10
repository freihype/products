import {
    CSSElement
} from './CSSElement';
export class CSSCombinedSelector extends CSSElement {
    combiners: any[] = [];
    selectors: any[] = [];
    constructor() {
        super();
        this.elementType = 'CSSCombinedSelector';
    }

    matchesSelector(selector) {
        if (selector.elementType == this.elementType) {
            if (selector.selectors.length == this.selectors.length) {
                for (let i = 0; i < this.selectors.length; i++) {
                    if (this.combiners[i] != selector.combiners[i]) {
                        return false;
                    }
                    if (!this.selectors[i].matchesSelector(selector.selectors[i])) {
                        return false;
                    }
                }
                return true;
            }
        }
    }

    getText(context) {
        let s = '';
        for (let i = 0; i < this.selectors.length - 1; i++) {
            s = s + this.selectors[i].getText(context);
            if (this.combiners[i] != ' ') {
                s += ' ' + this.combiners[i] + ' ';
            } else {
                s += this.combiners[i];
            }
        }
        s = s + this.selectors[this.selectors.length - 1].getText(context);
        return s;
    }

    matches(domNode) {
        let selectorInx = this.selectors.length - 1;
        let totalSpecific = 0;
        for (let i = 0; i < domNode.length; i++) {
            let specific;

            // tslint:disable-next-line:no-conditional-assignment
            if ((specific = this.selectors[selectorInx].matches(domNode, i)) >= 0) {
                totalSpecific += specific;
                selectorInx--;
                if (selectorInx < 0) {
                    return totalSpecific;
                }
            }
            if (i == 0 && specific < 0) {
                return -1;
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

    getCSSRule() {
        return this.parent;
    }
}
