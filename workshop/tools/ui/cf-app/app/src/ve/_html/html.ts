import * as _ from 'lodash';
import { mixin } from '@xblox/core/objects';

// the parser might be needed..

// idCounter is incremented with each instantiation to allow assignment of a unique id for tracking, logging purposes
let idCounter = 0;
export const byId = (id, doc: any = document) => {
    // inline'd type check.
    // be sure to return null per documentation, to match IE branch.
    return ((typeof id == 'string') ? doc.getElementById(id) : id) || null; // DOMNode
};

function _empty(node) {
    // TODO: remove this if() block in 2.0 when we no longer have to worry about IE memory leaks,
    // and then uncomment the emptyGrandchildren() test case from html.html.
    // Note that besides fixing #16957, using removeChild() is actually faster than setting node.innerHTML,
    // see http://jsperf.com/clear-dom-node.
    if ('innerHTML' in node) {
        try {
            // fast path
            node.innerHTML = '';
            return;
        } catch (e) {
            // innerHTML is readOnly (e.g. TABLE (sub)elements in quirks mode)
            // Fall through (saves bytes)
        }
    }

    // SVG/strict elements don't support innerHTML
    // tslint:disable-next-line:no-conditional-assignment
    for (let c; c = node.lastChild;) { // intentional assignment
        node.removeChild(c);
    }
}

function _destroy(/*DomNode*/ node, /*DomNode*/ parent) {
    // in IE quirks, node.canHaveChildren can be false but firstChild can be non-null (OBJECT/APPLET)
    if (node.firstChild) {
        _empty(node);
    }
}
export const destroy = (node) => {
    // summary:
    //		Removes a node from its parent, clobbering it and all of its
    //		children.
    //
    // description:
    //		Removes a node from its parent, clobbering it and all of its
    //		children. Function only works with DomNodes, and returns nothing.
    //
    // node: DOMNode|String
    //		A String ID or DomNode reference of the element to be destroyed
    //
    // example:
    //		Destroy a node byId:
    //	|	require(["dojo/dom-construct"], function(domConstruct){
    //	|		domConstruct.destroy("someId");
    //	|	});

    node = byId(node);
    if (!node) { return; }
    _destroy(node, node.parentNode);
};

export const empty = (/*DOMNode|String*/ node) => {
    // summary:
    //		safely removes all children of the node.
    // node: DOMNode|String
    //		a reference to a DOM node or an id.
    // example:
    //		Destroy node's children byId:
    //	|	require(["dojo/dom-construct"], function(domConstruct){
    //	|		domConstruct.empty("someId");
    //	|	});

    _empty(node);
}
const tagWrap = {
    option: ['select'],
    tbody: ['table'],
    thead: ['table'],
    tfoot: ['table'],
    tr: ['table', 'tbody'],
    td: ['table', 'tbody', 'tr'],
    th: ['table', 'thead', 'tr'],
    legend: ['fieldset'],
    caption: ['table'],
    colgroup: ['table'],
    col: ['table', 'colgroup'],
    li: ['ul']
};
const reTag = /<\s*([\w\:]+)/;
const masterNode = {};
let masterNum = 0;
const masterName = '__' + '_scope_' + 'ToDomId';

// summary:
//		instantiates an HTML fragment returning the corresponding DOM.
// frag: String
//		the HTML fragment
// doc: DocumentNode?
//		optional document to use when creating DOM nodes, defaults to
//		dojo/_base/window.doc if not specified.
// returns:
//		Document fragment, unless it's a single node in which case it returns the node itself
// example:
//		Create a table row:
//	|	require(["dojo/dom-construct"], function(domConstruct){
//	|		var tr = domConstruct.toDom("<tr><td>First!</td></tr>");
//	|	});
export const toDom = (frag, doc) => {

    // doc = doc || win.doc;
    let masterId = doc[masterName];
    if (!masterId) {
        doc[masterName] = masterId = ++masterNum + '';
        masterNode[masterId] = doc.createElement('div');
    }

    // make sure the frag is a string.
    frag += '';

    // find the starting tag, and get node wrapper
    let match = frag.match(reTag);
    let tag = match ? match[1].toLowerCase() : '';
    let master = masterNode[masterId];
    let wrap;
    let i;
    let fc;
    let df;

    if (match && tagWrap[tag]) {
        wrap = tagWrap[tag];
        master.innerHTML = wrap.pre + frag + wrap.post;
        for (i = wrap.length; i; --i) {
            master = master.firstChild;
        }
    } else {
        master.innerHTML = frag;
    }

    // one node shortcut => return the node itself
    if (master.childNodes.length == 1) {
        return master.removeChild(master.firstChild); // DOMNode
    }

    // return multiple nodes as a document fragment
    df = doc.createDocumentFragment();
    // tslint:disable-next-line:no-conditional-assignment
    while ((fc = master.firstChild)) { // intentional assignment
        df.appendChild(fc);
    }
    return df; // DocumentFragment
}

