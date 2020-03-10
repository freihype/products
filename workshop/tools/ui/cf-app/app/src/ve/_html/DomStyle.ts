import { isChrome, isSafari, isIE } from './browser';
import { byId } from '.';

/*define(["./sniff", "./dom"], function(has, dom){
    */
// module:
//		dojo/dom-style

// =============================
// Style Functions
// =============================

// getComputedStyle drives most of the style code.
// Wherever possible, reuse the returned object.
//
// API functions below that need to access computed styles accept an
// optional computedStyle parameter.
// If this parameter is omitted, the functions will call getComputedStyle themselves.
// This way, calling code can access computedStyle once, and then pass the reference to
// multiple API functions.

// Although we normally eschew argument validation at this
// level, here we test argument 'node' for (duck)type,
// by testing nodeType, ecause 'document' is the 'parentNode' of 'body'
// it is frequently sent to this function even
// though it is not Element.

let getComputedStyle;

export const style: any = {
    getComputedStyle: (node) => { },
    toPixelValue: (node, value) => { }
}

if (isChrome || isSafari) {
    getComputedStyle = function (/*DomNode*/ node) {
        if (!node) {
            return {};
        }
        let s;
        if (node.nodeType == 1) {
            let dv = node.ownerDocument.defaultView;
            s = dv.getComputedStyle(node, null);
            if (!s && node.style) {
                node.style.display = '';
                s = dv.getComputedStyle(node, null);
            }
        }
        return s || {};
    };
} else {
    getComputedStyle = function (node) {
        if (!node) {
            console.error('getComputedStyle :: invalid node');
            return node;
        }
        return node.nodeType == 1 /* ELEMENT_NODE*/ ?
            node.ownerDocument.defaultView.getComputedStyle(node, null) : {};
    };
}
style.getComputedStyle = getComputedStyle;
//export const  = getComputedStyle;
/*=====
 style.getComputedStyle = function(node){
 // summary:
 //		Returns a "computed style" object.
 //
 // description:
 //		Gets a "computed style" object which can be used to gather
 //		information about the current state of the rendered node.
 //
 //		Note that this may behave differently on different browsers.
 //		Values may have different formats and value encodings across
 //		browsers.
 //
 //		Note also that this method is expensive.  Wherever possible,
 //		reuse the returned object.
 //
 //		Use the dojo/dom-style.get() method for more consistent (pixelized)
 //		return values.
 //
 // node: DOMNode
 //		A reference to a DOM node. Does NOT support taking an
 //		ID string for speed reasons.
 // example:
 //	|	require(["dojo/dom-style", "dojo/dom"], function(domStyle, dom){
 //	|		domStyle.getComputedStyle(dom.byId('foo')).borderWidth;
 //	|	});
 //
 // example:
 //		Reusing the returned object, avoiding multiple lookups:
 //	|	require(["dojo/dom-style", "dojo/dom"], function(domStyle, dom){
 //	|		var cs = domStyle.getComputedStyle(dom.byId("someNode"));
 //	|		var w = cs.width, h = cs.height;
 //	|	});
 return; // CSS2Properties
 };
 =====*/

let toPixel;
if (!isIE) {
    toPixel = function (element, value) {
        // style values can be floats, client code may want
        // to round for integer pixels.
        return parseFloat(value) || 0;
    };
} else {
    toPixel = function (element, avalue) {
        if (!avalue) { return 0; }
        // on IE7, medium is usually 4 pixels
        if (avalue == 'medium') { return 4; }
        // style values can be floats, client code may
        // want to round this value for integer pixels.
        if (avalue.slice && avalue.slice(-2) == 'px') { return parseFloat(avalue); }

        let s = element.style;
        let rs = element.runtimeStyle;
        let cs = element.currentStyle;
        let sLeft = s.left;
        let rsLeft = rs.left;
        rs.left = cs.left;
        try {
            // 'avalue' may be incompatible with style.left, which can cause IE to throw
            // this has been observed for border widths using "thin", "medium", "thick" constants
            // those particular constants could be trapped by a lookup
            // but perhaps there are more
            s.left = avalue;
            avalue = s.pixelLeft;
        } catch (e) {
            avalue = 0;
        }
        s.left = sLeft;
        rs.left = rsLeft;
        return avalue;
    };
}
style.toPixelValue = toPixel;
/*=====
 style.toPixelValue = function(node, value){
 // summary:
 //		converts style value to pixels on IE or return a numeric value.
 // node: DOMNode
 // value: String
 // returns: Number
 };
 =====*/

// FIXME: there opacity quirks on FF that we haven't ported over. Hrm.

let astr = 'DXImageTransform.Microsoft.Alpha';
let af = function (n, f) {
    try {
        return n.filters.item(astr);
    } catch (e) {
        return f ? {} : null;
    }
};

const _getOpacity = (node) => {
    return getComputedStyle(node).opacity;
};

let _setOpacity = function (node, opacity) {
    return node.style.opacity = opacity;
};

