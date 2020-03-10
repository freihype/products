import {
    HTMLItem
} from './HTMLItem';
import {
    HTMLText
} from './HTMLText';
import {
    HTMLComment
} from './HTMLComment';
import {
    HTMLAttribute
} from './HTMLAttribute';
import { mixin } from '@xblox/core/objects';
import { HTMLModel } from './HTMLModel';
import { HTMLParser } from '.';

export class HTMLElement extends HTMLItem {
    errors: any;
    wasParsed: boolean;
    startTagOffset: number;
    _fmIndent: number;
    _fmLine: number;
    script: any;
    //xwarning
    noEndTag: any;
    statements: any;
    _fmChildIndent: number;
    _fmChildLine: number;
    tag: any;
    attributes: any[];
    constructor(tag?: string) {
        super();
        this.elementType = 'HTMLElement';
        this.attributes = [];
        this.tag = tag || '';
        this._fmChildLine = 0;
        this._fmChildIndent = 0;
    }

    add(stmt) {
        if (!this.statements) { this.statements = []; }
        this.statements.push(stmt);
        this.onChange();
    }

    getText(context) {
        context = context || {};
        let s = '';
        let doFormat;
        context.indent += 2;
        s = s + '<' + this.tag;
        for (let i = 0; i < this.attributes.length; i++) {
            const attrtext = this.attributes[i].getText(context);
            // noPersist attributes return empty string
            if (attrtext.length > 0) {
                s = s + ' ' + attrtext;
            }
        }
        if (this.noEndTag) {
            s = s + '/>';
        } else {
            s = s + '>';
            s = s + this._addWS(this._fmChildLine, this._fmChildIndent);
            if (this.statements) {
                for (let i = 0; i < this.statements.length; i++) {
                    s = s + this.statements[i].printStatement(context, this.statements[i]);
                }
            } else if (this.script) {
                s = s + this.script;
            } else {
                if (this.children.length > 0) {
                    const isStyle = this.tag == 'style';

                    for (let i = 0; i < this.children.length; i++) {
                        s = s + this.children[i].getText(context);
                        if (isStyle) {
                            let lines = this._fmChildLine;
                            let indent = this._fmChildIndent || 0;
                            if (i + 1 == this.children.length) {
                                lines = this._fmLine;
                                indent = this._fmIndent;

                            }
                            s = s + this._addWS(lines, indent);
                        }
                    }
                }
            }
            if (doFormat && this.children.length > 0) {
                s = s + '\n' + '                                          '.substring(0, context.indent + 1);
            }
            s = s + '</' + this.tag + '>';
        }
        context.indent -= 2;
        s = s + this._addWS(this._fmLine, this._fmIndent);
        //console.log('getElementText: ' +s);
        return s;
    }

    _formatModel(newElement, index, context) {
        let offset = 0;
        const lfSize = 1;		// should check if 2
        if (index == undefined) {
            index = this.children.length;
        }

        function addIndent(indent, elemChild, elem?: any) {
            offset += (lfSize + indent);
            if (elemChild) {
                elemChild._fmChildLine = 1;
                elemChild._fmChildIndent = context.indent;
            } else {
                elem._fmLine = 1;
                elem._fmIndent = context.indent;
            }

        }

        function formatElem(elem, context) {
            elem.startOffset = offset;
            elem.wasParsed = true;
            offset += elem.tag.length + 2;
            for (let i = 0; i < elem.attributes.length; i++) {
                elem.attributes[i].startOffset = offset;
                const attrtext = elem.attributes[i].getText(context);
                if (attrtext.length > 0) {
                    offset += 1 + attrtext.length;
                }
                elem.attributes[i].endOffset = offset - 1;
            }
            if (elem.noEndTag) {
                offset++;
            }
            elem.startTagOffset = offset;
            let s = '';
            if (elem.statements) {
                for (let i = 0; i < elem.statements.length; i++) {
                    s = s + elem.statements[i].printStatement(context, elem.statements[i]);
                }
            } else if (elem.script) {
                s = elem.script;
            }
            if (s) {
                offset += s.length;
            } else if (elem.children.length > 0) {
                let doFormat;
                if (!HTMLElement._noFormatElements[elem.tag]) {
                    context.indent += 2;
                    addIndent(context.indent, elem);
                    doFormat = true;
                }
                let lastChild;
                for (let i = 0; i < elem.children.length; i++) {
                    const child = elem.children[i];
                    switch (child.elementType) {
                        case 'HTMLElement':
                            if (lastChild && lastChild.elementType != 'HTMLText' && !HTMLModel._noFormatElements[child.tag]) {
                                addIndent(context.indent, null, lastChild);
                            }
                            formatElem(child, context);
                            break;
                        case 'HTMLText':
                            child.startOffset = offset;
                            offset += child.value.length;
                            break;
                        case 'HTMLComment':
                            child.startOffset = offset;
                            offset += child.value.length;
                            offset++;
                            if (child.isProcessingInstruction) {
                                offset += 2;
                            }
                            break;
                        default:
                        //console.error('HTML - Element: have nothing',child);
                    }
                    lastChild = child;
                }
                if (doFormat) {
                    context.indent -= 2;
                }
                if (lastChild && lastChild.elementType != 'HTMLText') {
                    addIndent(context.indent, null, lastChild);
                }
            }
            offset += elem.tag.length + 3;
            elem.endOffset = offset - 1;
        }
        let elem1;
        let elem2;
        if (!this.children.length || index == 0) {
            elem1 = this;
            offset = this.startTagOffset + 1;
        } else {
            elem2 = this.children[index - 1];
            offset = elem2.endOffset + 1;
        }
        const startOffset = offset;
        if (!HTMLElement._noFormatElements[newElement.tag]) {
            addIndent(context.indent, elem1, elem2);
            newElement._fmLine = 1;
            newElement._fmIndent = (index < this.children.length) ? context.indent : context.indent - 2;
        }
        formatElem(newElement, context);
        return (offset > startOffset) ? offset - startOffset : 0;
    }

