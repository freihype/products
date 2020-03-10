import { remove } from '@xblox/core/arrays';
import { mixin } from '@xblox/core/objects';
import * as $ from 'jquery';
import * as lodash from 'lodash';
import { VisualEditor } from '.';
import * as Events from '../shared/Evented';
import * as utils from '../shared/utils';
import { DeliteWidget, WidgetUtils, parseNodeData } from './';
import { ChooseParent } from './ChooseParent';
import { HTMLWidget } from './HTMLWidget';
import { ContextFocus } from './_ContextFocus';
import * as html from './_html/_base';
import { CommandStack } from './commands/CommandStack';
import { HTMLElement, Path, HTMLText } from './components/html';
import { HTMLFile } from './components/html/HTMLFile';
import { Metadata } from './components/metadata';
import { Registry } from './registry';
import { SelectTool } from './tools/SelectTool';
import { Tool } from './tools/_Tool';
import { EVENTS } from './types';
import { every } from './utils';
import { GeomUtils } from './utils/GeomUtils';
import { win as win, create, style } from './_html';
import { RESOURCE_VARIABLES } from '../config';
import { Snap } from './Snap';
import { Library } from './components/library';
let contextCount = 0;
const debug = false;
const debugWidgets = false;
const debugAttach = false;
const removeEventAttributes = (node) => {
    const libraries = Metadata.getLibrary();	// No argument => return all libraries
    if (node) {
        const atts = [];
        // tslint:disable-next-line:forin
        for (let a in node.attributes) {
            if (typeof a === 'string') {
                atts.push(node.attributes[a]);
            }
        }
        atts.filter((attribute) => {
            return attribute.nodeName && attribute.nodeName.substr(0, 2).toLowerCase() == 'on';
        }).forEach((attribute) => {
            // let requiredAttribute = false;
            // tslint:disable-next-line:forin
            for (let libId in libraries) {
                /*
                 * Loop through each library to check if the event attribute is required by that library
                 * in page designer
                 */
                const library = Metadata.getLibrary(libId);
                const requiredAttribute = Metadata.invokeCallback(library, 'requiredEventAttribute', [attribute]);
                if (requiredAttribute) {
                    /*
                     * If the attribute is required by a library then we stop checking
                     * it only needs to be required by one library for us to leave it on the node
                     */
                    break;
                }
            }
            //requiredAttribute=true;
            //if (!requiredAttribute) {
            /*
             * No library requires this event attribute in page designer so we will remove it.
             */
            /*
             node.removeAttribute(attribute.nodeName);
             var _function = new Function("{" +attribute.nodeValue+"; }");

             var _handle = dojo.connect(attribute.name.replace('on'),node,function(e){
             _function.call(node,arguments);
             });
             node['__'+attribute.name] = _handle;*/

            /*console.log('remove ' +attribute.nodeName);*/
            //}
        });
    }
};
const removeHrefAttribute = (node) => {
    if (node.tagName && node.tagName.toUpperCase() == 'A' && node.hasAttribute('href')) {
        node.removeAttribute('href');
    }
};

const MOBILE_DEV_ATTR = 'data-maq-device';
const PREF_LAYOUT_ATTR = 'data-maq-flow-layout';
const COMPTYPE_ATTR = 'data-maq-comptype';
const PREF_LAYOUT_ATTR_P6 = 'data-maqetta-flow-layout';
export class EditorContext extends ContextFocus {
    _reRequire: RegExp = /\brequire\s*\(\s*\[\s*([\s\S]*?)\s*\]\s*\)/;
    _reModuleId: RegExp = /[\w.\/]+/g;
    _requireHtmlElem: any;
    _forceSelectionChange: any;
    _extraSheets: any;
    _containerControls: any;
    _widgets: any = {};
    widgetHash: any = {};
    _commandStack: CommandStack;
    _chooseParent: ChooseParent;
    _cssCache: {};
    _focuses: any;
    _selection: any = [];
    _blockChange: any;
    _activeTool: Tool;
    _defaultTool: any;
    _activeDragDiv: any;
    _objectIds: any = [];
    _widgetIds: any = [];
    _allWidgets: {};
    _designEvents: any[];
    global: Window;
    _header: any;
    id: string;
    _connects: any;
    rootWidget: any;
    _uniqueIDs: {};
    rootNode: any;
    public editor: VisualEditor;
    public _srcDocument: HTMLFile;
    public _loadFileStatesCache: any = {};
    _designMode: boolean = true;
    getFlowLayout() {
        const bodyElement = this.getDocumentElement().getChildElement('body');
        let flowLayout = bodyElement && bodyElement.getAttribute(PREF_LAYOUT_ATTR);
        const flowLayoutP6 = bodyElement && bodyElement.getAttribute(PREF_LAYOUT_ATTR_P6);
        if (!flowLayout && flowLayoutP6) {
            flowLayout = flowLayoutP6;
            //this.editor._visualChanged();
        }
        if (!flowLayout) { // if flowLayout has not been set in the context check the edit prefs
            flowLayout = true;
            this.setFlowLayout(flowLayout);
        } else {
            flowLayout = (flowLayout === 'true') || (flowLayout === true);
        }
        return flowLayout;
    }
    setFlowLayout(flowLayout) {
        const bodyElement = this.getDocumentElement().getChildElement('body');
        if (bodyElement) {
            bodyElement.addAttribute(PREF_LAYOUT_ATTR, '' + flowLayout);
        }
        return flowLayout;
    }
    dragMoveCleanup() {
        Snap.clearSnapLines(this);
        this._chooseParent.cleanup();
    }
    dragMoveUpdate(params) {
        const context = this;
        const cp = this._chooseParent;
        const widgets = params.widgets;
        const data = params.data;

        const //			eventTarget = params.eventTarget,
            position = params.position;

        const absolute = params.absolute;
        const currentParent = params.currentParent;
        const rect = params.rect;
        let doSnapLinesX = params.doSnapLinesX;
        let doSnapLinesY = params.doSnapLinesY;
        const doFindParentsXY = params.doFindParentsXY;
        const doCursor = params.doCursor;
        const beforeAfter = params.beforeAfter;
        const widgetType = lodash.isArray(data) ? data[0].type : data.type;
        let doSnapLines = true;

        doSnapLinesX = true;
        doSnapLinesY = true;
        const offset = context.getScrollOffset();
        position.x -= offset.x;
        position.y -= offset.y;
        // inner function that gets called recurively for each widget in document
        // The "this" object for this function is the Context object
        const _updateThisWidget = (widget) => {

            if (!widget) {
                console.error('-error:_updateThisWidget:invalid widget', data);
                return;
            }

            if (widgets && widgets.indexOf(widget) >= 0) {
                // Drag operations shouldn't apply to any of the widget being dragged
                return;
            }

            const innerStyle = this.getGlobal()['require']('dojo/dom-style');

            const computedStyle = innerStyle.get(widget.domNode);

            if (doSnapLinesX || doSnapLinesY) {
                Snap.findSnapOpportunities(this, widget, computedStyle, doSnapLinesX, doSnapLinesY);
            }
            cp.findParentsXY({
                data: data,
                widget: widget,
                absolute: absolute,
                position: position,
                doCursor: doCursor,
                beforeAfter: beforeAfter
            });
            widget.getChildren().forEach((w) => {
                _updateThisWidget.apply(context, [w]);
            });
        };

        if (doSnapLinesX || doSnapLinesY) {
            doSnapLines = Snap.updateSnapLinesBeforeTraversal(this, rect);
        }
        const differentXY = cp.findParentsXYBeforeTraversal(params);
        // Traverse all widgets, which will result in updates to snap lines and to
        // the visual popup showing possible parent widgets
        _updateThisWidget.apply(context, [this.rootWidget]);
        if (doSnapLinesX || doSnapLinesY) {
            Snap.updateSnapLinesAfterTraversal(this);
        }
        cp.findParentsXYAfterTraversal(params);
        if (differentXY) {
            if (currentParent) {
                //console.log('current parent : ' + position.x + ' :  ' + position.y ,currentParent);
            }
            cp.dragUpdateCandidateParents({
                widgetType: widgetType,
                showCandidateParents: doFindParentsXY,
                doCursor: doCursor,
                beforeAfter: beforeAfter,
                absolute: absolute,
                currentParent: currentParent
            });
            cp.findParentsXYCleanup(params);
        }
    }

