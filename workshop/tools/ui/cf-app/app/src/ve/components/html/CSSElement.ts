import { Model } from './model/Model';
import * as lodash from 'lodash';
import { Path } from '.';
export class CSSElement extends Model {
    public url: string = '';
    public isURL: boolean = false;
    // public cssFile: Path;
    constructor() {
        super();
        //xwarning
        /*
        if (typeof pushComment != 'undefined' && pushComment !== null) {
            this.comment = pushComment;
            pushComment = null;

        }*/
        this.elementType = 'CSSElement';
    }

    getLabel() {
        let context = { indent: 0, noComments: true };
        return this.getText(context);
    }

    onChange(arg?: any) {
        if (this.parent) {
            if (arg) {
                this.parent.onChange(arg);
            } else {
                this.parent.onChange(this);
            }
        }

    }

    close(includeImports) {

        //xwarning
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].close();
        }
    }

    getCSSFile() {
        const rule: any = this.getCSSRule();
        if (rule) {
            return rule.parent;
        }
    }

    getCSSRule() { }

    _convertNode(domNode) {
        if (lodash.isArray(domNode)) {
            return domNode;
        }
        const nodes = [];
        while (domNode && domNode.tagName != 'HTML') {
            nodes.push({
                tagName: domNode.tagName,
                id: domNode.id,
                classes: (domNode.className && domNode.className.split(' '))
            });
            domNode = domNode.parentNode;
        }
        return nodes;
    }

    getID() {
        return this.parent.getID() + ':' + this.startOffset + ':' + this.getLabel();
    }
}