    getElementText(context?: any) {
        context = context || {};
        let s = '';
        if (this.children.length > 0) {
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i].elementType != 'HTMLComment') {
                    s = s + this.children[i].getText(context);
                }
            }
        } else if (this.script) {
            return this.script;
        } else if (this.statements) {
            for (let i = 0; i < this.statements.length; i++) {
                s = s + this.statements[i].printStatement(context, this.statements[i]);
            }
        }
        return s;
    }

    getChildElements(tagName, recurse, result) {
        result = result || [];
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].tag == tagName) {
                result.push(this.children[i]);
            }
            if (recurse && this.children[i].elementType == 'HTMLElement') {
                this.children[i].getChildElements(tagName, recurse, result);
            }
        }
        return result;
    }

    getChildElement(tagName) {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].tag == tagName) {
                return this.children[i];
            }
        }
    }

    hasAttribute(name) {
        for (let i = 0; i < this.attributes.length; i++) {
            if (this.attributes[i].name == name) {
                return true;
            }
        }
        return false;
    }

    getAttribute(name) {
        const attr = this._getAttribute(name);
        if (attr) {
            return attr.value;
        }
    }

    _getAttribute(name) {
        for (let i = 0; i < this.attributes.length; i++) {
            if (this.attributes[i].name == name) {
                return this.attributes[i];
            }
        }
    }

    addText(text) {
        this.addChild(new HTMLText(text));
        this.onChange();
    }

    addComment(text) {
        this.addChild(new HTMLComment(text));
        this.onChange();
    }

    getLabel() {
        return '<' + this.tag + '>';
    }

    addAttribute(name, value, noPersist?: boolean) {
        if (name == 'textContent') {
            this.children = [];
            this.addText(value);
            return;
        }
        let delta;
        const startOffset = (this.attributes.length > 0) ?
            this.attributes[this.attributes.length - 1].endOffset + 1 :
            this.startTagOffset - (this.noEndTag ? 2 : 1);
        let attr = this._getAttribute(name);
        let add;
        if (!attr) {
            attr = new HTMLAttribute();
            add = true;
            delta = name.length + value.length + 4;
            attr.startOffset = startOffset;
            attr.endOffset = startOffset + delta - 1;
        } else {
            delta = value.length - attr.value.length;
        }
        attr.name = name;
        attr.setValue(value);
        attr.noPersist = noPersist;
        if (this.wasParsed && !noPersist && delta > 0) {
            this.getHTMLFile().updatePositions(startOffset, delta);
        }
        // delay adding til after other positions updated
        if (add) {
            this.attributes.push(attr);
        }
        this.onChange();
    }

    removeAttribute(name) {
        this.attributes.every((attr, idx, arr) => {
            if (attr.name === name) {
                arr.splice(idx, 1);
                // Make sure that getHTMLFile() returns a non-null value. This
                // HTMLElement may be standalone (not part of a file); for example,
                // see code in davinci.ve.widget.createWidget().
                const file = this.getHTMLFile();
                if (!attr.noPersist && file) {
                    const s = attr.getText();
                    file.updatePositions(attr.startOffest, 0 - (s.length + 1));
                }
                return false; // break
            }
            return true;
        }, this);
        this.onChange();
    }

    setAttribute(name, value) {
        this.removeAttribute(name);
        this.addAttribute(name, value);
    }

    getUniqueID(noPersist) {
        const attr = this.getAttribute('id');
        if (!attr) {
            const file = this.getHTMLFile();
            if (!file.uniqueIDs) {
                file.uniqueIDs = {};
            }
            let id;
            // tslint:disable-next-line:prefer-conditional-expression
            if (!file.uniqueIDs.hasOwnProperty(this.tag)) {
                id = file.uniqueIDs[this.tag] = 0;
            } else {
                id = ++file.uniqueIDs[this.tag];
            }
            this.addAttribute('id', this.tag + '_' + id, noPersist);
        }
    }

    findElement(id) {
        const attr = this.getAttribute('id');
        if (id == attr) {
            return this;
        }
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].elementType == 'HTMLElement') {
                const found = this.children[i].findElement(id);
                if (found) {
                    return found;
                }
            }
        }
    }

    insertBefore(newChild, beforeChild) {
        let index = this.children.indexOf(beforeChild);
        if (index < 0) {
            index = undefined;
        }
        this.addChild(newChild, index);
        this.onChange();
    }

    addChild(newChild, index?: number, fromParser?: boolean) {
        if (!newChild) {
            debugger;
        }
        if (!fromParser && this.wasParsed) {
            if (newChild.elementType == 'HTMLElement') {
                // calculate indent
                const myIndent = this._getIndent();
                let childIndent;
                // if inserting before element, use same indent as that element
                if (index < this.children.length && this.children[index].elementType == 'HTMLElement') {
                    childIndent = this.children[index]._getIndent();
                } else {
                    if (this.children.length) {
                        this.children.forEach(element => {
                            if (element.elementType == 'HTMLElement') {
                                childIndent = element._getIndent();
                            }
                        });
                    } else {
                        childIndent = myIndent + 1;
                    }
                }
                const indent = childIndent;
                const context = { indent: indent };
                const delta = this._formatModel(newChild, index, context);

                this.getHTMLFile().updatePositions(newChild.startOffset, delta);

            } else if (newChild.elementType == 'HTMLText' || newChild.elementType.substring(0, 3) == 'CSS') {
                const s = newChild.getText();
                const offset = this.children.length ? this.children[this.children.length - 1].endOffset : this.startTagOffset;
                let len = s.length;
                if (len > 0) {
                    if (newChild.elementType != 'HTMLText') {
                        len += this._fmChildIndent + 1;
                    }	// if css, add indent+lf
                    this.getHTMLFile().updatePositions(offset + 1, len);
                }
                newChild.startOffset = offset + 1;
                newChild.endOffset = newChild.startOffset + s.length - 1;
            }

        }
        HTMLItem.prototype.addChild.apply(this, arguments);
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        const lfSize = 1;
        if (index >= 0) {
            let delta = 1 + child.endOffset - child.startOffset;

            if (child.elementType == 'HTMLElement') {
                if (this.children.length == 1) {
                    delta += this._fmChildLine * lfSize + this._fmChildIndent;
                    this._fmChildIndent -= 2;
                } else {
                    if (index > 0 && this.children[index - 1].elementType == 'HTMLElement') {
                        const prevChild = this.children[index - 1];
                        delta += prevChild._fmLine * lfSize + prevChild._fmIndent;
                    }
                    if (index + 1 == this.children.length && this.children[index - 1].elementType == 'HTMLElement') {
                        this.children[index - 1]._fmChildIndent -= 2;
                    }
                }
            }

            if (delta > 0 && this.wasParsed) {
                this.getHTMLFile().updatePositions(child.startOffset, 0 - delta);
            }
        }
        HTMLItem.prototype.removeChild.apply(this, arguments);
    }

    _textModify(newText, oldText) {
        const delta = newText.length - oldText.length;
        if (delta != 0 && this.wasParsed) {
            this.getHTMLFile().updatePositions(this.startOffset, delta);
        }
    }

    setScript(script) {
        this._textModify(script, this.script);
        this.script = script;

    }

    _previous() {
        const inx = this.parent.children.indexOf(this);
        if (inx > 0) {
            return this.parent.children[inx - 1];
        }
    }

    _getIndent() {
        const prev = this._previous();
        if (prev) {
            if (prev.elementType == ' HTMLText') {
                const txt = prev.value.split('\n');
                return txt[txt.length - 1].length;
            } else {
                return prev._fmIndent;
            }
        } else {
            return this.parent._fmChildIndent;
        }
    }

    visit(visitor) {
        if (!visitor.visit(this)) {
            for (let i = 0; i < this.attributes.length; i++) {
                this.attributes[i].visit(visitor);
            }
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].visit(visitor);
            }
        }
        if (visitor.endVisit) { visitor.endVisit(this); }
    }

    setText(text) {
        // clear cached values
        this.script = '';
        const options = { xmode: 'outer' };
        const currentParent = this.parent;
        const result = HTMLParser.parse(text, this);
        this.errors = result.errors;
        // first child is actually the parsed element, so replace this with child
        mixin(this, this.children[0]);
        this.parent = currentParent;
        this.visit({
            visit(node) {
                delete node.wasParsed;
            },
            rules: []
        });
        this.onChange();
    }
}
