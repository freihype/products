import * as lodash from 'lodash';

export class Path {
    segments: string[];
    hasLeading: boolean;
    hasTrailing: boolean;
    extension: string;
    path: string;
    _parentPath: Path;
    /**
     * @class davinci.model.Path
     * @constructor
     */
    constructor(path, hasLeading: boolean = false, hasTrailing: boolean = false) {
        path = path || '.';  // if empty string, use '.'
        if (typeof path === 'string') {
            this.path = path;
            this.getSegments();
        } else {
            this.segments = path;
            this.hasLeading = hasLeading;
            this.hasTrailing = hasTrailing;
        }
    }

    endsWith(tail) {
        const segments = [...this.segments];
        const tailSegments = (new Path(tail)).getSegments();
        while (tailSegments.length > 0 && segments.length > 0) {
            if (tailSegments.pop() !== segments.pop()) {
                return false;
            }
        }
        return true;
    }

    getExtension() {
        if (!this.extension) {
            this.extension = this.path.substr(this.path.lastIndexOf('.') + 1);
        }
        return this.extension;
    }

    segment(index) {
        const segs = this.getSegments();
        if (segs.length < index) { return null; }
        return segs[index];
    }

    getSegments() {
        if (!this.segments) {
            const path = this.path;
            this.segments = path.split('/');
            if (path.charAt(0) === '/') {
                this.hasLeading = true;
            }
            if (path.charAt(path.length - 1) === '/') {
                this.hasTrailing = true;
                // If the path ends in '/', split() will create an array whose last element
                // is an empty string. Remove that here.
                this.segments.pop();
            }
            this._canonicalize();
        }
        return this.segments;
    }

    isAbsolute() {
        return this.hasLeading;
    }
    getParentPath(): Path {
        if (!this._parentPath) {
            const parentSegments = [...this.segments];
            parentSegments.pop();
            this._parentPath = new Path(parentSegments, this.hasLeading);
        }
        return new Path(lodash.clone(this._parentPath.segments));
    }

    _clone() {
        return new Path(lodash.clone(this.segments), this.hasLeading, this.hasTrailing);
    }

    append(tail) {
        tail = tail || '';
        if (typeof tail === 'string') {
            tail = new Path(tail);
        }
        if (tail.isAbsolute()) {
            return tail;
        }
        const mySegments = this.segments;
        const tailSegments = tail.getSegments();
        const newSegments = mySegments.concat(tailSegments);
        const result = new Path(newSegments, this.hasLeading, tail.hasTrailing);
        if (tailSegments[0] === '..' || tailSegments[0] === '.') {
            result._canonicalize();
        }
        return result;
    }

    toString() {
        const result = [];
        if (this.hasLeading) {
            result.push('/');
        }
        for (let i = 0; i < this.segments.length; i++) {
            if (i > 0) {
                result.push('/');
            }
            result.push(this.segments[i]);
        }
        if (this.hasTrailing) {
            result.push('/');
        }
        return result.join('');
    }

    removeRelative() {
        const segs = this.getSegments();
        if (segs.length > 0 && segs[1] === '.') {
            return this.removeFirstSegments(1);
        }
        return this;
    }

    relativeTo(base, ignoreFilename) {
        if (typeof base === 'string') {
            base = new Path(base);
        }
        const mySegments = this.segments;
        if (this.isAbsolute()) {
            return this;
        }
        const baseSegments = base.getSegments();
        const commonLength = this.matchingFirstSegments(base);
        let baseSegmentLength = baseSegments.length;
        if (ignoreFilename) {
            baseSegmentLength = baseSegmentLength - 1;
        }
        const differenceLength = baseSegmentLength - commonLength;
        const newSegmentLength = differenceLength + mySegments.length - commonLength;
        if (newSegmentLength === 0) {
            return new Path('');
        }
        const newSegments = [];
        for (let i = 0; i < differenceLength; i++) {
            newSegments.push('..');
        }
        for (let i = commonLength; i < mySegments.length; i++) {
            newSegments.push(mySegments[i]);
        }
        return new Path(newSegments, false, this.hasTrailing);
    }

    startsWith(anotherPath) {
        const count = this.matchingFirstSegments(anotherPath);
        return anotherPath._length() === count;
    }

    _length(anotherPath) {
        return this.segments.length;
    }

    matchingFirstSegments(anotherPath) {
        const mySegments = this.segments;
        const pathSegments = anotherPath.getSegments();
        const max = Math.min(mySegments.length, pathSegments.length);
        let count = 0;
        for (let i = 0; i < max; i++) {
            if (mySegments[i] !== pathSegments[i]) {
                return count;
            }
            count++;
        }
        return count;
    }

    removeFirstSegments(count) {
        return new Path(this.segments.slice(count, this.segments.length), this.hasLeading, this.hasTrailing);
    }

    removeMatchingLastSegments(anotherPath) {
        const match = this.matchingFirstSegments(anotherPath);
        return this.removeLastSegments(match);
    }

    removeMatchingFirstSegments(anotherPath) {
        const match = this.matchingFirstSegments(anotherPath);
        return this._clone().removeFirstSegments(match);
    }

    removeLastSegments(count) {
        if (!count) {
            count = 1;
        }
        return new Path(this.segments.slice(0, this.segments.length - count), this.hasLeading, this.hasTrailing);
    }

    lastSegment() {
        return this.segments[this.segments.length - 1];
    }

    firstSegment(length) {
        return this.segments[length || 0];
    }

    equals(anotherPath) {
        if (this.segments.length !== anotherPath.segments.length) {
            return false;
        }
        for (let i = 0; i < this.segments.length; i++) {
            if (anotherPath.segments[i] !== this.segments[i]) {
                return false;
            }
            ;
        }
        return true;
    }

    _canonicalize() {

        let doIt;
        const segments = this.segments;
        for (let i = 0; i < segments.length; i++) {
            if (segments[i] === '.' || segments[i] === '..') {
                doIt = true;
                break;
            }
        }
        if (doIt) {
            const stack = [];
            for (let i = 0; i < segments.length; i++) {
                if (segments[i] === '..') {
                    if (stack.length === 0) {
                        // if the stack is empty we are going out of our scope
                        // so we need to accumulate segments.  But only if the original
                        // path is relative.  If it is absolute then we can't go any higher than
                        // root so simply toss the .. references.
                        if (!this.hasLeading) {
                            stack.push(segments[i]); //stack push
                        }
                    } else {
                        // if the top is '..' then we are accumulating segments so don't pop
                        if ('..' === stack[stack.length - 1]) {
                            stack.push('..');
                        } else {
                            stack.pop();
                        }
                    }
                    //collapse current references
                } else if (segments[i] !== '.' || this.segments.length === 1) {
                    stack.push(segments[i]); //stack push
                }
            }
            //if the number of segments hasn't changed, then no modification needed
            if (stack.length === segments.length) {
                return;
            }
            this.segments = stack;
        }
    }

}
/*
if (typeof davinci.model === 'undefined') {
    davinci.model = {};
}
if (typeof davinci.model.Path === 'undefined') {
    davinci.model.Path = {};
}

const Path = declare('davinci.model.Path', null, {

});
davinci.model.Path.EMPTY = new Path('');
return Path;
});
*/