    byId(id: string) {
        return lodash.find(this._allWidgets, { id: id });
    }
    getAllWidgets() {
        const result = [];
        const find = widget => {
            result.push(widget);
            widget.getChildren().forEach(child => {
                find(child);
            });
        };
        if (this.rootWidget) {
            find(this.rootWidget);
        }
        return result;
    }
    getWidgetById(id: string) {
        let ret = null;
        lodash.each(this.widgetHash, (w) => {
            if (w.domNode.id === id) {
                ret = w;
            }
        })
        return ret;
    }
    _updateWidgetHash() {
        this.widgetHash = {};
        this.getAllWidgets().forEach((widget) => {
            const id = widget.id;
            if (id) {
                this.widgetHash[id] = widget;
            }
        }, this);
    }
    public constructor(editor: VisualEditor) {
        super();
        this.editor = editor;
        this.id = '_edit_context_' + contextCount++;
        this._defaultTool = new SelectTool();
        this._chooseParent = new ChooseParent(this);
        this._commandStack = new CommandStack(this);
    }
    onMouseOver(event) {
        if (this._activeTool && this._activeTool.onMouseOver) {
            this._activeTool.onMouseOver(event);
        }
        $('body').trigger('mouseover', event);
    }
    onMouseOut(event) {
        if (this._activeTool && this._activeTool.onMouseOut) {
            this._activeTool.onMouseOut(event);
        }
        $('body').trigger('mouseout', event);
    }
    getCommandStack() {
        return this._commandStack;
    }

    detach(widget: HTMLWidget) {
        // FIXME: detaching context prevent destroyWidget from working
        const id = widget.getId() || widget.id;
        if (id) {
            remove(this._widgetIds, id);
            delete this._allWidgets[id];
        }
        const objectId = widget.getObjectId();
        if (objectId) {
            remove(this._objectIds, objectId);
        }

        if (this._selection) {
            for (let i = 0; i < this._selection.length; i++) {
                if (this._selection[i] == widget) {
                    this.focus(null, i);
                    this._selection.splice(i, 1);
                }
            }
        }
        const library = Metadata.getLibraryForType(widget.type);
        if (library) {
            const libId = library.name;
            const data = [widget.type, this];

            // Always invoke the 'onRemove' callback.
            Metadata.invokeCallback(library, 'onRemove', data);
            // If this is the last widget removed from page from a given library,
            // then invoke the 'onLastRemove' callback.
            this._widgets[libId] -= 1;
            if (this._widgets[libId] === 0) {
                Metadata.invokeCallback(library, 'onLastRemove', data);
            }
        }
        widget.getChildren().forEach((w) => this.detach, this);
        Registry.remove(id);
        delete this._containerControls;
    }

    widgetChanged(type, widget) {
        if (type == 1) {
            this.widgetHash[widget.id] = widget;
        } else if (type == 2) {
            delete this.widgetHash[widget.id];
        }
    }
    /**
     * Called by any commands that can causes widgets to be added or deleted.
     */
    widgetAddedOrDeleted(resetEverything?: boolean) {
        /*
        const helper = Theme.getHelper(this.getTheme());
        if (helper && helper.widgetAddedOrDeleted) {
            helper.widgetAddedOrDeleted(this, resetEverything);
        } else if (helper && helper.then) { // it might not be loaded yet so check for a deferred
            helper.then(result => {
                if (result.helper) {
                    this.theme.helper = result.helper;
                    if (result.helper.widgetAddedOrDeleted) {
                        result.helper.widgetAddedOrDeleted(this, resetEverything);
                    }
                }
            });
        }*/
    }

    deselect(widget?: any) {

        if (!this._selection) {
            return;
        }

        this.emit(EVENTS.WIDGET_SELECTED, {
            widget: []
        })

        let helper = null;
        if (widget) {
            helper = widget.getHelper();
        }
        if (widget && this._selection.length) { // undo of add got us here some how.
            if (this._selection.length === 1) {
                if (this._selection[0] != widget) {
                    return;
                }
                this.focus(null, 0);
                this._selection = undefined;
            } else {
                const index = this._selection.indexOf(widget);
                if (index < 0) {
                    return;
                }
                this.focus(null, index);
                this._selection.splice(index, 1);
            }
            if (helper && helper.onDeselect) {
                helper.onDeselect(widget);
            }
        } else { // deselect all
            if (this._selection) {
                this._selection.forEach(w => {
                    const h = w.getHelper();
                    if (h && h.onDeselect) {
                        h.onDeselect(w);
                    }
                }, this);
            }
            this.focus(null);
            this._selection = undefined;
        }

        // this.onSelectionChange(this.getSelection());
    }
    getSelection() {
        return this._selection || [];
    }

    getParentIframe() {
        return this.editor.frame._frame;
    }

    getTopWidgets() {
        const topWidgets = [];
        for (let node = this.rootNode.firstChild; node; node = node.nextSibling) {
            if (node.nodeType == 1 && node._dvWidget) {
                topWidgets.push(node._dvWidget);
            }
        }
        return topWidgets;
    }
    isFocusNode(node: HTMLElement) {
        if (this._selection && this._selection.length && this._focuses && this._focuses.length >= this._selection.length) {
            for (let i = 0; i < this._selection.length; i++) {
                if (this._focuses[i].isFocusNode(node)) {
                    return true;
                }
            }
        }
        return false;
    }
    blockChange(shouldBlock: boolean) {
        this._blockChange = shouldBlock;
    }
    getScrollOffset() {
        if (this.rootNode) {
            return {
                x: this.rootNode.parentNode.scrollLeft,
                y: this.rootNode.parentNode.scrollTop
            }
        } else {
            return {
                x: 0,
                y: 0
            }
        }
    }
    // Returns true if inline edit is showing
    inlineEditActive() {
        return this.getSelection().some((item, i) => {
            return this._focuses[i].inlineEditActive();
        });
    }
    test(e) {
        console.log('test out', e);
    }
    select(widget, add?: boolean, inline?: boolean, quite?: boolean) {
        if (!widget /*|| widget == this.rootWidget*/) {
            if (!add) {
                this.deselect(); // deselect all
            }
            return;
        }
        let index;
        let alreadySelected = false;
        if (this._selection) {
            alreadySelected = this._selection.some((w, idx) => {
                if (w === widget) {
                    index = idx;
                    return true;
                }
                return false;
            });
        }

        if (!alreadySelected) {
            let selection;
            if (add && this._selection) {
                index = this._selection.length;
                selection = this._selection;
                selection.push(widget);
            } else {
                selection = [widget];
            }

            const parent = widget.getParent();
            if (parent && parent.getParent) {
                const parentHelper = parent.getHelper();
                if (parentHelper && parentHelper.selectChild) {
                    parentHelper.selectChild(parent, widget);
                } else {
                    parent.selectChild(widget);
                }
            }

            if (!this._selection || this._selection.length > 1 || selection.length > 1 || this.getSelection() != widget) {
                const oldSelection = this._selection;
                this._selection = selection;
                quite !== true && this.onSelectionChange(selection);
                if (oldSelection) {
                    oldSelection.forEach(w => {
                        const h = w.getHelper();
                        if (h && h.onDeselect) {
                            h.onDeselect(w);
                        }
                    }, this);
                }
                const helper = widget.getHelper();
                if (helper && helper.onSelect) {
                    helper.onSelect(widget);
                }
            }
        }
        quite !== true && this.updateFocus(widget, index, inline);
    }
    updateFocus(widget, index, inline) {
        WidgetUtils.requireWidgetHelper(widget.type).then(helper => {
            let box;
            let op;
            let parent;

            if (!Metadata.queryDescriptor(widget.type, 'isInvisible')) {
                //Get the margin box (deferring to helper when available)
                let helper = widget.getHelper();
                if (helper && helper.getMarginBoxPageCoords) {
                    box = helper.getMarginBoxPageCoords(widget);
                } else {
                    let node = widget.getStyleNode();
                    if (helper && helper.getSelectNode) {
                        node = helper.getSelectNode(this) || node;
                    }
                    box = GeomUtils.getMarginBoxPageCoords(node);
                }

                parent = widget.getParent();
                op = { move: !(parent && parent.isLayout && parent.isLayout()) };

                //FIXME: need to consult metadata to see if layoutcontainer children are resizable, and if so on which axis
                const resizable = (parent && parent.isLayout && parent.isLayout()) ?
                    'none' : Metadata.queryDescriptor(widget.type, 'resizable');
                switch (resizable) {
                    case 'width':
                        op.resizeWidth = true;
                        break;
                    case 'height':
                        op.resizeHeight = true;
                        break;
                    case 'both':
                        op.resizeWidth = true;
                        op.resizeHeight = true;
                }
            }
            this.focus({
                box: box,
                op: op,
                hasLayout: (widget.isLayout && widget.isLayout()),
                isChild: parent && parent.isLayout && parent.isLayout()
            }, index, inline);

            // Currently only used by theme editor
            this._focuses[0].showContext(this, widget);

        });
    }
    onSelectionChange(selection) {
        this._cssCache = {};
        this.emit(EVENTS.WIDGET_SELECTED, {
            widget: selection,
            context: this
        });
    }
    destroy() {
        this.destroyHandles();
        this.hideFocusAll(0);
    }

