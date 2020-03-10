import {
    HTMLItem
} from './HTMLItem';

export class HTMLComment extends HTMLItem {
    //xwarning
    isProcessingInstruction: boolean = false;
    wasParsed: boolean = false;
    endOffset: number;
    constructor(value?: string) {
        super();
        this.elementType = 'HTMLComment';
        this.value = value || '';
    }

    getText(context) {
        const dash = this.isProcessingInstruction ? '' : '--';
        return '<!' + dash + this.value + dash + '>';
    }
}
