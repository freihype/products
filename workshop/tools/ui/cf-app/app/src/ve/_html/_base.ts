/*
define([
    "dojo/_base/declare",
    "dojo/Deferred",
    "dojo/dom-construct",
    "dojo/html",
    "dojo/_base/kernel",
    "dojo/_base/lang",
    "dojo/ready",
    "dojo/_base/sniff",
    "dojo/_base/url",
    "dojo/_base/xhr",
    "dojo/when",
    "dojo/_base/window"
], (
    declare,
    Deferred,
    domConstruct,
    htmlUtil,
    kernel,
    lang,
    ready,
    has,
    _Url,
    xhrUtil,
    when,
    windowUtil
) => {
    */
import * as htmlUtil from './html';
import * as _ from 'lodash';
import { Url } from './Url';
import { mixin } from '@xblox/core/objects';
/*
    Status: don't know where this will all live exactly
    Need to pull in the implementation of the various helper methods
    Some can be static method, others maybe methods of the ContentSetter (?)

    Gut the ContentPane, replace its _setContent with our own call to dojox.html.set()
    */
// const html = kernel.getObject("dojox.html", true);

// css at-rules must be set before any css declarations according to CSS spec
// match:
// @import 'http://dojotoolkit.org/dojo.css';
// @import 'you/never/thought/' print;
// @import url("it/would/work") tv, screen;
// @import url(/did/you/now.css);
// but not:
// @namespace dojo "http://dojotoolkit.org/dojo.css"; /* namespace URL should always be a absolute URI */
// @charset 'utf-8';
// @media print{ #menuRoot {display:none;} }

// we adjust all paths that dont start on '/' or contains ':'
//(?![a-z]+:|\/)

