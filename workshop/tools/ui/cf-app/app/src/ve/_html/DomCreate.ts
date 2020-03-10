import { byId, place } from '.';
import * as $ from 'jquery';

export const create = (/*DOMNode|String*/ tag, /*Object*/ attrs: any, /*DOMNode|String?*/ refNode?: any, /*String?*/ pos?: any) => {
    // summary:
    //		Create an element, allowing for optional attribute decoration
    //		and placement.
    // description:
    //		A DOM Element creation function. A shorthand method for creating a node or
    //		a fragment, and allowing for a convenient optional attribute setting step,
    //		as well as an optional DOM placement reference.
    //
    //		Attributes are set by passing the optional object through `dojo/dom-attr.set`.
    //		See `dojo/dom-attr.set` for noted caveats and nuances, and API if applicable.
    //
    //		Placement is done via `dojo/dom-construct.place`, assuming the new node to be
    //		the action node, passing along the optional reference node and position.
    // tag: DOMNode|String
    //		A string of the element to create (eg: "div", "a", "p", "li", "script", "br"),
    //		or an existing DOM node to process.
    // attrs: Object
    //		An object-hash of attributes to set on the newly created node.
    //		Can be null, if you don't want to set any attributes/styles.
    //		See: `dojo/dom-attr.set` for a description of available attributes.
    // refNode: DOMNode|String?
    //		Optional reference node. Used by `dojo/dom-construct.place` to place the newly created
    //		node somewhere in the dom relative to refNode. Can be a DomNode reference
    //		or String ID of a node.
    // pos: String?
    //		Optional positional reference. Defaults to "last" by way of `dojo/domConstruct.place`,
    //		though can be set to "first","after","before","last", "replace" or "only"
    //		to further control the placement of the new node relative to the refNode.
    //		'refNode' is required if a 'pos' is specified.
    // example:
    //		Create a DIV:
    //	|	require(["dojo/dom-construct"], function(domConstruct){
    //	|		var n = domConstruct.create("div");
    //	|	});
    //
    // example:
    //		Create a DIV with content:
    //	|	require(["dojo/dom-construct"], function(domConstruct){
    //	|		var n = domConstruct.create("div", { innerHTML:"<p>hi</p>" });
    //	|	});
    //
    // example:
    //		Place a new DIV in the BODY, with no attributes set
    //	|	require(["dojo/dom-construct", "dojo/_base/window"], function(domConstruct, win){
    //	|		var n = domConstruct.create("div", null, win.body());
    //	|	});
    //
    // example:
    //		Create an UL, and populate it with LI's. Place the list as the first-child of a
    //		node with id="someId":
    //	|	require(["dojo/dom-construct", "dojo/_base/array"],
    //	|	function(domConstruct, arrayUtil){
    //	|		var ul = domConstruct.create("ul", null, "someId", "first");
    //	|		var items = ["one", "two", "three", "four"];
    //	|		arrayUtil.forEach(items, function(data){
    //	|			domConstruct.create("li", { innerHTML: data }, ul);
    //	|		});
    //	|	});
    //
    // example:
    //		Create an anchor, with an href. Place in BODY:
    //	|	require(["dojo/dom-construct", "dojo/_base/window"], function(domConstruct, win){
    //	|		domConstruct.create("a", { href:"foo.html", title:"Goto FOO!" }, win.body());
    //	|	});

    let doc = window.document;
    if (refNode) {
        refNode = byId(refNode);
        doc = refNode.ownerDocument;
    }
    if (typeof tag == 'string') { // inline'd type check
        tag = doc.createElement(tag);
    }
    if (attrs) {
        let node = $(tag);
        // tslint:disable-next-line:forin
        for (let a in attrs) {
            node.attr(a, attrs[a]);
        }
        //debugger;
        // attr.set(tag, attrs);
    }
    if (refNode) {
        place(tag, refNode, pos);
    }
    return tag; // DomNode
};
