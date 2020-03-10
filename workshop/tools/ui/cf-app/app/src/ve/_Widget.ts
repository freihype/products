import { mixin } from '@xblox/core/objects';
import { EventEmitter } from 'events';
import { Registry } from './registry';
import { Metadata } from './components/metadata';
import * as CSSModel from './components/html/CSSModel';
import * as lodash from 'lodash';
import * as htmlEntities from './_html/HtmlEntities';
import * as StyleArray from './utils/StyleArray';
import { WidgetUtils } from './';
import { GeomUtils } from './utils';
import * as $ from 'jquery';
import { States } from './States';
import { EditorContext } from './EditorContext';

/*
define("davinci/ve/_Widget", [
    "dojo/_base/declare",
    "./metadata",
    '../html/CSSModel',
    'dojox/html/entities',
    'davinci/ve/utils/StyleArray',
    'davinci/ve/utils/GeomUtils',
    'xide/mixins/EventedMixin',
    'xide/mixins/ReloadMixin'
], (
    declare,
    metadata,
    CSSModel,
    htmlEntities,
    StyleArray,
    GeomUtils,
    EventedMixin,
    ReloadMixin
) => {
*/
const arrayEquals = (array1, array2, func?: any) => {
    if (array1 == array2) {
        return true;
    }
    if (!array1 || !array2) {
        return false;
    }
    if (array1.length != array2.length) {
        return false;
    }
    for (let i = 0; i < array1.length; i++) {
        if (func) {
            if (!func(array1[i], array2[i])) {
                return false;
            }
        } else {
            if (array1[i] != array2[i]) {
                return false;
            }
        }
    }
    return true;
};
export class Widget extends EventEmitter {

    _edit_helper: any;
    dijitWidget: any;
    properties: any;
    isHtmlWidget: any;
    styleNode: any;
    _srcElement: any;
    _edit_context: any;
    metadata: any;
    type: any;
    _params: any;
    domNode: any;
    id: any;
    isWidget: boolean = true;
    containerNode: any;
    acceptsHTMLChildren: boolean = false;

    /**
     * @static
     */
    _skipAttrs: Array<string> = ['id', 'class', 'dir', 'lang', '_children'];

    constructor(params, node, type, metadata) {
        super();
        this.domNode = node;
        this.id = node.id;
        node._dvWidget = this;
        this._params = mixin({}, params);
        this.type = type;
        this.metadata = metadata;
    }

    postscript() {
        // FIXME: The following lines of code attempt to find
        // the context object that applies to the widget we are creating.
        // However, depending on various code paths, sometimes the context is
        // not available on widget or widget's domNode._dvWidget, so have
        // to go all the way back to BODY element.
        // Instead, we need to fix so that context is already available on "this" object.
        let context;
        if (this.domNode) {
            const doc = this.domNode.ownerDocument;
            if (doc.body._edit_context) {
                context = doc.body._edit_context;
            } else if (doc.body._dvWidget && doc.body._dvWidget._edit_context) {
                context = doc.body._dvWidget._edit_context;
            }
        }
        if (this.id && context) {
            context.widgetHash[this.id] = this;
        }
        this.buildRendering();
        this.postCreate();
    }

    buildRendering() { }

    postCreate() {
        // console.error('post',this);
    }

    getObjectType() { }

    getContext(): EditorContext {
        return this._edit_context;
    }

    getChildren(attach?: boolean) {
        const helper = this.getHelper();
        if (helper && helper.getChildren) {
            return helper.getChildren(this, attach);
        }
        return this._getChildren(attach);
    }

    _indexOf(child) {
        const helper = this.getHelper();
        if (helper && helper.indexOf) {
            return helper.indexOf(this, child);
        }
        return this.getChildren().indexOf(child);
    }
    _getChildrenForTree(attach) {
        let containerNode = this.getContainerNode();
        const children = [];

        if (containerNode && !containerNode.children.length && this.domNode.children.length) {
            containerNode = this.domNode;
        }
        if (containerNode) {

            containerNode.children.forEach((node) => {

                const _widget = Registry.getEnclosingWidget(node);
                if (_widget != this) {
                    children.push(_widget);
                }
            });
        }
        return children;
    }
    _getChildren(attach) {
        const containerNode = this.getContainerNode();
        const children = [];
        /*
         if(containerNode && !containerNode.children.length && this.domNode.children.length){
         containerNode=this.domNode;
         }*/

        const nodes = [...containerNode.children];

        if (containerNode) {
            nodes.forEach((node) => {
                if (attach) {
                    children.push(WidgetUtils.getWidget(node));
                } else {
                    const widget = node._dvWidget;
                    if (widget) {
                        children.push(widget);
                    }
                }
            });
        }

        return children;
    }