function _insertBefore(/*DomNode*/ node, /*DomNode*/ ref) {
    let parent = ref.parentNode;
    if (parent) {
        parent.insertBefore(node, ref);
    }
}

const _insertAfter = (/*DomNode*/ node, /*DomNode*/ ref) => {
    // summary:
    //		Try to insert node after ref
    let parent = ref.parentNode;
    if (parent) {
        if (parent.lastChild == ref) {
            parent.appendChild(node);
        } else {
            parent.insertBefore(node, ref.nextSibling);
        }
    }
}

export const place = (node, refNode, position) => {
    // summary:
    //		Attempt to insert node into the DOM, choosing from various positioning options.
    //		Returns the first argument resolved to a DOM node.
    // node: DOMNode|DocumentFragment|String
    //		id or node reference, or HTML fragment starting with "<" to place relative to refNode
    // refNode: DOMNode|String
    //		id or node reference to use as basis for placement
    // position: String|Number?
    //		string noting the position of node relative to refNode or a
    //		number indicating the location in the childNodes collection of refNode.
    //		Accepted string values are:
    //
    //		- before
    //		- after
    //		- replace
    //		- only
    //		- first
    //		- last
    //
    //		"first" and "last" indicate positions as children of refNode, "replace" replaces refNode,
    //		"only" replaces all children.  position defaults to "last" if not specified
    // returns: DOMNode
    //		Returned values is the first argument resolved to a DOM node.
    //
    //		.place() is also a method of `dojo/NodeList`, allowing `dojo/query` node lookups.
    // example:
    //		Place a node by string id as the last child of another node by string id:
    //	|	require(["dojo/dom-construct"], function(domConstruct){
    //	|		domConstruct.place("someNode", "anotherNode");
    //	|	});
    // example:
    //		Place a node by string id before another node by string id
    //	|	require(["dojo/dom-construct"], function(domConstruct){
    //	|		domConstruct.place("someNode", "anotherNode", "before");
    //	|	});
    // example:
    //		Create a Node, and place it in the body element (last child):
    //	|	require(["dojo/dom-construct", "dojo/_base/window"
    //	|	], function(domConstruct, win){
    //	|		domConstruct.place("<div></div>", win.body());
    //	|	});
    // example:
    //		Put a new LI as the first child of a list by id:
    //	|	require(["dojo/dom-construct"], function(domConstruct){
    //	|		domConstruct.place("<li></li>", "someUl", "first");
    //	|	});

    refNode = byId(refNode);
    if (!refNode) {
        console.error('have no node in domConstruct');
        console.trace();
        return;
    }
    if (typeof node == 'string') { // inline'd type check
        node = /^\s*</.test(node) ? exports.toDom(node, refNode.ownerDocument) : node;
    }
    if (typeof position == 'number') { // inline'd type check
        const cn = refNode.childNodes;
        if (!cn.length || cn.length <= position) {
            refNode.appendChild(node);
        } else {
            _insertBefore(node, cn[position < 0 ? 0 : position]);
        }
    } else {
        switch (position) {
            case 'before':
                _insertBefore(node, refNode);
                break;
            case 'after':
                _insertAfter(node, refNode);
                break;
            case 'replace':
                refNode.parentNode.replaceChild(node, refNode);
                break;
            case 'only':
                exports.empty(refNode);
                refNode.appendChild(node);
                break;
            case 'first':
                if (refNode.firstChild) {
                    _insertBefore(node, refNode.firstChild);
                    break;
                }
            // else fallthrough...
            default: // aka: last
                {
                    if (!refNode) {
                        console.error('bad');
                        console.trace();
                        return null;
                    }
                    refNode.appendChild(node);
                }
        }
    }
    return node; // DomNode
};