    _disableDesignMode() {
        this._designEvents.forEach((h) => h.destroy());
        const containerNode = this.getContainerNode();
        /*
        this._designEvents = [
            connect.connect(containerNode, "onclick", this, "onMouseClick")
        ];*/
    }

    _enableDesignMode() {
        const containerNode = this.getContainerNode();
        // this._designEvents.forEach(connect.disconnect);
        const doc = $(this.getDocument());
        const d = new Events.Evented();

        this._designEvents = [
            this.on('click', this.onMouseClick, doc),
            this.on('mousedown', this.onMouseDown, doc),
            this.on('mouseup', this.onMouseUp, doc),
            this.on('mousemove', this.onMouseMove, doc),
            this.on('keyup', this.onKeyUp, doc),
            this.on('keydown', this.onKeyDown, doc),
            this.on('mousemove', this.onMouseMove, doc),
            this.on('mouseover', this.onMouseOver, doc),
            this.on('mouseout', this.onMouseOut, doc)
            //this.on('onkeydown',"onKeyDown"),
            // connect.connect(this.getDocument(), "onkeyup", this, "onKeyUp"),
            // connect.connect(containerNode, "ondblclick", this, "onDblClick"),
            //connect.connect(containerNode, "onmousedown", this, "onMouseDown"),

            /*,
            connect.connect(containerNode, "onmousemove", this, "onMouseMove"),
            connect.connect(containerNode, "contextmenu", this, "contextmenu"),
            connect.connect(containerNode, "onmouseup", this, "onMouseUp"),
            connect.connect(containerNode, "onmouseover", this, "onMouseOver"),
            connect.connect(containerNode, "onmouseout", this, "onMouseOut")
            */
        ];

    }

    getActiveDragDiv() {
        return this._activeDragDiv;
    }
    setActiveDragDiv(activeDragDiv) {
        this._activeDragDiv = activeDragDiv;
    }

    loadStyleSheet(url: string): any {
        console.log('load stylesheet ' + url);
        //@TODO : stylesheets in _ContextDocument wrong
        url = url.replace('././', './');

        const doc = this.getDocument();
        // const query = this.getGlobal()["require"]("dojo/query");
        //const links = query('link');
        // const editorItem = this.getVisualEditor().item;

        //if (links.some(val => val.getAttribute('href') === url)) {
        // don't add if stylesheet is already loaded in the page
        //   return;
        //}
        const thiz = this;
        if (!this._extraSheets) {
            this._extraSheets = {};
        }

        win.withDoc(doc, () => {
            // Make sure app.css is the after library CSS files, and content.css is after app.css
            // FIXME: Shouldn't hardcode this sort of thing
            const headElem = doc.getElementsByTagName('head')[0];

            const isAppCss = url.indexOf('app.css') > -1;
            const isContentCss = url.indexOf('content.css') > -1;
            // const isCustom = isAppCss == false && isContentCss == false;
            let appCssLink;
            let contentCssLink;

            let customItem = null;
            const isCustom = false;

            /*
            if (isCustom) {
                //resolve url via xfile
                const ctx = Workbench.ctx;
                const defaultWorkSpace = editorItem.mount || 'workspace_user';

                const item = {
                    path: url,
                    mount: defaultWorkSpace
                };
                const newUrl = ctx.getFileManager().getImageUrl(item);
                customItem = {
                    resolvedUrl: newUrl,
                    mount: defaultWorkSpace,
                    path: '' + url
                };
                thiz._extraSheets[url] = customItem;
                url = newUrl;

            }
            */

            const newLink = create('link', {
                rel: 'stylesheet',
                type: 'text/css',
                href: url,
                id: customItem ? customItem.path : ''
            });

            if (customItem) {
                customItem.link = newLink;
            }

            /*
            links.forEach(link => {
                if (link.href.indexOf('app.css') > -1) {
                    appCssLink = link;
                } else if (link.href.indexOf('content.css') > -1) {
                    //contentCssLink = link;
                }
            });
            */

            let beforeChild;
            if (!isContentCss) {
                // tslint:disable-next-line:prefer-conditional-expression
                if (isAppCss && contentCssLink) {
                    beforeChild = contentCssLink;
                } else {
                    beforeChild = appCssLink;
                }
            }

            if (!isCustom) {
                if (beforeChild) {
                    headElem.insertBefore(newLink, beforeChild);
                } else {
                    headElem.appendChild(newLink);
                }
            } else {
                headElem.appendChild(newLink);
            }
        });

    }
    addJavaScriptText2(text, doUpdateModel, skipDomUpdate) {
        /* run the requires if there is an iframe */
        // debug && console.log('add js text' + text);
        if (!skipDomUpdate) {
            try {
                this.getGlobal()['eval'](text);
            } catch (e) {
                const len = text.length;
                console.error('eval of "' + text.substr(0, 20) + (len > 20 ? '...' : '') +
                    '" failed');
            }
        }
        if (doUpdateModel) {
            this.addHeaderScriptText(text);
        }
    }
    /**
         * Add inline JavaScript to <head>.
         *
         * This function looks for the last inline JS element in <head> which comes
         * after the last <script src='...'> element.  If a script URL exists after
         * the last inline JS element, or if no inline JS element exists, then we
         * create one.
         *
         * @param {string} text inline JS to add
         * @return {HTMLElement} the element which contains added script
         */
    addHeaderScriptText(text) {
        const head = this.getDocumentElement().getChildElement('head');
        let scriptText;
        const children = head.children;
        let i;
        let node;

        console.log('add js header text' + text);

        // reverse search; cannot use getChildElements, et al
        for (i = children.length - 1; i >= 0; i--) {
            node = children[i];
            if (node.elementType === 'HTMLElement' && node.tag === 'script') {
                // Script element will either have inline script or a URL.
                // If the latter, this breaks with 'inlineScript' equal to 'null'
                // and a new inline script is created later.  This is done so
                // that new inline script comes after the latest added JS file.
                scriptText = node.find({
                    elementType: 'HTMLText'
                }, true);
                break;
            }
        }

        if (!scriptText) {
            // create a new script element
            const script = new HTMLElement('script');
            script.addAttribute('type', 'text/javascript');
            script.script = '';
            head.addChild(script);

            scriptText = new HTMLText();
            script.addChild(scriptText);
        }

        const oldText = scriptText.getText();
        if (oldText.indexOf(text) === -1) {
            scriptText.setText(oldText + '\n' + text);
            // XXX For some reason, <script> text is handled differently in the
            //   Model than that of other elements.  I think I only need to call
            //   setScript(), but the correct process should be to just update
            //   HTMLText. See issue #1350.
            scriptText.parent.setScript(oldText + '\n' + text);
        }
        return scriptText.parent;
    }
    addJavaScriptModule(mid, doUpdateModel, skipDomUpdate) {
        debug && console.log('add js module' + mid);

        return new Promise((resolve, reject) => {
            if (!skipDomUpdate) {
                this.getGlobal()['require']([mid], module => {
                    resolve(module);
                });
            } else {
                resolve();
            }

            if ((mid.indexOf('deliteful') !== -1 || mid === 'xblox/RunScript' || mid === 'xblox/StyleState' || mid === 'xblox/CSSState') && doUpdateModel) {
                //   promise.resolve();
                //   return promise;
            }

            if (doUpdateModel) {
                if (!this._requireHtmlElem) {
                    // find a script element which has a 'require' call
                    const head = this.getDocumentElement().getChildElement('head');

                    let found;

                    found = head.getChildElements('script').some((child) => {
                        const script = child.find({
                            elementType: 'HTMLText'
                        }, true);
                        if (script) {
                            if (this._reRequire.test(script.getText())) {
                                // found suitable `require` block
                                this._requireHtmlElem = child;
                                return true; // break 'some' loop
                            }
                        }
                    }, this);

                    if (!found) {
                        // no such element exists yet; create now
                        this._requireHtmlElem = this.addHeaderScriptText('require(["' + mid + '"]);\n');
                        return;
                    }
                }

                // insert new `mid` into array of existing `require`
                const scriptText = this._requireHtmlElem.find({
                    elementType: 'HTMLText'
                }, true);

                let text = scriptText.getText();
                const m = text.match(this._reRequire);
                const arr = m[1].match(this._reModuleId);
                // check for duplicate
                if (arr.indexOf(mid) === -1) {
                    if (mid !== 'xblox/RunScript') {
                        arr.push(mid);
                        text = text.replace(this._reRequire, 'require(' + JSON.stringify(arr, null, '  ') + ')');
                        scriptText.setText(text);
                        // XXX For some reason, <script> text is handled differently in the
                        //   Model than that of other elements.  I think I only need to call
                        //   setScript(), but the correct process should be to just update
                        //   HTMLText. See issue #1350.
                        scriptText.parent.setScript(text);
                    }
                }
            }
        });
    }
    addModeledStyleSheet(arg0: any, arg1: any): any {
        throw new Error('Method not implemented.');
    }
    addJavaScriptText(arg0: any, arg1: any, arg2: any): any {
        throw new Error('Method not implemented.');
    }
    getBase(): any {
        return '';
    }
    getLibraryBase(id, version) {
        return Library.getLibRoot(id, version, this.getBase());
    }
    addJavaScriptSrc(arg0: any, arg1: any, arg2: any, arg3: any): any {
        throw new Error('Method not implemented.');
    }