    getContainerNode() {
        const helper = this.getHelper();
        if (helper && helper.getContainerNode) {
            return helper.getContainerNode(this);
        }

        if (Metadata.getAllowedChild(this.type)[0] !== 'NONE') {
            return this._getContainerNode();
        }
        return null;
    }

    _getContainerNode() {
        return this.domNode;
    }

    getMetadata() {
        if (!this.metadata) {
            this.metadata = Metadata.query(this);
        }
        return this.metadata;
    }

    getHelper() {
        console.warn('_widget:getHelper : ximpl');
        //@ximpl.
        if (!this._edit_helper) {
            this._edit_helper = WidgetUtils.getWidgetHelper(this.type);
        }
        return this._edit_helper;
        // return {} as any;
    }

    attr(name, value) {
        const attrValue = this._attr.apply(this, arguments);
        if (arguments.length > 1) {
            value = this._stringValue(name, value);
            this._srcElement.addAttribute(name, value);
        } else {
            return attrValue;
        }
    }

    _attr(name, value) {
        console.log('_attr', arguments);
    }

    indexOf(child) {
        const helper = this.getHelper();
        if (helper && helper.indexOf) {
            return helper.indexOf(this, child);
        }
        return this.getChildren().indexOf(child);
    }

    getStyleNode() {
        return this.styleNode || this.domNode; // for Textarea on FF2
    }

    addChild(child, index) {
        const containerNode = this.getContainerNode();
        if (containerNode) {
            // add to model (source)
            if (index === undefined || index === null || index === -1) {
                this._srcElement.addChild(child._srcElement);
            } else {
                const children = this.getChildren();
                if (index < children.length) {
                    this._srcElement.insertBefore(child._srcElement, children[index]._srcElement);
                } else {
                    this._srcElement.addChild(child._srcElement);
                }
            }

            // add to VE DOM
            const helper = this.getHelper();
            if (helper && helper.addChild) {
                helper.addChild(this, child, index);
            } else {
                this._addChildToDom.apply(this, arguments);
            }
        }
    }

    _addChildToDom(child, index) {
        try {
            const node = child.domNode;
            const containerNode = this.getContainerNode();
            if (index === undefined || index === null || index === -1) {

                containerNode.appendChild(node);
            } else {
                const children = this.getChildren();
                if (index < children.length) {
                    containerNode.insertBefore(node, children[index].domNode);
                } else {
                    containerNode.appendChild(node);
                }
            }
        } catch (e) {
            debugger;
        }
    }

    getParent() {
        //@ximpl.
        return WidgetUtils.getEnclosingWidget(this.domNode.parentNode) || this.domNode.parentNode;
        //debugger;
        //return {} as any;
    }

    getObjectId(widget?: any) {
        widget = widget || this;
        const objectId = widget._edit_object_id;
        if (objectId) {
            return objectId;
        }
        if (widget.domNode) {
            return widget.domNode.getAttribute('jsId');
        }
        return undefined;
    }

    addClass(newClass) {
        // add to Model...
        let classes = this.getClassNames();
        classes = classes ? classes.split(/\s+/) : [];
        if (classes.indexOf(newClass) !== -1) {
            // duplicate class name
            return;
        }
        classes.push(newClass);
        this._srcElement.setAttribute('class', classes.join(' '));

        // add to DOM...
        $(this.domNode).addClass(newClass);
    }

    getId() {
        if (!this.id) {
            if (!this.domNode.id || !this.type) {
                return undefined;
            }

            const id = this.domNode.id;
            const base = (this.isHtmlWidget ? this.getTagName() : this.type).replace(/\./g, '_') + '_';
            if (id.length > base.length && id.substring(0, base.length) == base) {
                // auto-generated id
                return undefined;
            }
        }
        if (this._srcElement && this._srcElement._getAttribute('id') &&
            this._srcElement._getAttribute('id').noPersist) {
            return undefined;
        }

        return this.id;
    }