const cssPaths = /(?:(?:@import\s*(['"])(?![a-z]+:|\/)([^\r\n;{]+?)\1)|url\(\s*(['"]?)(?![a-z]+:|\/)([^\r\n;]+?)\3\s*\))([a-z, \s]*[;}]?)/g;

const adjustCssPaths = (cssUrl, cssText) => {
    // summary:
    //		adjusts relative paths in cssText to be relative to cssUrl
    //		a path is considered relative if it doesn't start with '/' and not contains ':'
    // description:
    //		Say we fetch a HTML page from level1/page.html
    //		It has some inline CSS:
    //	|		@import "css/page.css" tv, screen;
    //	|		...
    //	|		background-image: url(images/aplhaimage.png);
    //
    //		as we fetched this HTML and therefore this CSS
    //		from level1/page.html, these paths needs to be adjusted to:
    //	|		@import 'level1/css/page.css' tv, screen;
    //	|		...
    //	|		background-image: url(level1/images/alphaimage.png);
    //
    //		In IE it will also adjust relative paths in AlphaImageLoader()
    //	|		filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='images/alphaimage.png');
    //		will be adjusted to:
    //	|		filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='level1/images/alphaimage.png');
    //
    //		Please note that any relative paths in AlphaImageLoader in external css files wont work, as
    //		the paths in AlphaImageLoader is MUST be declared relative to the HTML page,
    //		not relative to the CSS file that declares it

    if (!cssText || !cssUrl) { return; }

    // support the ImageAlphaFilter if it exists, most people use it in IE 6 for transparent PNGs
    // We are NOT going to kill it in IE 7 just because the PNGs work there. Somebody might have
    // other uses for it.
    // If user want to disable css filter in IE6  he/she should
    // unset filter in a declaration that just IE 6 doesn't understands
    // like * > .myselector { filter:none; }
    return cssText.replace(cssPaths, (ignore, delimStr, strUrl, delimUrl, urlUrl, media) => {
        if (strUrl) {
            return '@import "' + (new Url(cssUrl, './' + strUrl).toString()) + '"' + media;
        } else {
            return 'url(' + (new Url(cssUrl, './' + urlUrl).toString()) + ')' + media;
        }
    });
};

// attributepaths one tag can have multiple paths, example:
// <input src="..." style="url(..)"/> or <a style="url(..)" href="..">
// <img style='filter:progid...AlphaImageLoader(src="noticeTheSrcHereRunsThroughHtmlSrc")' src="img">
const htmlAttrPaths = /(<[a-z][a-z0-9]*\s[^>]*)(?:(href|src)=(['"]?)([^>]*?)\3|style=(['"]?)([^>]*?)\5)([^>]*>)/gi;

const adjustHtmlPaths = (htmlUrl, cont) => {
    const url = htmlUrl || './';

    return cont.replace(htmlAttrPaths,
        (tag, start, name, delim, relUrl, delim2, cssText, end) => start + (name ?
            (name + '=' + delim + (new Url(url, relUrl).toString()) + delim)
            : ('style=' + delim2 + adjustCssPaths(url, cssText) + delim2)
        ) + end
    );
};

const snarfStyles = (cssUrl, cont, styles) => {
    //  cut out all <style> and <link rel="stylesheet" href="..">
    // also return any attributes from this tag (might be a media attribute)
    // if cssUrl is set it will adjust paths accordingly
    styles.attributes = [];

    cont = cont.replace(/<[!][-][-](.|\s)*?[-][-]>/g,
        comment => comment.replace(/<(\/?)style\b/ig, '&lt;$1Style').replace(/<(\/?)link\b/ig, '&lt;$1Link').replace(/@import "/ig, '@ import "')
    );
    return cont.replace(/(?:<style([^>]*)>([\s\S]*?)<\/style>|<link\s+(?=[^>]*rel=['"]?stylesheet)([^>]*?href=(['"])([^>]*?)\4[^>\/]*)\/?>)/gi,
        (ignore, styleAttr, cssText, linkAttr, delim, href) => {
            // trim attribute
            let i;

            let attr = (styleAttr || linkAttr || '').replace(/^\s*([\s\S]*?)\s*$/i, '$1');
            // tslint:disable-next-line:prefer-conditional-expression
            if (cssText) {
                i = styles.push(cssUrl ? adjustCssPaths(cssUrl, cssText) : cssText);
            } else {
                i = styles.push('@import "' + href + '";');
                // remove rel=... and href=...
                // attr = attr.replace(/\s*(?:rel|href)=(['"])?[^\s]*\1\sgi, ''');
            }
            if (attr) {
                // split on both "\n", "\t", " " etc
                attr = attr.split(/\s+/);
                const atObj = {};
                let tmp;
                for (let j = 0, e = attr.length; j < e; j++) {
                    tmp = attr[j].split('='); // split name='value'
                    atObj[tmp[0]] = tmp[1].replace(/^\s*['"]?([\s\S]*?)['"]?\s*$/, '$1'); // trim and remove ''
                }
                styles.attributes[i - 1] = atObj;
            }
            return '';
        }
    );
};

const snarfScripts = (cont, byRef) => {
    // summary:
    //		strips out script tags from cont
    // byRef:
    //		byRef = {errBack:function(){, downloadRemote: true(default false)}}
    //		byRef will have {code: 'jscode'} when this scope leaves
    byRef.code = '';

    //Update script tags nested in comments so that the script tag collector doesn't pick
    //them up.
    cont = cont.replace(/<[!][-][-](.|\s)*?[-][-]>/g,
        comment => comment.replace(/<(\/?)script\b/ig, '&lt;$1Script')
    );

    function download(src) {
        if (byRef.downloadRemote) {
            /*
            // console.debug('downloading',src);
            //Fix up src, in case there were entity character encodings in it.
            //Probably only need to worry about a subset.
            src = src.replace(/&([a-z0-9#]+);/g, (m, name) => {
                switch (name) {
                    case "amp": return "&";
                    case "gt": return ">";
                    case "lt": return "<";
                    default:
                        return name.charAt(0) == "#" ? String.fromCharCode(name.substring(1)) : "&" + name + ";";
                }
            });
            xhrUtil.get({
                url: src,
                sync: true,
                load(code) {
                    byRef.code += code + ";";
                },
                error: byRef.errBack
            });
            */
        }
    }

    // match <script>, <script type="text/..., but not <script type="dojo(/method)...
    return cont.replace(/<script\s*(?![^>]*type=['"]?(?:dojo\/|text\/html\b))[^>]*?(?:src=(['"]?)([^>]*?)\1[^>]*)?>([\s\S]*?)<\/script>/gi,
        (ignore, delim, src, code) => {
            if (src) {
                download(src);
            } else {
                byRef.code += code;
            }
            return '';
        }
    );
};

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

export class ContentSetter extends htmlUtil.ContentSetter {
    _styleNodes: any;
    _code: any;
    _styles: any[];
    // adjustPaths: Boolean
    //		Adjust relative paths in html string content to point to this page
    //		Only useful if you grab content from a another folder than the current one
    adjustPaths: boolean = false;
    referencePath: string = '.';
    renderStyles: boolean = false;

    executeScripts: boolean = false;
    scriptHasHooks: boolean = false;
    scriptHookReplacement: any = null;

    _renderStyles(styles) {
        // insert css from content into document head
        this._styleNodes = [];
        let st;
        let att;
        let cssText;
        const doc = (this.node as HTMLElement).ownerDocument;
        const head = doc.getElementsByTagName('head')[0];

        for (let i = 0, e = styles.length; i < e; i++) {
            cssText = styles[i]; att = styles.attributes[i];
            st = doc.createElement('style');
            st.setAttribute('type', 'text/css'); // this is required in CSS spec!

            // tslint:disable-next-line:forin
            for (const x in att) {
                st.setAttribute(x, att[x]);
            }

            this._styleNodes.push(st);
            head.appendChild(st); // must insert into DOM before setting cssText

            if (st.styleSheet) { // IE
                st.styleSheet.cssText = cssText;
            } else { // w3c
                st.appendChild(doc.createTextNode(cssText));
            }
        }
    }

    empty() {
        // this.inherited("empty", arguments);
        //this.super.(arguments);
        this._empty();

        // empty out the styles array from any previous use
        this._styles = [];
    }

    onBegin() {
        // summary:
        //		Called after instantiation, but before set();
        //		It allows modification of any of the object properties - including the node and content
        //		provided - before the set operation actually takes place
        //		This implementation extends that of dojo.html._ContentSetter
        //		to add handling for adjustPaths, renderStyles on the html string content before it is set
        // this.inherited("onBegin", arguments);
        // super(arguments);

        this._onBegin();
        let cont = this.content;
        const node = this.node;

        const styles = this._styles;

        if (_.isString(cont)) {
            if (this.adjustPaths && this.referencePath) {
                cont = adjustHtmlPaths(this.referencePath, cont);
            }

            if (this.renderStyles || this.cleanContent) {
                cont = snarfStyles(this.referencePath, cont, styles);
            }

            // because of a bug in IE, script tags that is first in html hierarchy doesnt make it into the DOM
            //	when content is innerHTML'ed, so we can't use dojo.query to retrieve scripts from DOM
            if (this.executeScripts) {
                const _t = this;
                const byRef: any = {
                    downloadRemote: true,
                    errBack(e) {
                        _t._onError.call(_t, 'Exec', 'Error downloading remote script in "' + _t.id + '"', e);
                    }
                };
                cont = snarfScripts(cont, byRef);
                this._code = byRef.code;
            }
        }
        this.content = cont;
    }

    onEnd() {
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
                htmlUtil.destroy(this._styleNodes.pop());
            }
        }
        // render new style nodes
        if (this.renderStyles && styles && styles.length) {
            this._renderStyles(styles);
        }

        // Deferred to signal when this function is complete
        //const d = new Deferred();

        // Setup function to call onEnd() in the superclass, for parsing, and resolve the above Deferred when
        // parsing is complete.
        /*
        const superClassOnEndMethod = this.getInherited(arguments);

        const args = arguments;

        const callSuperclass = lang.hitch(this, function () {
            superClassOnEndMethod.apply(this, args);

            // If parser ran (parseContent == true), wait for it to finish, otherwise call d.resolve() immediately
            when(this.parseDeferred, () => { d.resolve(); });
        });
        */

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
            this._onEnd();
        }

        // Return a promise that resolves after the ready() call completes, and after the parser finishes running.
        // return d.promise;
    }

    tearDown() {
        // this.inherited(arguments);
        this._tearDown();
        delete this._styles;
        // only tear down -or another set() - will explicitly throw away the
        // references to the style nodes we added
        if (this._styleNodes && this._styleNodes.length) {
            while (this._styleNodes.length) {
                htmlUtil.destroy(this._styleNodes.pop());
            }
        }
        delete this._styleNodes;
        // reset the defaults from the prototype
        // XXX: not sure if this is the correct intended behaviour, it was originally
        // dojo.getObject(this.declaredClass).prototype which will not work with anonymous
        // modules
        mixin(this, htmlUtil.ContentSetter.prototype);
    }
}

export const set = (node, cont, params?: any) => {
    // TODO: add all the other options
    // summary:
    //		inserts (replaces) the given content into the given node
    // node:
    //		the parent element that will receive the content
    // cont:
    //		the content to be set on the parent element.
    //		This can be an html string, a node reference or a NodeList, dojo/NodeList, Array or other enumerable list of nodes
    // params:
    //		Optional flags/properties to configure the content-setting. See dojo.html._ContentSetter
    // example:
    //		A safe string/node/nodelist content replacement/injection with hooks for extension
    //		Example Usage:
    //	|	dojo.html.set(node, "some string");
    //	|	dojo.html.set(node, contentNode, {options});
    //	|	dojo.html.set(node, myNode.childNodes, {options});

    if (!params) {
        // simple and fast
        return htmlUtil.html._setNodeContent(node, cont, true);
    } else {
        // more options but slower
        const op = new htmlUtil.ContentSetter(mixin(
            params,
            { content: cont, node: node }
        ));
        return op.set();
    }
};