let _pixelNamesCache = {
    left: true, top: true
};
let _pixelRegExp = /margin|padding|width|height|max|min|offset/; // |border
const _toStyleValue = (node, type, value) => {
    //TODO: should we really be doing string case conversion here? Should we cache it? Need to profile!
    type = type.toLowerCase();

    // Adjustments for IE and Edge
    if (value == 'auto') {
        if (type == 'height') { return node.offsetHeight; }
        if (type == 'width') { return node.offsetWidth; }
    }
    if (type == 'fontweight') {
        switch (value) {
            case 700: return 'bold';
            case 400:
            default: return 'normal';
        }
    }

    if (!(type in _pixelNamesCache)) {
        _pixelNamesCache[type] = _pixelRegExp.test(type);
    }
    return _pixelNamesCache[type] ? toPixel(node, value) : value;
}

// tslint:disable-next-line:object-literal-key-quotes
let _floatAliases = { cssFloat: 1, styleFloat: 1, 'float': 1 };

// public API

style.get = function getStyle(/*DOMNode|String*/ node, /*String?*/ name) {
    // summary:
    //		Accesses styles on a node.
    // description:
    //		Getting the style value uses the computed style for the node, so the value
    //		will be a calculated value, not just the immediate node.style value.
    //		Also when getting values, use specific style names,
    //		like "borderBottomWidth" instead of "border" since compound values like
    //		"border" are not necessarily reflected as expected.
    //		If you want to get node dimensions, use `dojo/dom-geometry.getMarginBox()`,
    //		`dojo/dom-geometry.getContentBox()` or `dojo/dom-geometry.getPosition()`.
    // node: DOMNode|String
    //		id or reference to node to get style for
    // name: String?
    //		the style property to get
    // example:
    //		Passing only an ID or node returns the computed style object of
    //		the node:
    //	|	require(["dojo/dom-style", "dojo/dom"], function(domStyle, dom){
    //	|		domStyle.get("thinger");
    //	|	});
    // example:
    //		Passing a node and a style property returns the current
    //		normalized, computed value for that property:
    //	|	require(["dojo/dom-style", "dojo/dom"], function(domStyle, dom){
    //	|		domStyle.get("thinger", "opacity"); // 1 by default
    //	|	});

    let n = byId(node);
    let l = arguments.length;
    let op = (name == 'opacity');
    if (l == 2 && op) {
        return _getOpacity(n);
    }
    name = _floatAliases[name] ? 'cssFloat' in n.style ? 'cssFloat' : 'styleFloat' : name;
    let s = style.getComputedStyle(n);
    return (l == 1) ? s : _toStyleValue(n, name, s[name] || n.style[name]); /* CSS2Properties||String||Number */
};

style.set = function setStyle(/*DOMNode|String*/ node, /*String|Object*/ name, /*String?*/ value) {
    // summary:
    //		Sets styles on a node.
    // node: DOMNode|String
    //		id or reference to node to set style for
    // name: String|Object
    //		the style property to set in DOM-accessor format
    //		("borderWidth", not "border-width") or an object with key/value
    //		pairs suitable for setting each property.
    // value: String?
    //		If passed, sets value on the node for style, handling
    //		cross-browser concerns.  When setting a pixel value,
    //		be sure to include "px" in the value. For instance, top: "200px".
    //		Otherwise, in some cases, some browsers will not apply the style.
    //
    // example:
    //		Passing a node, a style property, and a value changes the
    //		current display of the node and returns the new computed value
    //	|	require(["dojo/dom-style"], function(domStyle){
    //	|		domStyle.set("thinger", "opacity", 0.5); // == 0.5
    //	|	});
    //
    // example:
    //		Passing a node, an object-style style property sets each of the values in turn and returns the computed style object of the node:
    //	|	require(["dojo/dom-style"], function(domStyle){
    //	|		domStyle.set("thinger", {
    //	|			"opacity": 0.5,
    //	|			"border": "3px solid black",
    //	|			"height": "300px"
    //	|		});
    //	|	});
    //
    // example:
    //		When the CSS style property is hyphenated, the JavaScript property is camelCased.
    //		font-size becomes fontSize, and so on.
    //	|	require(["dojo/dom-style", "dojo/dom"], function(domStyle, dom){
    //	|		domStyle.set("thinger",{
    //	|			fontSize:"14pt",
    //	|			letterSpacing:"1.2em"
    //	|		});
    //	|	});
    //
    // example:
    //		dojo/NodeList implements .style() using the same syntax, omitting the "node" parameter, calling
    //		dojo/dom-style.get() on every element of the list. See: `dojo/query` and `dojo/NodeList`
    //	|	require(["dojo/dom-style", "dojo/query", "dojo/NodeList-dom"],
    //	|	function(domStyle, query){
    //	|		query(".someClassName").style("visibility","hidden");
    //	|		// or
    //	|		query("#baz > div").style({
    //	|			opacity:0.75,
    //	|			fontSize:"13pt"
    //	|		});
    //	|	});

    let n = byId(node);
    let l = arguments.length;
    let op = (name == 'opacity');
    name = _floatAliases[name] ? 'cssFloat' in n.style ? 'cssFloat' : 'styleFloat' : name;
    if (l == 3) {
        return op ? _setOpacity(n, value) : n.style[name] = value; // Number
    }
    // tslint:disable-next-line:forin
    for (let x in name) {
        style.set(node, x, name[x]);
    }
    return style.getComputedStyle(n);
};