const html = {
    _secureForInnerHtml(cont) {
        // summary:
        //		removes !DOCTYPE and title elements from the html string.
        //
        //		khtml is picky about dom faults, you can't attach a style or `<title>` node as child of body
        //		must go into head, so we need to cut out those tags
        // cont:
        //		An html string for insertion into the dom
        //
        return cont.replace(/(?:\s*<!DOCTYPE\s[^>]+>|<title[^>]*>[\s\S]*?<\/title>)/ig, ''); // String
    },

    // Deprecated, should use dojo/dom-constuct.empty() directly, remove in 2.0.
    _setNodeContent(node, cont, od?: any) {
        // summary:
        //		inserts the given content into the given node
        // node:
        //		the parent element
        // content:
        //		the content to be set on the parent element.
        //		This can be an html string, a node reference or a NodeList, dojo/NodeList, Array or other enumerable list of nodes

        // always empty
        empty(node);

        if (cont) {
            if (typeof cont == 'number') {
                cont = cont.toString();
            }
            if (typeof cont == 'string') {
                cont = toDom(cont, node.ownerDocument);
            }
            if (!cont.nodeType && _.isArrayLike(cont)) {
                // handle as enumerable, but it may shrink as we enumerate it
                for (let startlen = cont.length, i = 0; i < cont.length; i = startlen == cont.length ? i + 1 : 0) {
                    place(cont[i], node, 'last');
                }
            } else {
                // pass nodes, documentFragments and unknowns through to dojo.place
                place(cont, node, 'last');
            }
        }

        // return DomNode
        return node;
    }
}

export const evalInGlobal = (code, appendNode) => {
    // we do our own eval here as dojo.eval doesn't eval in global crossbrowser
    // This work X browser but but it relies on a DOM
    // plus it doesn't return anything, thats unrelevant here but not for dojo core
    // appendNode = appendNode || windowUtil.doc.body;
    appendNode = appendNode || document;
    const n = appendNode.ownerDocument.createElement('script');
    n.type = 'text/javascript';
    appendNode.appendChild(n);
    n.text = code; // DOM 1 says this should work
};

// we wrap up the content-setting operation in a object
export class ContentSetter {
    [x: string]: any;
    parseResults: any;
    parseDeferred: any;
    declaredClass: string;
    // node: DomNode|String
    //		An node which will be the parent element that we set content into
    node: HTMLElement | string = '';

    // content: String|DomNode|DomNode[]
    //		The content to be placed in the node. Can be an HTML string, a node reference, or a enumerable list of nodes
    content: string = '';

    // id: String?
    //		Usually only used internally, and auto-generated with each instance
    id: string = '';

    // cleanContent: Boolean
    //		Should the content be treated as a full html document,
    //		and the real content stripped of <html>, <body> wrapper before injection
    cleanContent: boolean = false;

    // extractContent: Boolean
    //		Should the content be treated as a full html document,
    //		and the real content stripped of `<html> <body>` wrapper before injection
    extractContent: boolean = false;

    // parseContent: Boolean
    //		Should the node by passed to the parser after the new content is set
    parseContent: boolean = false;

    // parserScope: String
    //		Flag passed to parser.	Root for attribute names to search for.	  If scopeName is dojo,
    //		will search for data-dojo-type (or dojoType).  For backwards compatibility
    //		reasons defaults to dojo._scopeName (which is "dojo" except when
    //		multi-version support is used, when it will be something like dojo16, dojo20, etc.)
    parserScope: string = 'kernel._scopeName';

    // startup: Boolean
    //		Start the child widgets after parsing them.	  Only obeyed if parseContent is true.
    startup: boolean = true;

    // lifecycle methods
    constructor(/*Object*/ params, /*String|DomNode*/ node?: HTMLElement) {
        // summary:
        //		Provides a configurable, extensible object to wrap the setting on content on a node
        //		call the set() method to actually set the content..

        // the original params are mixed directly into the instance "this"
        mixin(this, params || {});

        // give precedence to params.node vs. the node argument
        // and ensure its a node, not an id string
        node = this.node = this.node as HTMLElement || node;

        if (!this.id) {
            this.id = [
                'Setter',
                (node) ? node.id || node.tagName : '',
                idCounter++
            ].join('_');
        }
    }
    set(/* String|DomNode|NodeList? */ cont?: any, /*Object?*/ params?: any) {
        // summary:
        //		front-end to the set-content sequence
        // cont:
        //		An html string, node or enumerable list of nodes for insertion into the dom
        //		If not provided, the object's content property will be used
        if (undefined !== cont) {
            this.content = cont;
        }
        if (typeof cont == 'number') {
            cont = cont.toString();
        }
        // in the re-use scenario, set needs to be able to mixin new configuration
        if (params) {
            this._mixin(params);
        }

        this._onBegin();
        this.setContent();

        let ret = null;
        // tslint:disable-next-line:prefer-conditional-expression
        if (this.end) {
            ret = this.end(this);
        } else {
            ret = this.onEnd();
        }
        return this.node;
    }

