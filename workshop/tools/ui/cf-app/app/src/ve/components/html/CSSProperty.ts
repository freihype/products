
import {
    CSSElement
} from './CSSElement';
import { HTMLComment } from './HTMLComment';
import { Path } from './model/Path';

export class CSSProperty extends CSSElement {

    url: any;
    properties: any[] = [];
    postComment: HTMLComment;
    isNotImportant: any;
    comment: HTMLComment;
    value: any;
    lengthValues: any[];
    expanded: any[];
    constructor(name?: string, value?: string, parent?: any) {
        super();
        this.elementType = 'CSSProperty';
        this.name = name || '';
        this.value = value || '';
        this.parent = parent;
        this.expanded = [];
        this.lengthValues = [];
    }

    getValue() {
        return this.value;
    }

    getText(context) {
        let s = '';
        if (this.comment && !context.noComments) {
            s += '\n  ' + this.comment.getText(context);
        }
        s += this.name + ' : ' + this.value;
        if (this.isNotImportant) {
            s += ' !important';
        }
        s += ';';
        if (this.postComment && !context.noComments) {
            s += this.postComment.getText(context);
        }
        return s;
    }

    getCSSRule() {
        return this.parent;
    }

    addProperty(name, value) {
        const property = new CSSProperty(name, value, this);
        this.properties.push(property);
    }

    getURL() {
        if (this.url) {
            let path = new Path(this.getCSSFile().url);
            path = path.getParentPath().append(this.url);
            return path.toString();
        }
    }
}
