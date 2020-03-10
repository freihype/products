/**
 * @class davinci.model.Model
 * @constructor
 */
export class Model {
    elementType: string = '';
    name: string = '';
    value: string = '';
    endOffset: number = 0;
    startOffset: number = 0;
    parent: any = null;
    children: any[] = [];
    constructor(el?: any) {

    }
    inherits(parent) {
        if (arguments.length > 1) {
            parent.apply(this, Array.prototype.slice.call(arguments, 1));
        } else {
            parent.call(this);
        }
    }

    getText(...rest) { }

    setText(text, noImport?: boolean) { }

    addChild(child: any, index?: number, fromParser?: any) {
        child.parent = this;
        if (index !== undefined) {
            this.children.splice(index, 0, child);
        } else {
            this.children.push(child);
        }
    }

    setStart(offset) {
        this.startOffset = offset;
    }

    setEnd(offset) {
        this.endOffset = offset;
    }

    getLabel() {
        return null;
    }

    getID() {
        return null;
    }

    /*
     * Intended to be overridden by subclasses (e.g., for example in mapping
     * editor offets to HTML model offsets). The default implementation just
     * returns a struct with an unchanged start/end offset.
     */
    mapPositions(element) {
        return {
            startOffset: element.startOffset,
            endOffset: element.endOffset
        };
    }

    findChildAtPosition(position) {
        if (!position.endOffset) {
            position.endOffset = position.startOffset;
        }

        if (position.startOffset >= this.startOffset && position.endOffset <= this.endOffset) {
            for (let i = 0; i < this.children.length; i++) {
                const child = this.children[i].findChildAtPosition(position);
                if (child != null) {
                    return child;
                }
            }
            return this;
        }
        return null;
    }

    removeChild(child) {
        for (let i = 0; i < this.children.length; i++) {
            // tslint:disable-next-line:triple-equals
            if (this.children[i] == child) {
                this.children.splice(i, 1);
                return;
            }
        }
    }

    find(attributeMap, stopOnFirst?: boolean) {
        /* search for nodes with given attributes, example:
         *
         * {'elementType':'CSSFile', 'url': ./app.css'}
         *
         * matches all elemenType = "CSSFile" with url = ./app1.css
         */
        const visitor = {
            visit(node) {
                if (this.found.length > 0 && stopOnFirst) {
                    return true;
                }
                let name = null;
                for (name in attributeMap) {
                    if (node[name] != attributeMap[name]) {
                        break;
                    }
                }
                if (node[name] == attributeMap[name]) {
                    this.found.push(node);
                }
                return false;
            },
            found: []
        };
        this.visit(visitor);
        if (stopOnFirst) {
            return (visitor.found.length > 0) ? visitor.found[0] : null;
        }
        return visitor.found;
    }

    dirtyResource: boolean = false;
    setDirty(isDirty) {
        this.dirtyResource = isDirty;
    }

    isDirty() {
        return this.dirtyResource;
    }

    searchUp(elementType) {
        // tslint:disable-next-line:triple-equals
        if (this.elementType == elementType) {
            return this;
        }
        let parent = this.parent;
        while (parent && parent.elementType != elementType) {
            parent = parent.parent;
        }
        return parent;
    }

    visit(visitor) {
        if (!visitor.visit(this)) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].visit(visitor);
            }
        }
        if (visitor.endVisit) { visitor.endVisit(this); }
    }

    //xwarning
    updatePositions(model?: any, offset?: any, delta?: any) {
        /*
        visitor = {
            visit(element) {
                if (element.endOffset < offset) {
                    return true;
                }
                if (element.startOffset >= offset) {
                    element.startOffset += delta;
                    element.endOffset += delta;
                } else if (element.endOffset >= offset) {
                    element.endOffset += delta;
                }
            }
        };
        model.visit(visitor);*/
    }
}
