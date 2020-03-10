import { Model } from './';

export class Comment extends Model {

    comments: any[];
    nosemicolon: boolean = true;

    constructor() {
        super();
        this.elementType = 'Comment';
        this.nosemicolon = true;
    }

    addComment(type, start, stop, text) {
        if (this.comments == null) {
            this.comments = [];
        }
        this.comments[this.comments.length] = {
            commentType: type,
            start: start,
            stop: stop,
            s: text
        };
    }

    appendComment(text) {
        const comment = this.comments[this.comments.length - 1];
        comment.s += text;
        comment.stop += text.length;
    }

    getText(context) {
        let s = '';
        for (let i = 0; i < this.comments.length; i++) {
            if (this.comments[i].commentType == 'line') {
                s += '//' + this.comments[i].s + '\n';
            } else if (this.comments[i].commentType == 'block') {
                s += '/*' + this.comments[i].s + '*/\n';
            }
        }
        return s;
    }
}