    setMarginBox(box) {
        const node = this.getStyleNode();
        if (!node) {
            return;
        }

        //@ximpl.
        //dojo.marginBox(node, box);
        this._updateSrcStyle();
    }

    getMarginBox() {
        const node = this.domNode;
        let box = null;
        const helper = this.getHelper();
        // tslint:disable-next-line:prefer-conditional-expression
        if (helper && helper.getMarginBoxPageCoords) {
            box = helper.getMarginBoxPageCoords(this);
        } else {
            box = GeomUtils.getMarginBoxPageCoords(node);
        }
        box.l -= GeomUtils.getScrollLeft(node);
        box.t -= GeomUtils.getScrollTop(node);
        box.x = box.l;
        box.y = box.t;

        return box;
    }

    getStyle(options?: any) {
        const values = this.getStyleValues(options);
        if (!values) {
            return '';
        }
        return this._styleText(values);
    }

    _sortStyleValues(values) {

        const cleaned = [...values]

        function indexWithProperty(value) {
            for (let i = 0; i < cleaned.length; i++) {
                if (cleaned[i] && cleaned[i].hasOwnProperty(value)) {
                    return i;
                }
            }
            return -1;
        }

        // return a sorted array of sorted style values.
        const shorthands = CSSModel.shorthand;
        let lastSplice = 0;
        /* re-order the elements putting short hands first */

        for (let i = 0; i < shorthands.length; i++) {
            const index = indexWithProperty(shorthands[i][0]);
            if (index > -1) {
                const element = cleaned[index];
                cleaned.splice(index, 1);
                cleaned.splice(lastSplice, 0, element);

                lastSplice++;
            }
        }
        return cleaned;
    }

    _styleText(v) {
        let s = '';

        //@ximpl.
        // if ordering is given, respect it
        if (lodash.isArray(v)) {
            const vArray = States.normalizeArray('style', this.domNode, name, v);
            for (let i = 0; i < vArray.length; i++) {
                // tslint:disable-next-line:forin
                for (let name in vArray[i]) { // Should be only one property in each array item
                    let value = vArray[i][name];
                    if (value !== undefined && value != '' && value != null) {
                        s += name + ': ' + vArray[i][name] + '; ';
                    }
                }
            }
        } else {
            // tslint:disable-next-line:forin
            for (let name in v) {
                let value = States.normalize('style', this.domNode, name, v[name]);
                if (value !== undefined && value != '' && value != null) {
                    s += name + ': ' + v[name] + '; ';
                }
            }
        }
        return s.trim();
    }

    getChildrenData(options) {
        options = options || {
            identify: true
        };

        const helper = this.getHelper();
        if (helper && helper.getChildrenData) {
            return helper.getChildrenData.apply(helper, [this, options]);
        }

        return this._getChildrenData(options);
    }

    _getChildrenData(options) {
        return this.getChildren().map(w => w.getData(options));
    }

    getClassNames(options?: any) {
        return this._srcElement.getAttribute('class') || '';
    }

