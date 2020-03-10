import { byId, win, toDom, style } from './_html';
import { mixin } from '@xblox/core/objects';
import { Metadata } from './components/metadata';
import { HTMLWidget } from './HTMLWidget';
import { HTMLElement } from './components/html';
import * as lodash from 'lodash';
import * as $ from 'jquery';
import * as utils from '../shared/utils';
import { Registry } from './registry';
import { html } from './_html';
import { HTMLModel } from './components/html';
import { Widget } from './_Widget';
import { EditorContext } from './EditorContext';
import { States } from './States';
import { getCurrentEditor } from './Runtime';

const debugProps = false;
const debugGetData = false;
const debugGetChildren = false;
/*
define([
    "davinci/html/HTMLElement", //HTMLElement
    "../Runtime",
    "./metadata",
    "dojo/Deferred",
    "dojo/_base/lang",
    "./DijitWidget",
    "./GenericWidget",
    "./DeliteWidget",
    "./HTMLWidget",
    "./ObjectWidget",
    "dojo/window"
], (
    HTMLElement,
    Runtime,
    metadata,
    Deferred,
    lang,
    DijitWidget,
    GenericWidget,
    DeliteWidget,
    HTMLWidget,
    ObjectWidget,
    dojoWindow
) => {
*/
const helperCache = {};

//Add temporary IDs to nested children
//Assumes iframe's DOM and the model are in sync regarding the order of child nodes
const childrenAddIds = (context, node, srcElement) => {
    for (let i = 0; i < srcElement.children.length; i++) {
        const childNodeDOM = node.childNodes[i];
        const childNodeModel = srcElement.children[i];
        if ((childNodeDOM && childNodeDOM.nodeType == 1 /*element*/) && childNodeModel.elementType == 'HTMLElement') { //node may have a different child count - wdr
            childNodeDOM.id = context.getUniqueID(childNodeModel);
            childrenAddIds(context, childNodeDOM, childNodeModel);
        }
    }
};

export const parseNodeData = (node, options?: any) => {
    // summary:
    // 		Same general routine as WidgetObject._getData,
    // 		only adding the "html." prefix to the widget type to make it look like a widget to the Dojo Composition Tool.
    //
    if (!node) {
        return undefined;
    }

    options = options || {};

    const data: any = {};
    data.properties = {};

    for (const a of node.attributes) {
        if (!a.specified || !a.nodeValue) {
            continue;
        }
        const n = a.nodeName.toLowerCase();
        if (n == 'id' || n == 'widgetid' || n == 'style') {
            continue;
        } else if (n.charAt(0) == '_') {
            continue;
        }
        let v = a.nodeValue;
        if (v && n == 'class') {
            v = v.replace('HtmlWidget', '').trim();
            if (!v) {
                continue;
            }
        }
        //		if(options.serialize){
        //			var p = properties[n];
        //			if(p && p.type == "url"){
        //				v = context.getContentUrl(v);
        //			}
        //		}
        data.properties[n] = v;
    }

    if (node.tagName.toLowerCase() == 'script') {
        data.children = (node.innerHTML || undefined);
    } //else{
    //	data.children = WidgetObject._getChildrenData(widget, options);
    //}
    return data;
};

const _document = document;

export class WidgetUtils {