    setContent() {
        // summary:
        //		sets the content on the node

        let node: any = this.node;
        if (!node) {
            // can't proceed
            throw new Error(this.declaredClass + ': setContent given no node');
        }
        try {
            node = html._setNodeContent(node, this.content);
        } catch (e) {
            // check if a domfault occurs when we are appending this.errorMessage
            // like for instance if domNode is a UL and we try append a DIV

            // FIXME: need to allow the user to provide a content error message string
            const errMess = this.onContentError(e);
            try {
                node.innerHTML = errMess;
            } catch (e) {
                console.error('Fatal ' + this.declaredClass + '.setContent could not change content due to ' + e.message, e);
            }
        }
        // always put back the node for the next method
        this.node = node; // DomNode
    }

    _empty() {
        // summary:
        //		cleanly empty out existing content

        // If there is a parse in progress, cancel it.
        if (this.parseDeferred) {
            if (!this.parseDeferred.isResolved()) {
                this.parseDeferred.cancel();
            }
            delete this.parseDeferred;
        }

        // destroy any widgets from a previous run
        // NOTE: if you don't want this you'll need to empty
        // the parseResults array property yourself to avoid bad things happening
        if (this.parseResults && this.parseResults.length) {
            this.parseResults.forEach((w) => {
                if (w.destroy) {
                    w.destroy();
                }
            });
            delete this.parseResults;
        }
        // this is fast, but if you know its already empty or safe, you could
        // override empty to skip this step
        empty(this.node);
    }

    _onBegin() {
        // summary:
        //		Called after instantiation, but before set();
        //		It allows modification of any of the object properties -
        //		including the node and content provided - before the set operation actually takes place
        //		This default implementation checks for cleanContent and extractContent flags to
        //		optionally pre-process html string content
        let cont = this.content;

        if (_.isString(cont)) {
            if (this.cleanContent) {
                cont = html._secureForInnerHtml(cont);
            }

            if (this.extractContent) {
                const match = cont.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
                if (match) {
                    cont = match[1];
                }
            }
        }

        // clean out the node and any cruft associated with it - like widgets
        this._empty();

        this.content = cont;
        return this.node; // DomNode
    }

    _onEnd(): any {

        // summary:
        //		Called after set(), when the new content has been pushed into the node
        //		It provides an opportunity for post-processing before handing back the node to the caller
        //		This implementation extends that of dojo.html._ContentSetter

        let code = this._code;

        const styles = this._styles;

        // clear old stylenodes from the DOM
        // these were added by the last set call
        // (in other words, if you dont keep and reuse the ContentSetter for a particular node
        // .. you'll have no practical way to do this)
        if (this._styleNodes && this._styleNodes.length) {
            while (this._styleNodes.length) {
                destroy(this._styleNodes.pop());
            }
        }
        // render new style nodes
        if (this.renderStyles && styles && styles.length) {
            this._renderStyles(styles);
        }

        if (this.executeScripts && code) {
            // Evaluate any <script> blocks in the content
            if (this.cleanContent) {
                // clean JS from html comments and other crap that browser
                // parser takes care of in a normal page load
                code = code.replace(/(<!--|(?:\/\/)?-->|<!\[CDATA\[|\]\]>)/g, '');
            }
            if (this.scriptHasHooks) {
                // replace _container_ with this.scriptHookReplace()
                // the scriptHookReplacement can be a string
                // or a function, which when invoked returns the string you want to substitute in
                code = code.replace(/_container_(?!\s*=[^=])/g, this.scriptHookReplacement);
            }
            try {
                evalInGlobal(code, this.node);
            } catch (e) {
                this._onError('Exec', 'Error eval script in ' + this.id + ', ' + e.message, e);
            }

            // Finally, use ready() to wait for any require() calls from the <script> blocks to complete,
            // then call onEnd() in the superclass, for parsing, and when that is done resolve the Deferred.
            // For 2.0, remove the call to ready() (or this whole if() branch?) since the parser can do loading for us.
            // ready(callSuperclass);
        } else {
            // There were no <script>'s to execute, so immediately call onEnd() in the superclass, and
            // when the parser finishes running, resolve the Deferred.
            // callSuperclass();
            //this._onEnd();
            if (this.parseContent) {
                // populates this.parseResults and this.parseDeferred if you need those..
                this._parse();
            }
            return this.node; // DomNode
        }
    }

