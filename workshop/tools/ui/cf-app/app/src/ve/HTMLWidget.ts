import { Widget } from './_Widget';
import { HTMLModel } from './components/html';
import { WidgetUtils } from './';
import { BehaviorSubject } from 'rxjs';

export class HTMLWidget extends Widget {
    isRoot: boolean;
    isHtmlWidget: boolean = true;
    addHTMLClasses: boolean = true;
    subject: BehaviorSubject<HTMLWidget>
    constructor(params?: any, node?: any, addHTMLClasses?: boolean) {
        super(params, node, 'html.' + node.tagName.toLowerCase(), null);
        this.type = 'html.' + node.tagName.toLowerCase();
        this.acceptsHTMLChildren = true;
        if (addHTMLClasses != null) {
            this.addHTMLClasses = addHTMLClasses
        }
        this.subject = new BehaviorSubject(node);
    }
    buildRendering() {
        this.containerNode = this.domNode; // for getDescendants()
        if (this._params) {
            // tslint:disable-next-line:forin
            for (const name in this._params) {
                this.domNode.setAttribute(name, this._params[name]);
            }
            this._params = undefined;
        }
        try {
            // this won't work on an SVG element in FireFox
            if (this.addHTMLClasses !== false) {
                $(this.domNode).addClass('HtmlWidget');
            }
        } catch (e) {
            console.debug('Error in davinci.ve.helpers.loadHtmlWidget.buildRendering: ' + e);
        }
    }

    _getChildrenData(options) {
        //called by _Widget::getData
        function getTextContent(node) {
            let d = node.nodeValue.trim();
            if (d /*&& options.serialize*/) { // #2349
                d = HTMLModel.escapeXml(d);
            }
            return d;
        }

        const domNode = this.domNode;

        if (!domNode.hasChildNodes()) {
            return null;
        }

        // Check if text node is the only child. If so, return text content as
        // the child data. We do this to match up with the code in
        // davinci.ve.widget.createWidget(), which can take child data either
        // as an array or as a string (representing the innerHTML of a node).
        if (domNode.childNodes.length === 1 && domNode.firstChild.nodeType === 3) {
            return getTextContent(domNode.firstChild);
        }

        const data = [];
        domNode.childNodes.forEach((node) => {
            let d;
            switch (node.nodeType) {
                case 1: // Element
                    const w = WidgetUtils.byNode(node);
                    if (w) {
                        d = w.getData(options);
                    }
                    break;
                case 3: // Text
                    d = getTextContent(node);
                    break;
                case 8: // Comment
                    d = '<!--' + node.nodeValue + '-->';
                    break;
            }
            if (d) {
                data.push(d);
            }
        });
        return data;
    }

    setProperties(properties, modelOnly) {

        const node = this.domNode;
        modelOnly = modelOnly || false; // default modelOnly to false

        for (const name in properties) {
            if (name === 'style') { // needed for position absolute
                // dojo.style(node, properties[name]);
                //@ximpl.
                $(node).css(properties[name]);
            } else {
                if (!modelOnly) {
                    const property = properties[name];
                    // The following check on "property" will result in false value for empty strings
                    if (property || typeof property == 'boolean' || typeof property == 'number') {
                        node.setAttribute(name, property);
                    } else {
                        node.removeAttribute(name);
                    }
                }
            }
        }
        // super(arguments);
    }

    // pass resize along to any child widgets who know how to resize... currently a dijit-only concept.
    // should this method be defined on the _Widget base class?
    resize() {
        this.getChildren().forEach(widget => {
            if (widget.resize) {
                widget.resize();
            }
        });
    }

    _attr(name, value) {
        if (arguments.length > 1) {
            this.domNode[name] = value;
        } else {
            return this.domNode[name];
        }
    }

    getTagName() {
        return this.domNode.nodeName.toLowerCase();
    }
}