    /**
         * Main routine for creating a new widget on the current page canvas
         * @param {object} data  (Needs to be documented!)
         */
    public static async createWidget(widgetData, userData?: any, parent?: any, context?: EditorContext) {
        if (!widgetData || !widgetData.type) {
            return undefined;
        }

        // Some logic below changes the data.properties object. We don't want to mess up
        // other downstream logic in the product, particularly given than data
        // sometimes is a pointer to the original widget object from widgets.json.
        // For purposes of this routine, OK to do a shallow clone of data and data.properties.
        let data = { ...widgetData };
        let isBlox = false;
        if (data.type === 'xblox/RunScript' && data.type === 'xblox/CSSState') {
            isBlox = true;
            delete widgetData.properties.style;
        }
        if (data.properties) {
            data.properties = { ...widgetData.properties };
        }

        const type = data.type;
        let c;
        let theme;
        let dojoType;
        const md = await Metadata.query(type);
        if (!md) {
            console.error('cant get widget meta data : ', widgetData);
            return undefined;
        }

        if (data.properties) {
            // ContentPane content:"" as a default is confusing ModifyCommand.  If we pass this as a default, it will
            // empty out ContentPanes anytime they're modified, so remove for now.  We could remove this property from the metadata.
            if ('content' in data.properties && !data.properties.content) {
                delete data.properties.content;
            }
        }

        if (parent && parent.metadata && parent.metadata.childOverride) {
            mixin(data.properties, parent.metadata.childOverride);
        }

        let widgetClassId = Metadata.queryDescriptor(type, 'widgetClass');
        if (!widgetClassId && userData && userData.widgetClass) {
            widgetClassId = userData.widgetClass;
        }
        //force delite for xblox
        if (md.delite === true || type === 'xblox/RunScript' || type === 'xblox/CSSState' || type === 'xblox/Script' || type === 'xblox/StyleSate') {
            widgetClassId = 'delite';
        }
        let widgetClass;
        if (widgetClassId == 'delite') {
            widgetClass = DeliteWidget;
        } else if (widgetClassId == 'object') {
            /*
            dojoType = type;
            widgetClass = ObjectWidget;
            // Temporary Hack: Required when object specifies a jsId, otherwise object is not created
            // see davinci.ve.ObjectWidget::postCreate::if(id)::var type = this.getObjectType(); (type = undefined without the following lines to add dojoType to the element attributes)
            // Drag tree onto canvas to test.
            // Berkland: Please review! (needs replacing)
            md.attributes = md.attributes || {};
            md.attributes.dojoType = dojoType;
            */

        } else if (widgetClassId == 'html') {
            widgetClass = HTMLWidget;
            //	}else if(widgetClassId == "OpenAjax"){
            //widgetClassName="davinci.ve.OpenAjaxWidget";
        } else if (widgetClassId == 'dijit') {
            //  widgetClass = DijitWidget;
        } else { // if(widgetClassId == "generic"){
            if (widgetClass == null) {
                widgetClass = GenericWidget;
            }
        }
        if (!widgetClass) {
            //debugger;
            return undefined;
        }
        c = widgetClass;

        // XXX eventually replace with dojo.place()?
        // XXX Technically, there can be more than one 'content'
        const content = md.content.trim().replace(/\s+/g, ' ');
        const dDoc = win.get(document);
        // const dDocD = dDoc.dojo;
        // const dDocD_ToDom = dDocD._toDom;
        let node//

        try {
            node = toDom(content, context.getDocument());
        } catch (e) {
            console.error('error creating widget dom', e);
            debugger;
        }

        // XXX Used to create node like this, which added attributes from metadata, is there still a way to do this?
        //	var node = dojo.create(md.tagName || "div", md.attributes);

        if (node.fromWidgetData) {
            node.fromWidgetData(data);
        }

        // Check if widget content consists of more than one node
        if (node.nodeType === 11 /*DOCUMENT_FRAGMENT_NODE*/) {
            let count = 0;
            let n = null;
            let children = node.childNodes;
            for (let i = 0; i < children.length; i++) {
                if (children[i].nodeType !== 8 /*COMMENT_NODE*/) {
                    count++;
                    n = children[i];
                    if (count > 1) {
                        break;
                    }
                }
            }
            // XXX more than one node not supported
            if (count > 1) {
                console.error('ERROR: complex widget content not supported');
                return;
            }
            node = n;
        }

        if (!node) {
            console.warn('have no node')
            return null;
        }

        const srcElement = new HTMLElement(node.tagName.toLowerCase());
        if (node.hasAttributes()) {
            const attrs = node.attributes;
            for (let j = attrs.length - 1; j >= 0; --j) {
                if (isBlox && attrs[j].name === 'style') {
                    continue;
                }
                srcElement.addAttribute(attrs[j].name, attrs[j].value);
            }
        }
        if (node.innerHTML) {
            srcElement.addText(node.innerHTML);
        }

        const requiresId = Metadata.queryDescriptor(type, 'requiresId');
        const name = Metadata.queryDescriptor(type, 'name');
        const idRoot = requiresId && name.match(/^[A-Za-z]\w*$/) ? name : undefined;

        node.id = (data.properties && data.properties.id) || (data.context ? data.context.getUniqueID(srcElement, idRoot) : '');

        let children = data.children;

        if (children) {

            if (lodash.isString(children)) {
                node.innerHTML = children;
                const nodeNameLC = node.nodeName.toLowerCase();
                // 'id' attribute might be temporary. Store off temporarily.
                const idattr = srcElement._getAttribute('id');
                // Temporarily add string as a text node
                srcElement.addText(children);
                // Retrieve outerHTML version, which won't include a temporary 'id' attribute
                const temp_outerHTML = srcElement.getText(data.context);
                // Black out existing children, which will unattach the textnode child inserted above
                srcElement.children = [];
                // Reparse the element
                srcElement.setText(temp_outerHTML);
                // Restore 'id' attribute.
                if (idattr) {
                    srcElement.addAttribute(idattr.name, idattr.value, idattr.noPersist);
                }
                // Add a temporary ID to all of the nested elements that do not have an ID
                childrenAddIds(data.context, node, srcElement);
            } else {
                // Array
                children.forEach((c) => {
                    if (!c) {
                        return;
                    }
                    if (lodash.isString(c)) { // Text or Comment
                        if (c.length > 7 && c.substring(0, 4) == '<!--' &&
                            c.substring(c.length - 3) == '-->') {
                            node.appendChild(document.createComment(c.substring(4, c.length - 3)));
                            srcElement.addComment(c.substring(4, c.length - 3));
                        } else {
                            node.appendChild(document.createTextNode(c));
                            srcElement.addText(c);
                        }
                    } else {
                        c.context = data.context;
                        // XXX Need to load requires on 'c' first?
                        const child = this.createWidget(c, null, null, context);
                        if (child) {
                            node.appendChild(child.domNode);
                            srcElement.addChild(child._srcElement);
                        }
                    }
                });
            }
        }
        //need a helper to process the data for horizontalSlider prior to creating the widget
        // -- may be needed for other widgets with properties of dataype array
        const helper = this.getWidgetHelper(type);
        if (helper && helper.preProcessData) {
            data = helper.preProcessData(data);
        }

        // Strip out event attributes and a[href] attributes. We want them in the model
        // but not in the DOM within page canvas.
        // FIXME: should make the check for a[href] into a helper so other
        // widgets can register similar attributes
        const canvasAndModelProps = {};
        const modelOnlyProps = {};
        // tslint:disable-next-line:forin
        for (const p in data.properties) {
            const propval = data.properties[p];
            if (propval != null) { /*"!=" checks for null/undefined some properties may be false like Tree showRoot */
                if (p.substr(0, 2).toLowerCase() != 'on' && !(srcElement.tag.toLowerCase() == 'a' && p.toLowerCase() == 'href')) {
                    canvasAndModelProps[p] = propval;
                } else {
                    modelOnlyProps[p] = propval;
                }
            }
        }
        const widget = new c(canvasAndModelProps, node, type, md, srcElement, type);
        widget._srcElement = srcElement;

        /* this was _edit_scripts which didn't seem right */
        if (data.scripts) {
            widget.scripts = data.scripts;
        }
        if (data.context) {
            widget._edit_context = data.context;
        }

        if (data.properties) {
            widget.setProperties(canvasAndModelProps);
            widget.setProperties(modelOnlyProps, true);
        }

        //FIXME: Does data.states ever have a value?
        //Yes, gets called when changing 'selected' property on a View
        if (data.maqAppStates || data.maqDeltas) {
            if (data.maqAppStates) {
                widget.domNode._maqAppStates = lodash.clone(data.maqAppStates);
            }
            if (data.maqDeltas) {
                widget.domNode._maqDeltas = lodash.clone(data.maqDeltas);
            }
            const obj = States.serialize(widget.domNode);
            if (obj.maqAppStates) { // if node has a _maqAppStates property
                widget._srcElement.addAttribute(States.APPSTATES_ATTRIBUTE, obj.maqAppStates);
            }
            if (obj.maqDeltas) { // if node has a _maqDeltas property
                widget._srcElement.addAttribute(States.DELTAS_ATTRIBUTE, obj.maqDeltas);
            }
        }

        // In some cases we are handling certain attributes within data-dojo-props
        // or via child HTML elements, and we do not want to allow those attributes
        // to be written out into the final HTML. Here, we give the helper a chance to
        // remove those attributes.
        // let helper = this.getWidgetHelper(type);
        if (helper && helper.cleanSrcElement) {
            helper.cleanSrcElement(widget._srcElement, userData);
        }
        if (helper && helper.postCreateWidget) {
            helper.postCreateWidget(widget, userData);
        }
        console.log('created widget ', data, widget);
        return widget;
    }