    public _getData(options) {
        const data: any = {
            type: this.type,
            properties: {}
        };

        const widgetUtils = WidgetUtils; //require('davinci/ve/widget');
        //FIXME: Might need OpenAjax widgets logic here someday
        if (options.identify) {
            if (!this._srcElement) { //wdr why is the _srcElement missing?
                this._srcElement = widgetUtils._createSrcElement(this.domNode);
            }
            const idProp = this._srcElement._getAttribute('id');
            //if (this._srcElement._getAttribute("id").noPersist)
            if (idProp && idProp.noPersist) {
                data.properties.isTempID = true;
            }

            data.properties.id = this.id;
        }
        if ((options.preserveTagName !== false) && (this.id)) {
            data.tagName = this._srcElement.tag;
        }

        // get all properties
        /*
        let properties = Metadata.query(this, 'property');
        properties.then((p) => {
            console.log('props ', p);
        });
        console.error('a pr', properties);
        debugger;
        */
        let properties = this.metadata.property;
        if (this.domNode && this.domNode.parentNode) {
            const parent = widgetUtils.getEnclosingWidget(this.domNode.parentNode);
            const childProperties = Metadata.query(parent, 'childProperties');
            if (childProperties) {
                // tslint:disable-next-line:prefer-conditional-expression
                if (!properties) {
                    properties = childProperties;
                } else {
                    properties = mixin({}, properties, childProperties);
                }
            }
        }

        if (properties) {
            // tslint:disable-next-line:forin
            for (const name in properties) {
                const _name: string = name as string;
                if (this._skipAttrs.indexOf(_name.toLowerCase()) !== -1) {
                    continue;
                }
                const property = properties[name];
                /*if(name == "theme") {
                 value = require("davinci/ve/widget").getPropertyValue(widget, name).themeName;
                 data.properties[name] = value;
                 }
                 else{*/
                const value = this.getPropertyValue(name);
                if (value && value.length) {
                    if (property.datatype == 'array') {
                        if (!arrayEquals(value, property.defaultValue)) {
                            data.properties[name] = value;
                        }
                    } else {
                        if (value != property.defaultValue) {
                            data.properties[name] = value;
                        }
                    }
                } else {
                    // handle bool/numeric
                    if ((property.datatype == 'boolean' || property.datatype == 'number') && value != property.defaultValue) {
                        data.properties[name] = value;
                        // HACK: There's probably a better way to do this with the new model, just a stopgap measure until Phil takes a look
                    } else if (property.datatype && (property.datatype.indexOf('dijit') == 0 || property.datatype == 'object' && property.isData)) {
                        data.properties[name] = value;
                    }
                }
                //}
            }
        }
        data.properties.style = this.getStyle(options);
        const classNames = this.getClassNames(options);
        if (classNames) {
            data.properties['class'] = classNames;
        }

        data.children = this.getChildrenData(options);

        if (data.type.indexOf('delite') !== -1) {

        }
        return data;
    }

