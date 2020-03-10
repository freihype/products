import {
    CSSElement
} from './CSSElement';

export class CSSAtRule extends CSSElement {

    constructor() {
        super();
        this.elementType = 'CSSAtRule';
    }

    getCSSFile() {
        return this.parent;
    }

    getText(context) {
        let s = '@';
        s = s + this.name + ' ' + this.value + '\n';
        return s;
    }
}