    _dojo(node) {
        /*
        let doc = node ? (node.ownerDocument || node) : _document;
        //TODO: for some reason node.ownerDocument is occasionally null
        doc = doc || _document;
        const win = dojoWindow.get(doc);
        return win.dojo || dojo;
        */
    }

    _dijit(node) {
        /*
        const doc = node ? (node.ownerDocument || node) : _document;
        const win = dojoWindow.get(doc);
        return win.dijit || dijit;*/
    }

    //Turns text into an an array of style values
    static parseStyleValues(text) {
        const values = [];
        if (text) {
            text.split(';').forEach((s) => {
                const i = s.indexOf(':');
                if (i > 0) {
                    const n = s.substring(0, i).trim();
                    const v = s.substring(i + 1).trim();
                    const o = {};
                    o[n] = v;
                    values.push(o);
                }
            });
        }
        return values;
    }

    //Looks for a particular property within styleArray
    retrieveStyleProperty(styleArray, propName, defaultValue) {
        let propValue = defaultValue;
        if (styleArray) {
            styleArray.some((o) => {
                if (o.hasOwnProperty(propName)) {
                    propValue = o[propName];
                    return true;
                }
            });
        }
        return propValue;
    }

    //sets value of a particular property in styleArray (or adds if property not found)
    setStyleProperty(styleArray, propName, value) {
        let modifiedProperty = false;
        if (styleArray) {
            styleArray.some((o) => {
                if (o.hasOwnProperty(propName)) {
                    o[propName] = value;
                    modifiedProperty = true;
                    return true;
                }
            });
        }
        if (!modifiedProperty) {
            const o = {};
            o[propName] = value;
            styleArray.push(o);
        }
    }

