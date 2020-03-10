import { HTMLModel } from './HTMLModel';

export class HTMLItem extends HTMLModel {
    public value: string = '';
    public uniqueIDs: any = {};
    public wasParsed: boolean = false;
    constructor() {
        super();
        this.elementType = 'HTMLItem';
    }

    getLabel() {
        return this.getText({ indent: 0 });
    }

    onChange(arg: any = null) {
        // called when the model changes
        //debugger;
        if (this.parent) {
            if (arg) {
                this.parent.onChange(arg);
            }
        }
    }

    _addWS(lines, indent) {
        lines = lines || 0;
        indent = indent || 0;
        const res = [];
        for (let i = 0; i < lines; i++) {
            res.push('\n');
        }
        res.push('                                          '.substring(0, indent));
        return res.join('');
    }

    close() {
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].close();
        }
    }

    getID() {
        return this.parent.getID() + ':' + this.startOffset + ':' + this.getLabel();
    }

    getHTMLFile() {
        let element = this;
        while (element && element.elementType != 'HTMLFile') {
            element = element.parent;
        }
        return element;
    }
}
