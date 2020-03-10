import {
    HTMLItem
} from './HTMLItem';
export class HTMLText extends HTMLItem {
    public wasParsed: boolean = false; //xwarning
    constructor(value?: string) {
        super();
        this.elementType = 'HTMLText';
        this.value = value || '';
    }

    getText(context) {
        return this.value;
    }

    setText(value) {
        if (this.wasParsed || (this.parent && this.parent.wasParsed)) {
            const delta = value.length - this.value.length;
            if (delta > 0) {
                this.getHTMLFile().updatePositions(this.startOffset + 1, delta);
            }
        }
        this.value = value;
    }
    getLabel() {
        if (this.value.length < 15) {
            return this.value;
        }
        return this.value.substring(0, 15) + '...';
    }
}