    //turn styleArray back into string
    getStyleString(styleArray) {
        let styleStr = '';
        styleArray.forEach((style) => {
            for (const p in style) {
                if (style[p]) {
                    styleStr = styleStr + p + ':' + style[p] + ';';
                }
            }
        });
        return styleStr;
    }
    /**
     * Return instance of "managed" widget which contains the given 'node'.
     *
     * @param {DOMElement | davinci.ve._Widget} node
     * 			Element for which to find enclosing "managed" widget.
     *
     * @return "managed" widget instance which contains 'node'; 'undefined' if no
     * 			such valid widget instance is found.
     * @type {davinci.ve._Widget}
     */
    static getEnclosingWidget(node) {
        const richText = WidgetUtils.getEnclosingWidgetForRichText(node);
        if (richText) {
            return richText;
        }
        let enc = node;
        while (enc) {
            if (enc._dvWidget) {
                return enc._dvWidget;
            }
            //        DOMElement || davinci.ve._Widget
            enc = enc.parentNode || (enc.domNode && enc.domNode.parentNode);
        }
    }

    static getEnclosingWidgetForRichText(node) {
        if (!node || !node._dvWidget) {
            return;
        }
        if (node._dvWidget.type === 'html.stickynote' || node._dvWidget.type === 'html.richtext') {
            return node._dvWidget;
        } else if (node.parentNode) {
            return WidgetUtils.getEnclosingWidgetForRichText(node.parentNode);
        } else {
            return null;
        }
    }

    // used by helpers
    getUniqueObjectId(type, node) {
        if (!type) {
            return undefined;
        }

        const base = type.substring((type.lastIndexOf('/') || type.lastIndexOf('.')) + 1);
        let i = 1;
        let id = base + '_' + i++;
        // const dj = WidgetObject._dojo(node);
        // while (dj.getObject(id) || byId(id)) {
        //@ximpl.
        while (byId(id)) {
            id = base + '_' + i++;
        }
        return id;
    }

    //FIXME: This is a hack so that meaningful names
    //don't show a bunch of ugly prefix stuff.
    //Need a better approach for this.
    static _remove_prefix(str) {
        if (str) {
            let returnstr = str;
            const prefixes_to_remove = [
                'dijit/form/',
                'dijit/layout/',
                'dijit/',
                'dojox/mobile/',
                'html.',
                'html/',
                'OpenAjax.',
                'OpenAjax/'
            ];
            for (let i = 0; i < prefixes_to_remove.length; i++) {
                if (str.indexOf(prefixes_to_remove[i]) == 0) { // use ===?
                    returnstr = str.substr(prefixes_to_remove[i].length);
                    //FIXME: Another hack. Need a better approach for this.
                    //Special case logic for HTML widgets
                    if (prefixes_to_remove[i] == 'html.') {
                        returnstr = '&lt;' + returnstr + '&gt;';
                    }
                    break;
                }
            }
            return returnstr;
        }

        return '';
    }

    static _getWidgetNameText(type) {
        let text = '<span class=\'propertiesTitleWidgetName\'>';
        text += this._remove_prefix(type);
        text += '</span>';
        return text;
    }
    static _getWidgetNameRaw(type) {
        let text = '';
        text += this._remove_prefix(type);
        return text;
    }

    static _getWidgetClassText(id, className?: string) {
        let text = '<span class=\'propertiesTitleClassName\'>';
        if (id) {
            text += '#' + id;
        }
        if (className) {
            text += '.' + className.replace(/\s+/g, '.');
        }
        text += '</span>';
        return text;
    }