    public async attach(widget) {
        debugAttach && console.log('attach widget', widget);
        if (!widget || widget._edit_focus) {
            return;
        }

        if (!widget._srcElement) {
            widget._srcElement = this._srcDocument.findElement(widget.id);
        }

        const data = parseNodeData(widget.domNode);
        if (!widget.type) {
            DeliteWidget.fixType(widget);
        }
        // The following two assignments needed for OpenAjax widget support
        if (!widget.type) {
            if (widget.metadata && widget.metadata.name && widget.metadata.name.indexOf('delite')) {
                //fast cases
                widget.type = utils.replaceAll('.', '/', widget.metadata.name);
            } else if (widget.declaredClass == 'davinci.ve.DeliteWidget' && widget.domNode && widget.domNode.baseClass && widget.domNode.baseClass.indexOf('d-') != -1) {
                widget.type = 'delite' + '/' + utils.capitalize(widget.domNode.baseClass.replace('d-', ''));
                switch (widget.type) {
                    case 'delite/Radio-button':
                        {
                            widget.type = 'delite/RadioButton';
                            break;
                        }
                    case 'delite/View-stack':
                        {
                            widget.type = 'delite/ViewStack';
                            break;
                        }
                    case 'delite/Tab-bar':
                        {
                            widget.type = 'delite/TabBar';
                            break;
                        }
                }

                //camel case cases, wtf
                if (data && data.properties) {
                    let _is = data.properties['is'];
                    switch (_is) {
                        case 'd-toggle-button':
                            {
                                widget.type = 'delite/ToggleButton';
                                break;
                            }
                        case 'd-radio-button':
                            {
                                widget.type = 'delite/RadioButton';
                                break;
                            }
                    }
                }
                Registry.add(widget.domNode);

            } else if (widget.isHtmlWidget) {
                widget.type = 'html.' + widget.getTagName();

            } else if (widget.isGenericWidget && widget.domNode && widget.domNode.render != null && data && data.properties && (data.properties['is'])) {
                const _is = data.properties['is'];
                switch (_is) {
                    case 'd-toggle-button':
                        {
                            widget.type = 'delite/ToggleButton';
                            break;
                        }
                    case 'd-button':
                        {
                            widget.type = 'delite/Button';
                            break;
                        }
                    case 'd-radio-button':
                        {
                            widget.type = 'delite/RadioButton';
                            break;
                        }
                }
            } else if (widget.domNode && widget.domNode.getAttribute('is')) {
                const _is = widget.domNode.getAttribute('is');
                switch (_is) {
                    case 'd-toggle-button':
                        {
                            widget.type = 'delite/ToggleButton';
                            break;
                        }
                }
                if (!widget.type) {
                    widget.type = _is;
                }
            } else if (widget.isGenericWidget) {
                widget.type = widget.domNode.getAttribute('dvwidget');
            } else if (widget.isObjectWidget) {
                widget.type = widget.getObjectType();
            } else {
                widget.type = widget.declaredClass.replace(/\./g, '/'); //FIXME: not a safe association
            }
        }
        if (!widget.type) {
            console.error('have no widget type : ', widget);
        }
        // Metadata.getMetadata(widget.type);
        widget.metadata = widget.metadata || await Metadata.query(widget.type);
        widget._edit_context = this;
        if (!widget.type) {
            console.error('have no widget type!!!!', widget);
        }
        widget.attach();
        if (((widget.domNode && widget.domNode.declaredClass && widget.domNode.declaredClass === 'xblox/RunScript') ||
            (widget.type && widget.type === 'xblox/RunScript') ||
            (widget.type && widget.type.indexOf('delite') !== -1) && this._register)) {

        }

        //TODO: dijit-specific convention of "private" widgets
        if (widget.type.charAt(widget.type.lastIndexOf('.') + 1) == '_') {
            widget.internal = true;
            // internal Dijit widget, such as _StackButton, _Splitter, _MasterTooltip
            return;
        }

        const addOnce = (array, item) => {
            if (array.indexOf(item) === -1) {
                array.push(item);
            }
        };
        const id = widget.getId() || widget.id;
        if (id) {
            addOnce(this._widgetIds, id);
            this._allWidgets[id] = widget;
        }
        const objectId = widget.getObjectId(widget);
        if (objectId) {
            addOnce(this._objectIds, objectId);
        }

        debugAttach && console.log('attach widget ' + widget.type, widget);
        try {
            //@ximpl.
            // this.updateBackground(widget.domNode);
        } catch (e) {
            console.error('ero', e);
        }
        WidgetUtils.requireWidgetHelper((widget.type || '').replace(/\./g, '/')).then((helper: any) => {
            if (helper && helper.preProcess) {
                //@ximpl.
                // helper.preProcess(node, this);
                debugger;
            }
        });

        // Recurse down widget hierarchy
        //dojo.forEach(widget.getChildren(true), this.attach, this);
        const _children = widget.getChildren(true);
        //this.observe(widget.domNode);
        if (widget.domNode && widget.domNode.refreshRendering) {
            //widget.domNode.refreshRendering();
        }
        debugAttach && console.log('attach children : ', _children);
        _children.forEach((c) => {
            this.attach(c)
        });

        const self = this;
        if (widget.domNode) {
            // widget.domNode.isDesign = () => self.getVisualEditor()._designMode
        }
        if (widget.domNode && widget.domNode.createdCallback) {
            //@ximpl.
            //widget.domNode.createdCallback();
        }

    }
    _attachChildren(containerNode: HTMLElement): any {
        // throw new Error('Method not implemented.');
        // debugger;
        [...containerNode.children].map(WidgetUtils.getWidget).forEach((c) => {
            this.attach(c);
        });
    }