    getData(options?: any) {
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

        data.maqAppStates = { ...this.domNode._maqAppStates };
        data.maqDeltas = { ...this.domNode._maqDeltas };
        if (!data.properties) {
            data.properties = {};
        }

        if (this.properties) {
            for (const name in this.properties) {
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
            if (attribute.name.substr(0, 2).toLowerCase() == 'on') {
                data.properties[attribute.name] = attribute.value;
            } else if (srcElement.tag.toLowerCase() == 'a' && attribute.name.toLowerCase() == 'href') {
                data.properties[attribute.name] = attribute.value;
            }
        }

        return data;
    }

    getPropertyValue(name) {
        if (name === 'id') {
            return this.getId();
        } else if (name === 'jsId') {
            return this.getObjectId();
        }

        const helper = this.getHelper();
        if (helper && helper.getPropertyValue) {
            // FIXME: Helper has to know about _getPropertyValue function
            // Would be cleaner if we used OO approach
            return helper.getPropertyValue(this, name);
        }

        return this._getPropertyValue(name);
    }

    _getPropertyValue(name) {
        return this.domNode.getAttribute(name);
    }

    getTagName() {
        return this.domNode.nodeName.toLowerCase();
    }

    getStyleValues(options?: any) {

        function removeProperty(propName) {
            for (let j = values.length - 1; j >= 0; j--) {
                const item = values[j];
                if (item[propName] !== undefined) {
                    values.splice(j, 1);
                }
            }
        }

        const style = this.getStyleNode().style;
        const text = this._srcElement.getAttribute('style');

        //@ximpl.
        let values = WidgetUtils.parseStyleValues(text);

        /*FIXME: DELETE THIS. Leaving it in temporarily in case in last-minute Preview 6 testing we discover a need for this logic
         var o;
         if(style) {
         if(style.position == "absolute" || style.position == "relative") {
         var parent = this.getParent();
         removeProperty('position');
         removeProperty('left');
         removeProperty('top');
         //FIXME: This is Dojo-specific logic within a toolkit-independent file
         if(parent && parent.dijitWidget && parent.dijitWidget.addChild && !parent.acceptsHTMLChildren) {
         // Do nothing - logic above removed position/left/top
         }else{
         values.push({position:style.position});
         values.push({left:style.left});
         values.push({top:style.top});
         }
         }
         var resizable = metadata.queryDescriptor(this.type, "resizable");
         if(style.width) {
         if(resizable == "both" || resizable == "width") {
         removeProperty('width');
         values.push({width:style.width});
         }
         }
         if(style.height) {
         if(resizable == "both" || resizable == "height") {
         removeProperty('height');
         values.push({height:style.height});
         }
         }
         }
         */
        const parent = this.getParent();
        //FIXME: This is Dojo-specific logic within a toolkit-independent file
        if (style && parent && parent.dijitWidget && parent.dijitWidget.addChild && !parent.acceptsHTMLChildren) {
            removeProperty('position');
            removeProperty('left');
            removeProperty('top');
        }
        return values;
    }

    /**
     * Returns an associative array holding all CSS properties for a given widget
     * for all application states that have CSS values.
     * The associative array is indexed by the application states in the current page,
     * with Normal state named 'undefined'. In the associative array, each property
     * is a valueArray: an array of objects, where each object is {<propname>:<propvalue>}.
     * For example:
     * {'undefined':[{'color':'red},{'font-size':'12px'}],'State1':[{'font-size':'20px'}]}
     */
    getStyleValuesAllStates() {
        //FIXME: Normal states shouldn't accidentally become 'undefined'
        const normalStyleArray = this.getStyleValues();
        const styleValuesAllStates = {
            undefined: normalStyleArray
        };
        const states = this.domNode._maqDeltas;
        if (states) {
            for (const state in states) {
                if (states[state].style) {
                    // tslint:disable-next-line:prefer-conditional-expression
                    if (state === 'undefined') {
                        styleValuesAllStates[state] = StyleArray.mergeStyleArrays(normalStyleArray, states[state].style);
                    } else {
                        styleValuesAllStates[state] = states[state].style;
                    }
                }
            }
        }
        return styleValuesAllStates;
    }

    _updateSrcStyle() {
        const styleValue = this.getStyle();
        if (styleValue.length) {
            this._srcElement.addAttribute('style', styleValue);
        } else {
            this._srcElement.removeAttribute('style');
        }
    }

    _getStyleString(values) {
        if (!values) {
            return '';
        }
        const v = this._sortStyleValues(values);
        /* we used to retrieve the style properties as an array, then flatten the values.
         *
         * changed to serialize it as text, then reset the style attribute
         */

        /*
         for(var i=0;i<v.length;i++) {
         for(var name in v[i]){
         var value = v[i][name] || "";
         if(name.indexOf("-") >= 0) {
         // convert "property-name" to "propertyName"
         var names = name.split("-");
         name = names[0];
         for(var j = 1; j < names.length; j++) {
         var n = names[j];
         name += (n.charAt(0).toUpperCase() + n.substring(1));
         }
         }
         if(value=="")
         value = null;

         style[name] = value;

         }
         }
         */
        const text = this._styleText(v);
        return text;
    }

    /**
     * Updates element.style for current widget as shown on page canvas
     * (The values passed in might be state-specific)
     */
    setStyleValuesCanvas(values) {
        if (!values) {
            return;
        }
        const text = this._getStyleString(values);
        const styleDomNode = this.getStyleNode();

        /* reset the style attribute */
        // dojo.attr(styleDomNode, 'style', text);
        $(styleDomNode).attr('style', text);

        if (this.dijitWidget) {
            this.dijitWidget.style = text;
        }
    }

    /**
     * Update element.style in model
     */
    setStyleValuesModel(values) {
        const text = this._getStyleString(values);
        if (text.length > 0) {
            this._srcElement.addAttribute('style', text);
        } else {
            this._srcElement.removeAttribute('style');
        }
    }

    /**
     * Returns an associative array holding all CSS properties for a given widget
     * for all application states that have CSS values.
     * The associative array is indexed by the application states in the current page,
     * with Normal state named 'undefined'. In the associative array, each property
     * is a valueArray: an array of objects, where each object is {<propname>:<propvalue>}.
     * For example:
     * {'undefined':[{'color':'red},{'font-size':'12px'}],'State1':[{'font-size':'20px'}]}
     */
    setStyleValuesAllStates(styleValuesAllStates) {
        this.domNode._maqDeltas = undefined;
        if (styleValuesAllStates) {
            // tslint:disable-next-line:forin
            for (let state in styleValuesAllStates) {
                const styleArray = styleValuesAllStates[state];
                //FIXME: Normal states shouldn't accidentally become 'undefined'
                if (state === 'undefined') {
                    state = undefined;
                }
                States.setStyle(this.domNode, state, styleArray, true);
            }
        }
    }

    isLayout() {
        return false;
    }

    resize() { }

    /* if the widget is a child of a dijit Container widget
     * we may need to refresh the parent to make it all look correct in page editor
     * FIXME: need to factor out dijit-specific code from this base class
     */
    refresh() {
        const parent = this.getParent();
        if (parent && parent.dijitWidget) {
            parent.refresh();
        } else if (this.resize) {
            this.resize();
        }
    }
    ///Widget
    removeChild(child: any) {
        // remove from model (source)
        if (this._srcElement) {
            this._srcElement.removeChild(child._srcElement);
        } else {
            console.error('cant remove child! this._srcElement is null', this);
        }

        // remove from VE DOM
        const helper = this.getHelper();
        if (helper && helper.removeChild) {
            helper.removeChild(this, child);
        } else {
            this._removeChildFromDom.apply(this, arguments);
        }
    }

    _removeChildFromDom(child) {
        const node = child.domNode;
        if (node && node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }

    setProperties(properties, modelOnly) {

        if (!this.properties) {
            this.properties = {};
        }

        modelOnly = modelOnly || false; // default modelOnly to false

        if (properties.id) {
            this._srcElement.addAttribute('id', properties.id, properties.isTempID);
            delete properties.id;
            delete properties.isTempID;
        }
        if (properties.isTempID) { // delete so it does not make it's way to the source
            delete properties.isTempID;
        }
        // tslint:disable-next-line:forin
        for (const name in properties) {
            const property = properties[name];
            // The following check on "property" will result in false value for empty strings
            if (property || typeof property == 'boolean' || typeof property == 'number') {
                const value = this._stringValue(name, property);
                if (!modelOnly) {
                    this.properties[name] = value;
                }
                this._srcElement.addAttribute(name, value);
            } else {
                delete this.properties[name];
                this._srcElement.removeAttribute(name);
            }
        }
    }

    startup() {
    }

    renderWidget() { }

    destroyWidget(widget?: any) {
        const helper = this.getHelper();
        if (helper && helper.destroy) {
            helper.destroy(this);
            return;
        }
        if (this.dijitWidget) {
            // XXX Dijit-specific code, doesn't belong here.
            this.dijitWidget.destroyRecursive();
        } else {
            this.getChildren().forEach((each) => {
                each.destroyWidget();
            });
        }
    }
    destroy() {
        // this.inherited(arguments);
        console.error('destry');
    }

    selectChild(widget) { }

    attach() {
        const helper = this.getHelper();
        if (helper && helper.create) {
            if (this._srcElement) {
                helper.create(this, this._srcElement);
            } else {
                console.error('widget attach : have no src element', this);
            }
        }
    }

    _stringValue(attributeName, value) {

        const metadata = this.getMetadata();
        const property = metadata.property && metadata.property[attributeName];
        if (!property) {
            return value;
        }
        if (property.datatype == 'object') {
            if (value.getObjectId) {
                value = value.getObjectId();
            } else { // not wrapped
                const objectId = value._edit_object_id;
                if (objectId) {
                    return objectId;
                }
                if (value.domNode) {
                    return value.domNode.getAttribute('jsId');
                }
            }
        } else if (property.datatype == 'json') {
            // Kludge to prevent array from iframe from being mistaken as object
            const context = this.getContext();
            const helper = this.getHelper();
            if (helper && helper.checkValue) {
                value = helper.checkValue(value);
            }

            if (lodash.isObject(value)) {
                value = JSON.stringify(value);
            }
        } else if (property.datatype == 'string') {
            switch (property.format) {
                // shouldn't be needed
                //		        case "url":
                //	                value = this.getContext().getContentUrl(value);
                //		            break;
                case 'date':
                case 'time':
                    if (isFinite(value)) {
                        //@ximpl.
                        /*
                        value = dojo.date.stamp.toISOString(value, {
                            selector: property.format
                        });
                        */
                    }
                    /*else{
                     value = "";
                     }*/
                    break;
                default:
                    value = htmlEntities.encode(value); //When placing data in an HTML attribute, we should probably just encode it to be safe.

            }
            // XXX is this used?
            //		}else if(property.type == "widget") {
            //			if (value.getId)
            //				value = value.getId();
            //			else
            //			   value=value.id;
        }
        return value;
    }
}

console.log('Widget', Widget);