    /**
     * Simpler version of getLabel, called as part of review/commenting,
     * when there isn't a widget object available.
     * @param node
     * @returns string to display in Maqetta's UI
     */
    static getLabelForNode(node) {
        let type = node.getAttribute('data-dojo-type') || node.getAttribute('dojoType');
        if (!type) {
            type = node.tagName.toLowerCase();
        }
        type = type.replace(/\./g, '/');
        let text = this._getWidgetNameText(type);
        //FIXME: temporarily not showing classname because mobile views look better
        // in review/commenting, but really instead of hard-coding this, we should
        // default to showing classname and allow sceneManager to override the default
        // || node.className
        if (node.id) {
            text += this._getWidgetClassText(node.id);
        }
        return text;
    }
    static getLabel(widget) {
        if (!widget.getId) {
            return 'No Label';
        }
        let text = this._getWidgetNameText(widget.type);

        let widgetText;
        const helper = WidgetUtils.getWidgetHelper(widget.type);
        if (helper && helper.getWidgetText) {
            widgetText = helper.getWidgetText(widget);
        }

        if (helper && helper.getWidgetNameText) {
            text = helper.getWidgetNameText(widget);
        }
        //TODO: move to getWidgetText helper methods
        const domNode = widget.domNode;
        if (!widget.type) {
            return 'unknown type';
        }
        switch (widget.type.replace(/\//g, '.')) {
            case 'dijit.form.ComboBox':
            case 'dijit.form.Button':
                widgetText = widget.attr('label');
                break;
            case 'dijit.layout.ContentPane':
                widgetText = widget.attr('title');
                break;
            case 'html.label':
                widgetText = domNode.innerHTML;
                break;
            case 'html.img':
                widgetText = domNode.alt;
                if (!widgetText) {
                    widgetText = domNode.title;
                }
        }

        if (widgetText) {
            text += '<span class=\'propertiesTitleWidgetText\'>' + widgetText + '</span> ';
        }

        if (helper && helper.getWidgetDescriptor) {
            text += ' <span class=\'propertiesTitleWidgetDescriptor\'>' + helper.getWidgetDescriptor(widget) + '</span> ';
        }

        /* add the class */
        const srcElement = widget._srcElement;
        const id = widget.getId();
        const classAttr = srcElement && srcElement.getAttribute('class');
        const className = classAttr && classAttr.trim();
        if (id || className) {
            /*
             text += "<span class='propertiesTitleClassName'>";
             //text += node.tagName;
             if (id) {
             text += "#" + id;
             }
             if (className) {
             text += "." + className.replace(/\s+/g,".");
             }
             text += "</span> ";
             */
            if (helper && helper._getWidgetClassText) {
                text += helper._getWidgetClassText(id, className);
            } else {
                text += this._getWidgetClassText(id, className);
            }

        }

        if (helper && helper.getWidgetTextExtra) {
            text += helper.getWidgetTextExtra(widget);
        }

        //TODO: move to getWidgetTextExtra helper methods
        if (widget.type == 'html.img') {
            text += '<span>' + domNode.src.substr(domNode.src.lastIndexOf('/') + 1) + '</span>';
        }
        return text;
    }

    static byId(id, doc?: Document) {
        // we're sometimes getting called with context as the second arg; don't pass it as a doc.
        const node = byId(id, doc && doc.body ? doc : undefined);
        if (node) {
            if (node._dvWidget) {
                return node._dvWidget;
            }
            const widget = WidgetUtils.getEnclosingWidget(node);
            if (widget && widget.id == id) {
                return widget;
            }
        }
        const currentEditor = getCurrentEditor();
        if (currentEditor && currentEditor.context) {
            return currentEditor._context.byId(id);
        }
        return undefined;
    }

    static byNode(node) {
        //@ximpl.
        if (node._dvWidget) {
            return node._dvWidget;
        }
        //	var d = WidgetObject._dijit(node);
        //	var w= d.byNode(node);
        //	if (w)
        //	{
        //		node._dvWidget=w;
        //	}
        //	return w;
    }

    static _createSrcElement(node) {
        const srcElement = new HTMLElement(node.tagName.toLowerCase());
        if (node.hasAttributes()) {
            const attrs = node.attributes;
            for (let j = attrs.length - 1; j >= 0; --j) {
                srcElement.addAttribute(attrs[j].name, attrs[j].value);
            }
        }
        return srcElement;
    }

    // assumes the caller has already primed the cache by calling requireWidgetHelper
    static getWidgetHelper(type) {
        return helperCache[type];
    }

    static requireWidgetHelper(type) {
        return new Promise((resolve, reject) => {
            Metadata.getHelper(type, 'helper').then((HelperCtor) => {
                const d: any = HelperCtor;
                if (HelperCtor) {
                    resolve(helperCache[type] = new d());
                } else {
                    resolve();
                }
            });
        });
    }

    static getWidget(node, addHTMLClasses?: any) {
        if (!node || node.nodeType != 1) {
            return undefined;
        }

        let widget = WidgetUtils.byNode(node);

        if (!widget) {
            const data = parseNodeData(node);

            if (data.properties['is'] || node.render != null || node.tagName.indexOf('D-') !== -1) {
                widget = new DeliteWidget(data, node);
                return widget;
            }

            //var oaWidgetType=node.getAttribute("oawidget");

            // @ximpl. 2
            if (node.hasAttribute('widgetid') || node.hasAttribute('data-dojo-type') ||
                node.hasAttribute('dojotype')) {
                /*
            const d = WidgetObject._dijit(node);
            const w = d.byNode(node);
            const widgetType = node.getAttribute('data-dojo-type') || node.getAttribute('dojotype');
            // tslint:disable-next-line:prefer-conditional-expression
            if (w) {
                debugger;
                //@ximpl.
                // widget = new DijitWidget(data, node, w, null, null, widgetType);
            } else {
                widget = new ObjectWidget(data, node);
            }
            // }else if (oaWidgetType){
            // widget = new OpenAjaxWidget(data,node,oaWidgetType);
            */
            } else {
                if (node.nodeName == 'svg') {
                    //FIXME: inline SVG support not yet available
                    return undefined;
                }
                // console.log('create new html widget', data);
                widget = new HTMLWidget(data, node, addHTMLClasses);
            }

        }
        return widget;
    }
};

function fixType(widget) {
    if (widget.declaredClass && widget.declaredClass !== 'davinci.ve.DeliteWidget') {
        widget.type = widget.declaredClass;
    } else if (widget.domNode && widget.domNode.declaredClass && widget.domNode.declaredClass.indexOf('uniq') == -1) {
        widget.type = widget.domNode.declaredClass;
    }

    if (!widget.type && widget.domNode.baseClass) {
        const type = 'delite' + '/' + utils.capitalize(widget.domNode.baseClass.replace('d-', ''));
        switch (type) {

            case 'delite/Radio-button':
                {
                    widget.type = 'delite/RadioButton';
                    break;
                }
            case 'delite/Checkbox':
                {
                    widget.type = 'delite/Checkbox';
                    break;
                }
            case 'delite/Accordion-header':
                {
                    widget.type = 'delite/AccordionHeader';
                    break;
                }
            case 'delite/Combobox':
                {
                    widget.type = 'delite/Combobox';
                    break;
                }
            case 'delite/Toggle-button':
                {
                    widget.type = 'delite/ToggleButton';
                    break;
                }
            case 'delite/Tab-bar':
                {
                    widget.type = 'delite/TabBar';
                    break;
                }
            case 'delite/View-stack':
                {
                    widget.type = 'delite/ViewStack';
                    break;
                }
            case 'delite/MediaPlayer':
                {
                    widget.type = 'delite/MediaPlayer';
                    break;
                }
            case 'delite/Panel':
                {
                    widget.type = 'delite/Panel';
                    break;
                }
            case 'delite/Select':
                {
                    widget.type = 'delite/Select';
                    break;
                }
            case 'delite/Button':
                {
                    widget.type = 'delite/Button';
                    break;
                }
            case 'delite/Accordion':
                {
                    widget.type = 'delite/Accordion';
                    break;
                }
            case 'delite/Slider':
                {
                    widget.type = 'delite/Slider';
                    break;
                }
        }

    }
    if (!widget.type) {
        if (widget.domNode && widget.domNode.getAttribute('is')) {
            const _is = widget.domNode.getAttribute('is');
            widget.type = _is;
        }
    }
    if (!widget.type) {
        console.error('have no widget type ', widget);
    } else {
        Registry.add(widget.domNode)
    }

};

export class DeliteWidget extends Widget {
    container: any;
    isGenericWidget: boolean = true;
    helper: any = Widget;
    static fixType = fixType;
    getData(options) {
        options = options || {
            identify: true,
            preserveStates: true
        };

        let data;
        const helper = this.getHelper();
        // tslint:disable-next-line:prefer-conditional-expression
        if (helper && helper.getData) {
            data = helper.getData.apply(helper, [this, options]);
        } else {
            data = this._getData(options);
        }
        // console.log('get data : ' + options);

        let updatedId = false;
        if (this.id === 'no_id') {
            let _uniqueId = Registry.getUniqueId(this.type.toLowerCase().replace('/', '-').replace(/\./g, '_'));
            _uniqueId = _uniqueId.replace('delite/', 'd-').toLowerCase();
            this.id = _uniqueId;
            data.properties['id'] = _uniqueId;
            data.properties.id = _uniqueId;
            this.domNode.id = _uniqueId;
            updatedId = true;
        }

        if (options.identify && !updatedId) {
            const existing = Registry.byId(this.id);
            if (existing) {
                /*
                _uniqueId = dijit.getUniqueId(this.type.replace(/\./g,"_"));
                _uniqueId = _uniqueId.replace('delite/','d-').toLowerCase();
                this.id = _uniqueId;
                data.properties['id'] = _uniqueId;
                data.properties.id = _uniqueId;
                this.domNode.id = _uniqueId;*/
                //console.error('already exists, set a new id : '+_uniqueId);
            }
        }

        Registry.add(this.domNode);

        data.maqAppStates = { ...this.domNode._maqAppStates };
        data.maqDeltas = { ...this.domNode._maqDeltas }
        if (!data.properties) {
            data.properties = {};
        }

        if (this.properties) {
            for (let name in this.properties) {
                if (!(name in data.properties)) {
                    data.properties[name] = this.properties[name];
                }
            }
        }

        // Find "on*" event attributes and a[href] attributes that are in the model and
        // place on the data object. Note that Maqetta strips
        // on* event attributes and href attributes from the DOM that appears on visual canvas.
        // Upon creating new widgets, the calling logic needs to
        // put these attributes in model but not in visual canvas.
        const srcElement = this._srcElement;
        //FIXME: Assumes "attributes" is a public API. See #nnn
        const attributes = srcElement.attributes;

        for (const attribute of attributes) {
            let name = attribute.name;
            if (attribute.name.substr(0, 2).toLowerCase() == 'on') {
                data.properties[attribute.name] = attribute.value;
            } else if (srcElement.tag.toLowerCase() == 'a' && attribute.name.toLowerCase() == 'href') {
                data.properties[attribute.name] = attribute.value;
            } else if (name === 'stop' || name === 'bidirectional' || name === 'block' || name === 'targetevent') {
                data.properties[attribute.name] = attribute.value;
            }
        }

        //console.log('get data : '+data.properties.id + ' : ' + options.identify + ' this.id = ' + this.id,data);
        return data;
    }
    _fixType(widget) {
        return fixType(widget);
    }
    _getChildren(attach) {
        const children = [];
        const thiz = this;

        let searchNode = this.container || this.domNode;
        //this.containerNode is davinci.DeliteWidget, and if the widget is a 'Container', use it
        if (searchNode.containerNode && this.domNode.render == null) {
            searchNode = searchNode.containerNode;
        }
        if (this.domNode && this.domNode.render != null) {
            searchNode = this.domNode;
        }
        const veWidget = WidgetUtils;

        function search(searchNode) {
            if (!searchNode.children || !searchNode.children.forEach) {
                // return console.error('searchNode.children : invalid', searchNode);
            }
            [...searchNode.children].forEach((node) => {
                const _widget = veWidget.getWidget(node, false);
                //console.log('delite widget: get children '+attach,[_widget,node]);
                if (_widget && !_widget.type) {
                    thiz._fixType(_widget);
                }

                const ignore = false;
                if (thiz.metadata && thiz.metadata.ignore && _widget.type) {
                    if (thiz.metadata.ignore.indexOf(_widget.type) !== -1) {
                        console.log('ignore : ', attach);
                        return;
                    }
                }
                if (_widget && _widget.type && (_widget.type.indexOf('html.') == -1 || (thiz.metadata && thiz.metadata.htmlContent == true))) {
                    children.push(_widget);
                }
            });
        }
        if (searchNode) {
            search(searchNode);
            if (children.length == 0 && this.domNode.containerNode) {
                search(this.domNode.containerNode);
            }
        }

        if (thiz.metadata && thiz.metadata.noChildren) {
            return [];
        }

        //console.log('delite widget: get children for '+attach,searchNode);
        debugGetChildren && console.log('delite widget: get children: ' + attach, [searchNode, children]);

        return children;
    }
    getChildren(attach) {
        const helper = this.getHelper();
        if (helper && helper.getChildren) {
            return helper.getChildren(this, attach);
        }

        const children = this._getChildren(attach);
        //console.log('_children '+this.id,children);
        return children;
    }
    constructor(params, node, type?: string, metadata?: any, srcElement?: any) {
        super(params, node, type, metadata);
        this.acceptsHTMLChildren = true;
    }
    buildRendering() {
        //		if(this.srcNodeRef) {
        //			this.domNode = this.srcNodeRef;
        //		}else{
        //			this.domNode = dojo.doc.createElement("div");
        //		}
        this.containerNode = this.domNode; // for getDescendants()
        if (this._params) {
            // tslint:disable-next-line:forin
            for (const name in this._params) {
                this.domNode.setAttribute(name, this._params[name]);
            }
            this._params = undefined;
        }
    }
    _getChildrenData(options) {
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

        if (domNode && domNode.getChildrenData) {
            return domNode.getChildrenData();
        }

        // Check if text node is the only child. If so, return text content as
        // the child data. We do this to match up with the code in
        // davinci.ve.widget.createWidget(), which can take child data either
        // as an array or as a string (representing the innerHTML of a node).
        if (domNode.childNodes.length === 1 && domNode.firstChild.nodeType === 3) {
            //return getTextContent(domNode.firstChild);
            console.log('"child content : ' + getTextContent(domNode.firstChild));
        }

        const childrenData = [];
        let childNodes = this.domNode.childNodes;
        const _widget = WidgetUtils;
        if (this.metadata && this.metadata.noChildren) {
            childNodes = [];
        }

        for (const n of childNodes) {
            let d;
            let isText = false;
            //var _w = _widget.byNode(n);
            switch (n.nodeType) {
                case 1: // Element

                    const w = _widget.byNode(n);
                    if (w && w.type && w.type.indexOf('html.') !== -1 && this.metadata.htmlContent !== true) {
                        break;
                    }
                    if (this.metadata && this.metadata.ignore && w.type) {
                        if (this.metadata.ignore.indexOf(w.type) !== -1) {
                            break;
                        }
                    }
                    if (w) {
                        d = w.getData(options);
                    }
                    break;
                case 3: // Text
                    d = n.nodeValue.trim();
                    if (d && (options.serialize || this.metadata.htmlContent === true)) {
                        d = HTMLModel.escapeXml(d);
                    }
                    isText = true;
                    break;
                case 8: // Comment
                    d = '<!--' + n.nodeValue + '-->';
                    break;
            }

            if (d && (d.type && d.type.indexOf('html.') == -1) || (d && this.metadata.htmlContent === true)) {
                childrenData.push(d);
            }
        }

        //console.log('_getChildrenData', childrenData);
        if (childrenData.length === 0) {
            return undefined;
        }
        debugGetData && console.log('_getchildren data', childrenData);
        return childrenData;
    }
    _getPropertyValue(name) {
        debugProps && console.log('get properties', arguments);
        if (this.domNode._get) {
            let _p = this.domNode._get(name);
            if (_p != null) {
                return _p;
            } else {
                _p = this.domNode.getAttribute(name);
            }
            return _p;
        } else {
            //not parsed yet?
            if (this.containerNode && name in this.containerNode) {
                return this.containerNode[name];
            }
        }
    }
    setProperties(properties) {
        //ximpl.
        const node = this.domNode;
        debugProps && console.log('set properties', arguments);
        for (const name in properties) {
            if (name === 'style') { // needed for position absolute
                // style.set(node, properties[name]);
                $(node).attr(name, properties[name])
            } else {
                if (!properties[name]) {
                    node.removeAttribute(name);
                } else {
                    node[name] = properties[name];
                    if (node._set) {
                        node._set(name, properties[name]);
                    }
                    // attr(node, name, );
                    $(node).attr(name, properties[name])
                }
            }

        }
        // this.inherited(arguments);*/
    }
    _attr(name, value) {
        //console.log('_attr', arguments);
        //return this.dijitWidget.get.apply(this.dijitWidget, arguments);
        /*
         if (arguments.length>1) {
         this.domNode.setAttribute(name, value);
         } else {
         return this.domNode.getAttribute(name);
         }*/
    }
    getTagName() {
        return this.domNode.nodeName.toLowerCase();
    }
    getParent() {
        //ximpl.
        if (this.type == 'xblox/RunScript' /*|| this.type=='xblox/CSSState' || this.type=='xblox/StyleState'*/) {
            const instance = this.domNode;
            if (instance && instance._targetReference && instance._targetReference._dvWidget) {
                return instance._targetReference._dvWidget;
            }
        }
        // console.error('ximpl, getParent');
        // return this.inherited(arguments);
        return WidgetUtils.getEnclosingWidget(this.domNode.parentNode) || this.domNode.parentNode;
    }
}