    _tearDown() {
        // summary:
        //		manually reset the Setter instance if its being re-used for example for another set()
        // description:
        //		tearDown() is not called automatically.
        //		In normal use, the Setter instance properties are simply allowed to fall out of scope
        //		but the tearDown method can be called to explicitly reset this instance.
        delete this.parseResults;
        delete this.parseDeferred;
        delete this.node;
        delete this.content;
    }

    onContentError(err) {
        return 'Error occurred setting content: ' + err;
    }

    onExecError(err) {
        return 'Error occurred executing scripts: ' + err;
    }

    _mixin(params) {
        // mix properties/methods into the instance
        // TODO: the intention with tearDown is to put the Setter's state
        // back to that of the original constructor (vs. deleting/resetting everything regardless of ctor params)
        // so we could do something here to move the original properties aside for later restoration
        const empty = {};

        let key;
        for (key in params) {
            if (key in empty) {
                continue;
            }
            // TODO: here's our opportunity to mask the properties we don't consider configurable/overridable
            // .. but history shows we'll almost always guess wrong
            this[key] = params[key];
        }
    }
    _parse() {
        // summary:
        //		runs the dojo parser over the node contents, storing any results in this.parseResults
        //		and the parse promise in this.parseDeferred
        //		Any errors resulting from parsing are passed to _onError for handling

        const rootNode = this.node;
        try {
            // store the results (widgets, whatever) for potential retrieval
            const inherited = {};
            ['dir', 'lang', 'textDir'].forEach((name) => {
                if (this[name]) {
                    inherited[name] = this[name];
                }
            }, this);
        } catch (e) {
            this._onError('Content', e, 'Error parsing in _ContentSetter#' + this.id);
        }
    }

    _onError(type, err, consoleText) {
        // summary:
        //		shows user the string that is returned by on[type]Error
        //		override/implement on[type]Error and return your own string to customize
        const errText = this['on' + type + 'Error'].call(this, err);
        if (consoleText) {
            console.error(consoleText, err);
        } else if (errText) { // a empty string won't change current content
            html._setNodeContent(this.node, errText, true);
        }
    }
}

export const set = (/*DomNode*/ node, /*String|DomNode|NodeList*/ cont, /*Object?*/ params) => {
    // summary:
    //		inserts (replaces) the given content into the given node. dojo/dom-construct.place(cont, node, "only")
    //		may be a better choice for simple HTML insertion.
    // description:
    //		Unless you need to use the params capabilities of this method, you should use
    //		dojo/dom-construct.place(cont, node, "only"). dojo/dom-construct..place() has more robust support for injecting
    //		an HTML string into the DOM, but it only handles inserting an HTML string as DOM
    //		elements, or inserting a DOM node. dojo/dom-construct..place does not handle NodeList insertions
    //		dojo/dom-construct.place(cont, node, "only"). dojo/dom-construct.place() has more robust support for injecting
    //		an HTML string into the DOM, but it only handles inserting an HTML string as DOM
    //		elements, or inserting a DOM node. dojo/dom-construct.place does not handle NodeList insertions
    //		or the other capabilities as defined by the params object for this method.
    // node:
    //		the parent element that will receive the content
    // cont:
    //		the content to be set on the parent element.
    //		This can be an html string, a node reference or a NodeList, dojo/NodeList, Array or other enumerable list of nodes
    // params:
    //		Optional flags/properties to configure the content-setting. See dojo/html/_ContentSetter
    // example:
    //		A safe string/node/nodelist content replacement/injection with hooks for extension
    //		Example Usage:
    //	|	html.set(node, "some string");
    //	|	html.set(node, contentNode, {options});
    //	|	html.set(node, myNode.childNodes, {options});
    if (undefined == cont) {
        console.warn('dojo.html.set: no cont argument provided, using empty string');
        cont = '';
    }
    if (typeof cont == 'number') {
        cont = cont.toString();
    }
    if (!params) {
        // simple and fast
        return html._setNodeContent(node, cont, true);
    } else {
        // more options but slower
        // note the arguments are reversed in order, to match the convention for instantiation via the parser
        const op = new ContentSetter(mixin(
            params, {
                content: cont,
                node: node
            }
        ));
        return op.set();
    }
}