    setActiveTool(tool?: any): any {
        try {
            if (this._activeTool) {
                this._activeTool.deactivate();
            }
            this._activeTool = tool;
            if (!this._activeTool) {
                this._activeTool = this._defaultTool;
            }
            this._activeTool.activate(this);
            this.emit('/davinci/ve/activeToolChanged', [this, tool]);
        } catch (e) {
            console.error(e, 'setActiveTool');
        }
    }
    _attachAll(): any {
        this._allWidgets = {};
        const rootWidget = this.rootWidget = new HTMLWidget({}, this.rootNode);
        rootWidget._edit_context = this;
        rootWidget.isRoot = true;
        this._allWidgets[rootWidget.id] = this.rootWidget;
        this._widgetIds = [];
        const _doc = this._srcDocument;
        const _docEl = _doc.getDocumentElement();
        const body = _docEl.getChildElement('body');

        rootWidget._srcElement = this._srcDocument.getDocumentElement().getChildElement('body');
        let style = null;
        if (rootWidget._srcElement) {
            rootWidget._srcElement.setAttribute('id', 'myapp');
            style = rootWidget._srcElement.getAttribute('style');
            if (style) {
                this.rootNode.setAttribute('style', style);
            }
        }
        this._attachChildren(this.rootNode);
        //this.updateBackground(this.rootNode);
        //this.widgetsReadyDfd.resolve();
        debugWidgets && console.log('context::_attachAll!', this._allWidgets);

    }
    catchEvents: any;
    _register: any;
    _require: any;
    _loadFileDojoTypesCache: {};
    deselectInvisible() {
        function isHidden(node) {
            if ((node.nodeType == 1) && (style.get(node, 'display') == 'none')) {
                return true;
            }
            if (node.parentNode) {
                return isHidden(node.parentNode);
            }
            return false;
        }

        if (this._selection) {
            for (let i = this._selection.length - 1; i >= 0; i--) {
                let widget = this._selection[i];
                let domNode = widget.domNode;
                // Check for display:none somewhere in ancestor DOM hierarchy
                if (isHidden(domNode) && widget.type !== 'xblox/RunScript') {
                    this.deselect(widget);
                } else {

                    while (domNode && domNode.tagName.toUpperCase() != 'BODY') {
                        // Sometimes browsers haven't set up defaultView yet,
                        // and domStyle.get will raise exception if defaultView isn't there yet
                        if (domNode && domNode.ownerDocument && domNode.ownerDocument.defaultView) {
                            let computedStyleDisplay = style.get(domNode, 'display');
                            if (computedStyleDisplay == 'none' && widget.type !== 'xblox/RunScript') {
                                this.deselect(widget);
                                break;
                            }
                        }
                        domNode = domNode.parentNode;
                    }
                }
            }
        }
    }
    onContentChange() {
        this._updateWidgetHash();

        this.deselectInvisible();

        // update focus
        this.getSelection().forEach((w, i) => {
            if (i === 0) {
                this.select(w);
            } else {
                this.select(w, true); // add
            }
        });

        console.log('on content change');

        //FIXME: ALP->WBR: do we still need this? move to ThemeEditor's context?

        if (this._forceSelectionChange) {
            this.onSelectionChange(this.getSelection());
            delete this._forceSelectionChange;
        }

        setTimeout(function () {
            // Invoke autoSave, with "this" set to Workbench
            //Workbench._autoSave.call(Workbench);
        }, 0);
    }
    activate2() {
        debugAttach && console.log('activate context');
        /*
        if (this.isActive()) {
            return;
        }*/
        this.loadStyleSheet(RESOURCE_VARIABLES.APP_URL + '/content.css');
        this._attachAll();
        //this._restoreStates();
        this.rootNode.childNodes.forEach((n) => {
            // Strip off interactivity features from DOM on canvas
            // Still present in model
            //console.log('removing event attributes : ',n);
            removeEventAttributes(n);	// Make doubly sure there are no event attributes (was also done on original source)
            removeHrefAttribute(n);		// Remove href attributes on A elements
        });
        //this._AppStatesActivateActions();
        // The initialization of states object for BODY happens as part of user document onload process,
        // which sometimes happens after context loaded event. So, not good enough for StatesView
        // to listen to context/loaded event - has to also listen for context/statesLoaded.
        //this._statesLoaded = true;
        //       connect.publish('/davinci/ui/context/statesLoaded', [this]);

        // this._onLoadHelpers();
        let containerNode = this.getContainerNode();
        $(containerNode).addClass('editContextContainer');
        let doc = this.getDocument();
        this.catchEvents = true;
        if (this.catchEvents) {
            /*
            this._connects = [
                connect.connect(this._commandStack, 'onExecute', this, 'onCommandStackExecute'),
                // each time the command stack executes, onContentChange sets the focus, which has side-effects
                // defer this until the stack unwinds in case a caller we don't control iterates on multiple commands

                connect.connect(this._commandStack, 'onExecute', function () {
                    setTimeout(this.onContentChange.bind(this), 0);
                }.bind(this))

            ];
            */

            this._commandStack.on('excecute', this.onContentChange, null, this);

            this._designEvents = [
                /*
                connect.connect(this.getDocument(), 'onkeydown', this, 'onKeyDown'),
                connect.connect(this.getDocument(), 'onkeyup', this, 'onKeyUp'),
                connect.connect(containerNode, 'ondblclick', this, 'onDblClick'),
                connect.connect(containerNode, 'onmousedown', this, 'onMouseDown'),
                connect.connect(containerNode, 'onclick', this, 'onMouseClick'),
                connect.connect(containerNode, 'onmousemove', this, 'onMouseMove'),
                connect.connect(containerNode, 'onmouseup', this, 'onMouseUp'),
                connect.connect(containerNode, 'onmouseover', this, 'onMouseOver'),
                connect.connect(containerNode, 'onmouseout', this, 'onMouseOut'),
                connect.connect(containerNode, 'contextmenu', this, 'contextmenu')
                */
            ];

        } else {
            this._connects = [
                /*
                connect.connect(this._commandStack, 'onExecute', this, 'onCommandStackExecute'),
                // each time the command stack executes, onContentChange sets the focus, which has side-effects
                // defer this until the stack unwinds in case a caller we don't control iterates on multiple commands
                connect.connect(this._commandStack, 'onExecute', function () {
                    setTimeout(this.onContentChange.bind(this), 0);
                }.bind(this)),
                connect.connect(this.getDocument(), 'onkeydown', this, 'onKeyDown'),
                connect.connect(this.getDocument(), 'onkeyup', this, 'onKeyUp')/*
                 connect.connect(containerNode, "ondblclick", this, "onDblClick"),
                 connect.connect(containerNode, "onmousedown", this, "onMouseDown"),
                 connect.connect(containerNode, "onmousemove", this, "onMouseMove"),
                 connect.connect(containerNode, "onmouseup", this, "onMouseUp"),
                 connect.connect(containerNode, "onmouseover", this, "onMouseOver"),
                 connect.connect(containerNode, "onmouseout", this, "onMouseOut")
                 */
            ];
        }
        //if (this.visualEditor && this.visualEditor._pageEditor && this.visualEditor._pageEditor._visualChanged) {
        //    this.visualEditor._pageEditor._visualChanged(true);
        //}
        try {
            this.setActiveTool();
        } catch (e) {
            debugger;
            console.error('set active tool failed! ' + e.message);
        }
        this._enableDesignMode();
        return true;
    }
    _preProcess(node: any) {
        //need a helper to pre process widget
        // also, prime the helper cache
        let type = node.getAttribute('data-dojo-type') || node.getAttribute('dojoType');
        //FIXME: This logic assume that if it doesn't have a dojo type attribute, then it's an HTML widget
        //Need to generalize to have a check for all possible widget type designators
        //(dojo and otherwise)
        if (!type) {
            type = 'html.' + node.tagName.toLowerCase();
        }
        // console.log('_preProcess widet ' + type, node);
        /*
        return Widget.requireWidgetHelper((type || '').replace(/\./g, '/')).then(helper => {
            if (helper && helper.preProcess) {
                helper.preProcess(node, this);
            }
        });
        */
    }
    _processWidgets(containerNode, attachWidgets, states, scripts, content) {
        // console.log('processwidgets: ', arguments);
        return new Promise((resolve, reject) => {
            const prereqs = [];
            const thiz = this;
            this._loadFileDojoTypesCache = {};
            debugWidgets && console.log('process widgets, scripts : ' + scripts);
            //@TODO: fixme : warm up registry, otherwise faulty id generation
            Registry.getUniqueId('delite/Button');
            Registry.getUniqueId('delite/ViewStack');
            Registry.getUniqueId('delite/Panel');
            Registry.getUniqueId('delite/TabBar');
            Registry.getUniqueId('delite/ToggleButton');
            Registry.getUniqueId('delite/RadioButton');
            Registry.getUniqueId('delite/Accordion');
            Registry.getUniqueId('delite/Switch');
            Registry.getUniqueId('delite/Slider');

            let children = containerNode.childNodes;
            children = [];
            children.forEach((n) => {
                if (n.nodeType !== 3) {
                    let type = n.getAttribute('data-dojo-type') || n.getAttribute('dojoType') || n.getAttribute('dvwidget');
                    //FIXME: This logic assume that if it doesn't have a dojo type attribute, then it's an HTML widget
                    //Need to generalize to have a check for all possible widget type designators
                    //(dojo and otherwise)
                    if (!type) {
                        type = 'html.' + n.tagName.toLowerCase();
                    }
                    //doUpdateModelDojoRequires=true forces the SCRIPT tag with dojo.require() elements
                    //to always check that scriptAdditions includes the dojo.require() for this widget.
                    //Cleans up after a bug we had (7714) where model wasn't getting updated, so
                    //we had old files that were missing some of their dojo.require() statements.

                    prereqs.push(this.loadRequires((type || '').replace(/\./g, '/'), false, true));
                    prereqs.push(this._preProcess(n));
                }
                //this._preserveStates(n, states);
                //this._preserveDojoTypes(n);
            }, this);

            try {
                const _require = this.getGlobal()['require'];
                this._require = _require;
                _require([
                    'delite/register',
                    'requirejs-dplugins/has',
                    'dojo/has'
                ], (register, has, dHas) => {

                    has.add('use-dcl', function () {
                        return true;
                    });

                    dHas.add('use-dcl', function () {
                        return true;
                    });

                    dHas.add('drivers', function () {
                        return true;
                    });
                    dHas.add('devices', function () {
                        return true;
                    });

                    console.log('bootstrap : ready');
                    _require([
                        'requirejs-domready/domReady'
                    ], () => {
                        debug && console.log('Checkpoint 1. dom ready');
                        this._register = register;
                        // return;
                        html.set(containerNode, content,
                            {
                                executeScripts: true,
                                end: function (setter) {
                                    // debugger;
                                    //debugWidgets && console.log('got scripts : ' + this._code);
                                    // save any scripts for later execution
                                    // tslint:disable-next-line:no-invalid-this
                                    const _scripts = ''; // this._code;
                                    /*
                                    if (_scripts) {
                                        try {
                                            debugWidgets && console.log('process scripts: ' + scripts);
                                            dojox.html.evalInGlobal(scripts, containerNode);
                                        } catch (e) {
                                            console.error('Error eval script in Context._setSourceData, ' + e);
                                        }
                                    }*/

                                    if (scripts) {
                                        const doc = thiz.getDocument();
                                        /*
                                        dojo.withDoc(doc, () => {
                                            _.each(scripts, url => {
                                                const parent = thiz.editor.item.getParent();
                                                url = thiz.ctx.getFileManager().getImageUrl({
                                                    path: parent.path + '/' + url,
                                                    mount: thiz.editor.item.mount
                                                }, false);
                                                const script = doc.createElement('script');
                                                script.type = 'text/javascript';
                                                script.src = url;
                                                //var head = this.getDocumentElement().getChildElement('head');
                                                const headElem = doc.getElementsByTagName('head')[0];
                                                headElem.appendChild(script);
                                            })
                                        });*/
                                    }

                                    // tslint:disable-next-line:no-invalid-this
                                    this.executeScripts = false;
                                    // this.inherited('onEnd', arguments);
                                    // debugger;
                                    // tslint:disable-next-line:no-invalid-this
                                    // this._onEnd();
                                    // tslint:disable-next-line:no-invalid-this
                                    setter._onEnd();
                                    try {
                                        // thiz._restoreDojoTypes();
                                        try {
                                            //register.parse();
                                        } catch (e) {
                                            console.error('error register::parse ', e);
                                        }
                                        resolve();
                                        setTimeout(() => {
                                            if (attachWidgets) {
                                                //thiz._attachAll();
                                            }
                                        }, 800);

                                    } catch (e) {
                                        console.error('error attaching widgets!', e);
                                    }
                                    // promise.resolve();
                                }
                            }
                        );
                        /*
                    _require(['dojox/html/_base'], html => {
                        html.set(containerNode, content, {}});
                    });
                    */
                    })
                })

            } catch (e) {
                console.error('error processing widgets', e);
            }

        });
    }
    getDocumentElement() {
        return this._srcDocument.getDocumentElement();
    }
    getContainerNode() {
        //FIXME: accessor func is unnecessary?
        if (!this.rootNode) {
            console.error(' have no rootNode ')
        }
        return this.rootNode;
    }
    getDocument() {
        const container = this.getContainerNode();
        return container && container.ownerDocument;
    }
    getGlobal(): Window {
        const doc = this.getDocument();
        return doc.defaultView;
    }
    setHeader(header) {
        let oldStyleSheets = [];
        let newStyleSheets;
        let oldBodyClasses;
        let newBodyClasses;

        if (this._header) {
            oldStyleSheets = this._header.styleSheets || [];
            oldBodyClasses = this._header.bodyClasses;
        }
        if (header) {
            newStyleSheets = header.styleSheets || [];
            newBodyClasses = header.bodyClasses;
            if (header.modules && header.modules.length) {
                const innerRequire = this.getGlobal()['require'];
                if (innerRequire) {
                    header.modules.map(module => [module.replace(/\./g, '/')]).forEach(innerRequire);
                } else {
                    console.error('document has no require');
                }
            }

            if (header.className) {
                const classes = header.className.split(' ');
                classes.forEach((clasz, index) => {
                    classes.splice(index, 1);
                    newBodyClasses = classes.join(' ');
                    return true;
                });
            }
        }

        if (oldBodyClasses != newBodyClasses) {
            const containerNode = this.getContainerNode();
            if (oldBodyClasses) {
                $(containerNode).removeClass(oldBodyClasses);
            }
            if (newBodyClasses) {
                $(containerNode).addClass(newBodyClasses);
            }
        }

        if (oldStyleSheets != newStyleSheets) {
            oldStyleSheets = [].concat(oldStyleSheets); // copy array for splice() below
            newStyleSheets.forEach((s, index) => {
                if (index < 0) {
                    //@ximpl.
                    // this.loadStyleSheet(s);
                } else {
                    oldStyleSheets.splice(index, 1);
                }
            }, this);
            // oldStyleSheets.forEach(this.unloadStyleSheet);
        }
        ////@ximpl.
        // this.setStyle(header ? header.style : undefined);
        this._header = header;
    }
    _setSourceData(data) {
        /*
        if (this.editor && this.editor.item) {
            let path = this.editor.item.path;
            path = './' + path.replace('.dhtml', '.css');
            path = './' + path.replace('.html', '.css');
            path = path.replace('././', './');
            data.styleSheets.push(path);
        }
        //import to tell everyone
        factory.publish(types.EVENTS.ON_SET_SOURCE_DATA, {
            data: data,
            context: this,
            editor: this.editor
        }, this);
        */
        //console.log('_setSourceData',data);
        // cache the theme metadata
        const _header = {
            title: data.title,
            scripts: data.scripts,
            modules: data.modules,
            styleSheets: data.styleSheets,
            //className: data.className,
            bodyClasses: data.bodyClasses,
            style: data.style
        };

        this.setHeader(_header);

        let content = data.content || '';

        /*
        const active = this.isActive();
        if (active) {
            this.select(null);
            this.getTopWidgets().forEach(this.detach, this);
        }

        const states = {}, containerNode = this.getContainerNode();

        if (data.maqAppStates) {
            states.body = data.maqAppStates;
        }
        */
        //FIXME: Temporary fix for #3030. Strip out any </br> elements
        //before stuffing the content into the document.
        const containerNode = this.getContainerNode();
        content = content.replace(/<\s*\/\s*br\s*>/gi, '');

        // Set content
        //  Content may contain inline scripts. We use dojox.html.set() to pull
        // out those scripts and execute them later, after _processWidgets()
        // has loaded any required resources (i.e. <head> scripts)
        let scripts;
        // It is necessary to run the dojox.html.set utility from the context
        // of inner frame.  Might be a Dojo bug in _toDom().
        //dojo upgrade to 1.10.3: add missing html funcs and make _Tool happy
        const _global = this.getGlobal();
        const _require = _global['require'];
        if (_require) {
            _global['require'](['dojo/dom-construct', 'dojo/dom-style', 'dojo/dom-attr', 'dojo/_base/html'], (_domConstruct, _domStyle, domAttr, _dojoHTML) => { });

        } else {
            console.error('document has no require');
        }
        // Remove "on*" event attributes from editor DOM.
        // They are already in the model. So, they will not be lost.
        /*
        removeEventAttributes(containerNode);
        query("*", containerNode).forEach(removeEventAttributes);
        */

        // Convert all text nodes that only contain white space to empty strings
        /*
        containerNode.setAttribute('data-maq-ws', 'collapse');
        const modelBodyElement = this._srcDocument.getDocumentElement().getChildElement("body");
        if (modelBodyElement) {
            modelBodyElement.addAttribute('data-maq-ws', 'collapse');
        }
        */

        // Set the mobile agaent if there is a device on the body
        // We need to ensure it is set before the require of deviceTheme is executed
        //var djConfig = this.getGlobal().dojo.config;  // TODO: use require
        const bodyElement = this.getDocumentElement().getChildElement('body');

        // Collapses all text nodes that only contain white space characters into empty string.
        // Skips certain nodes where whitespace does not impact layout and would cause unnecessary processing.
        // Similar to features that hopefully will appear in CSS3 via white-space-collapse.
        // Code is also injected into the page via workbench/davinci/davinci.js to do this at runtime.
        const skip = { SCRIPT: 1, STYLE: 1 };

        const collapse = element => {
            element.childNodes.forEach((cn) => {
                if (cn.nodeType == 3) {	// Text node
                    //FIXME: exclusion for SCRIPT, CSS content?
                    cn.nodeValue = cn.data.replace(/^[\f\n\r\t\v\ ]+$/g, '');
                } else if (cn.nodeType == 1 && !skip[cn.nodeName]) { // Element node
                    collapse(cn);
                }
            });
        };

        collapse(containerNode);
        // this._loadFileStatesCache = states;
        this.global = this.getGlobal();

        const active = true;

        return this._processWidgets(containerNode, active, this._loadFileStatesCache, data.scripts, content);

        //return dfd;
    }
    getUniqueID(node, idRoot?: any) {
        let id = node.getAttribute('id');
        if (!id) {
            const userDoc = this.rootWidget ? this.rootWidget.domNode.ownerDocument : null;
            const root = idRoot || node.tag;
            let num;

            while (1) {
                // tslint:disable-next-line:prefer-conditional-expression
                if (!this._uniqueIDs.hasOwnProperty(root)) {
                    num = this._uniqueIDs[root] = 0;
                } else {
                    num = ++this._uniqueIDs[root];
                }
                id = root + '_' + num;
                if (userDoc) {
                    // If this is called when user doc is available,
                    // make sure this ID is unique
                    if (!userDoc.getElementById(id)) {
                        break;
                    }
                } else {
                    break;
                }
            }
            const temp = !idRoot;
            node.addAttribute('id', id, temp);
        }
        return id;
    }
    _parse(source: any) {
        const data: any = {
            metas: [],
            scripts: [],
            modules: [],
            styleSheets: []
        };
        const htmlElement = source.getDocumentElement();
        const head = htmlElement.getChildElement('head');
        const bodyElement = htmlElement.getChildElement('body');

        this._uniqueIDs = {};

        if (bodyElement) {
            bodyElement.visit({
                visit: (element) => {
                    if (element.elementType == 'HTMLElement' && element != bodyElement) {
                        this.getUniqueID(element);
                    }
                }
            });
            const classAttr = bodyElement.getAttribute('class');
            if (classAttr) {
                data.bodyClasses = classAttr;
            }
            data.style = bodyElement.getAttribute('style');
            data.content = bodyElement.getElementText({
                includeNoPersist: true,
                excludeIgnoredContent: true
            });

            //FIXME: Need to generalize beyond just BODY
            /*
            let states = bodyElement.getAttribute(davinci.ve.states.APPSTATES_ATTRIBUTE);
            if (!states) {
                // Previous versions used different attribute name (ie, 'dvStates')
                states = bodyElement.getAttribute(davinci.ve.states.APPSTATES_ATTRIBUTE_P6);
                if (states) {
                    bodyElement.setAttribute(davinci.ve.states.APPSTATES_ATTRIBUTE, states);
                }
            }
            // Remove any lingering old dvStates attribute from model
            bodyElement.removeAttribute(davinci.ve.states.APPSTATES_ATTRIBUTE_P6);
            data.maqAppStates = states;
            */
        }

        const titleElement = head.getChildElement('title');
        if (titleElement) {
            data.title = titleElement.getElementText();
        }

        const scriptTags = head.getChildElements('script');
        scriptTags.forEach((scriptTag) => {
            const value = scriptTag.getAttribute('src');
            if (value) {
                data.scripts.push(value);
            }
            const text = scriptTag.getElementText();
            if (text.length) {
                // grab AMD-style dependencies
                text.replace(/require\(\[["']([^'"]+)["']\]\)/g, (match, module) => {
                    data.modules.push(module);
                });
            }
        }, this);

        const styleTags = head.getChildElements('style');

        styleTags.forEach((styleTag) => {
            styleTag.children.forEach((styleRule => {
                if (styleRule.elementType === 'CSSImport') {
                    data.styleSheets.push(styleRule.url);
                } else if (styleRule.elementType === 'CSSRule') {
                    if (!data.styles) {
                        data.styles = [];
                    }
                    data.styles.push(styleRule.getText());
                }
            }));
        })

        // tslint:disable-next-line:prefer-conditional-expression
        if (data.styles) {
            data.styles = data.styles.join('\n');
        } else {
            data.styles = '';
        }

        return data;
    }
    /**
    * Invoked when the page associated with this Context has finished its
    * initial loading.
    */
    onload() {
        // Don't actually get the composition type. Calling this routine
        // causes a maq-data-comptype attribute to be added to old documents
        // if it doesn't exist already.
        // this.getCompType();

        // add the user activity monitoring to the document and add the connects to be
        // disconnected latter
        //this._connects = (this._connects || []).concat(UserActivityMonitor.addInActivityMonitor(this.getDocument()));
        //#xmaqHack: user activity no longer needed
        this._connects = (this._connects || []);
        /*
         * Need to let the widgets get parsed, and things finish loading async
         */
        window.setTimeout(() => {
            //#xmaqhack
            /*
            this.widgetAddedOrDeleted();
            connect.publish('/davinci/ui/context/loaded', [this]);
            if (this._markDirtyAtLoadTime) {
                // Hack to allow certain scenarios to force the document to appear
                // as dirty at document load time
                this.editor.setDirty(true);
                delete this._markDirtyAtLoadTime;
                this.editor.save(true);		// autosave
            } else {
                this.editor.setDirty(this.hasDirtyResources());
            }
            */
            //delite hack
            //this.addPseudoClassSelectors();
        }, 1500);
    }
    _continueLoading(data, callback, callbackData, scope) {
        // tslint:disable-next-line:one-variable-per-declaration
        let promise, failureInfo: any = {};
        try {
            if (callbackData instanceof Error) {
                throw callbackData;
            }
            promise = this._setSourceData(data).then(this.onload.bind(this), error => {
                failureInfo.errorMessage = 'Unable to parse HTML source.  See console for error.  Please switch to "Display Source" mode and correct the error.'; // FIXME: i18n
                console.error(error.stack || error.message);
            });
        } catch (e) {
            failureInfo = e;
            console.error('Error  _continueLoading', e, this);

            // failureInfo = new Error(e.message, e.fileName, e.lineNumber);
            mixin(failureInfo, e);
            // logError(e, 'error loading document');
            // recreate the Error since we crossed frames
            //			failureInfo = new Error(e.message, e.fileName, e.lineNumber);
            //			lang.mixin(failureInfo, e);

        } finally {
            if (callback) {
                if (promise) {
                    promise.then(() => {
                        callback.call((scope || this), failureInfo);
                    });
                } else {
                    callback.call((scope || this), failureInfo);
                }
            }
        }
    }

    _setSourcePostLoadRequires(source, callback, scope) {
        // console.log('_setSourcePostLoadRequires');
        const data = this._parse(source);
        setTimeout(() => {
            this.rootNode = this.editor.frame.document.body;
            this._continueLoading(data, callback, this, scope);
        }, 2000);
        return;
        /*
                if (this.frameNode) {
                    // tear down old error message, if any
                    // query('.loading', this.frameNode.parentNode).orphan();

                    // frame has already been initialized, changing content (such as changes from the source editor)
                    this._continueLoading(data, callback, this, scope);
                } else {
                    // initialize frame
                    let dojoUrl;

                    dojo.some(data.scripts, url => {
                        if (url.indexOf('/dojo.js') != -1) {
                            dojoUrl = url;
                            return true;
                        }
                    });

                    // get the base path, removing the file extension.  the base is used in the library call below
                    const resourceBase = this.getBase();
                    if (!dojoUrl) {
                        // #3839 Theme editor uses dojo from installed lib
                        // pull Dojo path from installed libs, if available
                        const context = this;
                        dojo.some(Library.getUserLibs(resourceBase.toString()), function (lib) {
                            if (lib.id === 'dojo') {
                                const fullDojoPath = new Path(this.getBase()).append(lib.root).append('dojo/dojo.js');
                                dojoUrl = fullDojoPath.relativeTo(this.getPath(), true).toString();
                                //dojoUrl = new Path(this.relativePrefix).append(lib.root).append("dojo/dojo.js").toString();
                                context.addJavaScriptSrc(dojoUrl, true, '', false);
                                return true;
                            }
                            return false;
                        }, this);
                        // if still not defined, use app's Dojo (which may cause other issues!)
                        if (!dojoUrl) {
                            dojoUrl = this.getDojoUrl();
                            console.warn('Falling back to use workbench\'s Dojo in the editor iframe');
                        }
                    }

                    // Make all custom widget module definitions relative to dojo.js
                    const currentFilePath = this.getFullResourcePath();
                    const currentFilePathFolder = currentFilePath.getParentPath();
                    const dojoPathRelative = new Path(dojoUrl);
                    const dojoPath = currentFilePathFolder.append(dojoPathRelative);
                    const dojoFolderPath = dojoPath.getParentPath();
                    const workspaceUrl = Runtime.getUserWorkspaceUrl();
                    for (let i = 0; i < this._customWidgetPackages.length; i++) {
                        const cwp = this._customWidgetPackages[i];
                        const relativePathString = cwp.location.substr(workspaceUrl.length);
                        const relativePath = new Path(relativePathString);
                        cwp.location = relativePath.relativeTo(dojoFolderPath).toString();
                    }

                    const containerNode = this.containerNode;
                    containerNode.style.overflow = 'hidden';
                    const frame = domConstruct.create('iframe', this.iframeattrs, containerNode);
                    frame.dvContext = this;
                    this.frameNode = frame;
                    // this defaults to the base page
                    let realUrl = Workbench.location() + '/';

                    if (this.baseURL) {
                        realUrl = this.baseURL;
                    }

                    const doc = frame.contentDocument || frame.contentWindow.document,
                        win = windowUtils.get(doc),
                        subs = {
                            baseUrl: realUrl
                        };

                    if (dojoUrl) {
                        subs.dojoUrl = dojoUrl;
                        subs.id = this._id;

                        const config = {
                            packages: this._getLoaderPackages() // XXX need to add dynamically
                        };
                        this._getDojoScriptValues(config, subs);

                        //if (this._bootstrapModules) {
                        //    subs.additionalModules = ',' + this._bootstrapModules.split(',').map(mid => '\'' + mid + '\'').join(',');
                        //}
                    }

                    if (source.themeCssFiles) { // css files need to be added to doc before body content
                        // subs.themeCssFiles = source.themeCssFiles.map(file => '<link rel="stylesheet" type="text/css" href="' + file + '">').join('');
                    }

                    window['loading' + this._id] = (parser, htmlUtil) => {
                        let callbackData = this;
                        try {
                            const win = windowUtils.get(doc), body = (this.rootNode = doc.body);

                            if (!body) {
                                // Should never get here if domReady! fired?  Try again.
                                this._waiting = this._waiting || 0;
                                if (this._waiting++ < 10) {
                                    setTimeout(window['loading' + this._id], 500);
                                    console.log('waiting for doc.body');
                                    return;
                                }
                                throw 'doc.body is null';
                            }

                            delete window['loading' + this._id];

                            body.id = 'myapp';

                            // Kludge to enable full-screen layout widgets, like BorderContainer.
                            // What possible side-effects could there be setting 100%x100% on every document?
                            // See note above about margin:0 temporary hack
                            body.style.width = '100%';
                            body.style.height = '100%';
                            // Force visibility:visible because CSS stylesheets in dojox.mobile
                            // have BODY { visibility:hidden;} only to set visibility:visible within JS code.
                            // Maybe done to minimize flickering. Will follow up with dojox.mobile
                            // folks to find out what's up. See #712
                            body.style.visibility = 'visible';
                            body.style.margin = '0';

                            body._edit_context = this; // TODO: find a better place to stash the root context
                            const requires = this._bootstrapModules.split(',');
                            if (requires.indexOf('dijit/dijit-all') != -1) {
                                // this is needed for FF4 to keep Registry.editor.RichText from throwing at line 32 dojo 1.5
                                win.dojo._postLoad = true;
                            }

                            // see Dojo ticket #5334
                            // If you do not have this particular dojo.isArray code, DataGrid will not render in the tool.
                            // Also, any array value will be converted to {0: val0, 1: val1, ...}
                            // after swapping back and forth between the design and code views twice. This is not an array!
                            // win.require('dojo/_base/lang').isArray = win.dojo.isArray = it => it && Object.prototype.toString.call(it) == '[object Array]';

                            // Add module paths for all folders in lib/custom (or wherever custom widgets are stored)
                            win.require({
                                packages: this._customWidgetPackages
                            });

                        } catch (e) {
                            console.error(e.stack || e);
                            // recreate the Error since we crossed frames
                            callbackData = new Error(e.message, e.fileName, e.lineNumber);
                            lang.mixin(callbackData, e);
                        }
                        this._continueLoading(data, callback, callbackData, scope);
                    };

                    /*
                    doc.open();
                    const content = lang.replace(
                        newFileTemplate,
                        (_, key) => subs.hasOwnProperty(key) ? subs[key] : ''
                    );
                    doc.write(content);
                    doc.close();
                    */

        /*
        // intercept BS key - prompt user before navigating backwards
        connect.connect(doc.documentElement, 'onkeypress', e => {
            if (e.charOrCode == 8) {
                window.davinciBackspaceKeyTime = win.davinciBackspaceKeyTime = Date.now();
            }
        });

        // add key press listener
        connect.connect(doc.documentElement, 'onkeydown', dojo.hitch(this, function (e) {
            // we let the editor handle stuff for us
            this.editor.handleKeyEvent(e);
        }));

    }
        */
    }
    getModel() {
        return this._srcDocument;
    }
    getPath() {
        /*
         * FIXME:
         * We dont set the path along with the content in the context class, so
         * have to pull the resource path from the model.
         *
         * I would rather see the path passed in, rather than assume the model has the proper URL,
         * but using the model for now.
         *
         */
        return new Path(this.getModel().fileName);
    }

    loadRequires(type, updateSrc, doUpdateModelDojoRequires, skipDomUpdate?: boolean) {
        // this method is used heavily in RebuildPage.js, so please watch out when changing  API!
        const requires = Metadata.query(type, 'require');

        if (!requires || type === 'html.dbody') {
            return Promise.resolve();
        }

        const libraries = Metadata.query(type, 'library');
        const libs = {}
        const context = this;

        const _getResourcePath = (libId, src) => libs[libId].append(src).relativeTo(context.getPath(), true).toString();

        const _loadJSFile = (libId, src) => this.addJavaScriptSrc(_getResourcePath(libId, src), updateSrc, src, skipDomUpdate);

        const loadLibrary = (libId, lib) => {

            return new Promise((resolve, reject) => {
                if (libs.hasOwnProperty(libId)) {
                    return resolve();

                }

                // calculate base library path, used in loading relative required
                // resources
                const ver = Metadata.getLibrary(libId).version || lib.version;
                return this.getLibraryBase(libId, ver).then(root => {
                    // empty string OK here, but null isn't.
                    if (root == null) {
                        console.error('No library found for name = \'' + libId + '\' version = \'' + ver + '\'');
                        return reject();

                    }

                    // store path
                    libs[libId] = new Path(this.getBase()).append(root);

                    // If 'library' element points to the main library JS (rather than
                    // just base directory), then load that file now.
                    if (lib && lib.src && lib.src.substr(-3) === '.js') {
                        // XXX For now, lop off relative bits and use remainder as main
                        // library file.  In the future, we should use info from
                        // package.json and library.js to find out what part of this
                        // path is the piece we're interested in.
                        const m = lib.src.match(/((?:\.\.\/)*)(.*)/);
                        // m[1] => relative path
                        // m[2] => main library JS file
                        return _loadJSFile(libId, m[2]);
                    }
                    return resolve();
                });
            });
        };

        const libraryPromises = [];
        // first load any referenced libraries
        for (const libId in libraries) {
            if (libraries.hasOwnProperty(libId)) {
                libraryPromises.push(loadLibrary(libId, libraries[libId]));
            }
        }
        return Promise.all(libraryPromises).then(() => {
            // next, load the require statements
            const requirePromises = [];
            requires.then((reqs) => {
                every(reqs, (r) => {
                    // If this require belongs under a library, load library file first
                    // (if necessary).
                    if (r.$library) {
                        requirePromises.push(loadLibrary(r.$library, libraries[r.$library]));
                    }

                    switch (r.type) {
                        case 'javascript':
                            if (r.src) {
                                requirePromises.push(_loadJSFile(r.$library, r.src));
                            } else {
                                this.addJavaScriptText(r.$text, updateSrc || doUpdateModelDojoRequires, skipDomUpdate);
                            }
                            break;

                        case 'javascript-module':
                            // currently, only support 'amd' format
                            if (r.format !== 'amd') {
                                console.error('Unknown javascript-module format');
                            }
                            if (r.src) {
                                requirePromises.push(
                                    this.addJavaScriptModule(r.src, updateSrc || doUpdateModelDojoRequires, skipDomUpdate));
                            } else {
                                console.error('Inline \'javascript-module\' not handled src=' + r.src);
                            }
                            break;

                        case 'css':
                            if (r.src) {
                                const src = _getResourcePath(r.$library, r.src);
                                if (updateSrc) {
                                    this.addModeledStyleSheet(src, skipDomUpdate);
                                } else {
                                    this.loadStyleSheet(src);
                                }
                            } else {
                                console.error('Inline CSS not handled src=' + r.src);
                            }
                            break;

                        case 'image':
                            // Allow but ignore type=image
                            break;

                        default:
                            console.error('Unhandled metadata resource type=\'' + r.type +
                                '\' for widget \'' + type + '\'');
                    }
                    return true;
                }, this);
                return Promise.all(requirePromises);

            });
        });
    }

    public _setSource(source, callback, scope) {
        this._srcDocument = source;
        const r = this.loadRequires(
            'html.dbody',
            true /*updateSrc*/,
            false /*doUpdateModelDojoRequires*/,
            true /*skipDomUpdate*/
        ) as any;
        r.then(() => {
            console.log('--_setSourcePostLoadRequires');
            this._setSourcePostLoadRequires(source, callback, scope);
        });
    }
}
