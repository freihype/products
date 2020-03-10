import { GeomUtils } from "../utils";

/*
define(["./_base/lang", "./sniff", "./_base/window", "./dom", "./dom-geometry", "./dom-style", "./dom-construct"],
    function (lang, has, baseWindow, dom, geom, style, domConstruct) {
        */
// feature detection
/* not needed but included here for future reference
has.add("rtl-innerVerticalScrollBar-on-left", function(win, doc){
    var	body = baseWindow.body(doc),
        scrollable = domConstruct.create('div', {
            style: {overflow:'scroll', overflowX:'hidden', direction:'rtl', visibility:'hidden', position:'absolute', left:'0', width:'64px', height:'64px'}
        }, body, "last"),
        center = domConstruct.create('center', {
            style: {overflow:'hidden', direction:'ltr'}
        }, scrollable, "last"),
        inner = domConstruct.create('div', {
            style: {overflow:'visible', display:'inline' }
        }, center, "last");
    inner.innerHTML="&nbsp;";
    var midPoint = Math.max(inner.offsetLeft, geom.position(inner).x);
    var ret = midPoint >= 32;
    center.removeChild(inner);
    scrollable.removeChild(center);
    body.removeChild(scrollable);
    return ret;
});
*/
// module:
//		dojo/window

// tslint:disable-next-line:class-name
export class win {
    static getBox(doc) {
        // summary:
        //		Returns the dimensions and scroll position of the viewable area of a browser window

        doc = doc || window.document;

        let scrollRoot = doc.documentElement;

        // get scroll position
        let scroll = GeomUtils.docScroll(doc); // scrollRoot.scrollTop/Left should work
        let w;
        let h;

       // on desktops, scrollRoot.clientHeight <= scrollRoot.offsetHeight <= uiWindow.innerHeight, return scrollRoot.clientHeight
        // uiWindow.innerWidth/Height includes the scrollbar and cannot be used
        w = scrollRoot.clientWidth;
        h = scrollRoot.clientHeight;
        return {
            l: scroll.x,
            t: scroll.y,
            w: w,
            h: h
        };
    }
    // summary:
    //		TODOC
    /*
        static getBox(doc) {
            // summary:
            //		Returns the dimensions and scroll position of the viewable area of a browser window

            doc = doc || baseWindow.doc;

            const scrollRoot = (doc.compatMode == 'BackCompat') ? baseWindow.body(doc) : doc.documentElement;
            // get scroll position
            const scroll = geom.docScroll(doc); // scrollRoot.scrollTop/Left should work
            let w;
            let h;

                if (has("touch")) { // if(scrollbars not supported)
                    var uiWindow = window.get(doc); // use UI window, not dojo.global window
                    // on mobile, scrollRoot.clientHeight <= uiWindow.innerHeight <= scrollRoot.offsetHeight, return uiWindow.innerHeight
                    w = uiWindow.innerWidth || scrollRoot.clientWidth; // || scrollRoot.clientXXX probably never evaluated
                    h = uiWindow.innerHeight || scrollRoot.clientHeight;
                } else {
            // on desktops, scrollRoot.clientHeight <= scrollRoot.offsetHeight <= uiWindow.innerHeight, return scrollRoot.clientHeight
            // uiWindow.innerWidth/Height includes the scrollbar and cannot be used
            w = scrollRoot.clientWidth;
            h = scrollRoot.clientHeight;
            //}
            return {
                l: scroll.x,
                t: scroll.y,
                w: w,
                h: h
            };
        }
        */
    /*Document*/
    static get(doc) {
        // summary:
        //		Get window object associated with document doc.
        // doc:
        //		The document to get the associated window for.

        // In some IE versions (at least 6.0), document.parentWindow does not return a
        // reference to the real window object (maybe a copy), so we must fix it as well
        // We use IE specific execScript to attach the real window reference to
        // document._parentWindow for later use
        return doc.parentWindow || doc.defaultView; //	Window
    }
    static body(/*Document?*/ doc) {
        // summary:
        //		Return the body element of the specified document or of dojo/_base/window::doc.
        // example:
        //	|	win.body().appendChild(dojo.doc.createElement('div'));

        // Note: document.body is not defined for a strict xhtml document
        // Would like to memoize this, but dojo.doc can change vi dojo.withDoc().
        return doc.body || doc.getElementsByTagName('body')[0]; // Node
    }
    // DocumentElement
    // Function callback,
    // Object? thisObject,
    // Array? cbArguments
    static withDoc(documentObject, callback, thisObject?: any, cbArguments?: any) {
        // summary:
        //		Invoke callback with documentObject as dojo/_base/window::doc.
        // description:
        //		Invoke callback with documentObject as dojo/_base/window::doc. If provided,
        //		callback will be executed in the context of object thisObject
        //		When callback() returns or throws an error, the dojo/_base/window::doc will
        //		be restored to its previous state.

        /*
        var oldDoc = ret.doc,
            oldQ = has("quirks"),
            oldIE = has("ie"), isIE, mode, pwin;
            */

        try {
            // dojo.doc = ret.doc = documentObject;
            // update dojo.isQuirks and the value of the has feature "quirks".
            // remove setting dojo.isQuirks and dojo.isIE for 2.0
            // dojo.isQuirks = has.add("quirks", dojo.doc.compatMode == "BackCompat", true, true); // no need to check for QuirksMode which was Opera 7 only

            if (thisObject && typeof callback == 'string') {
                callback = thisObject[callback];
            }
            return callback.apply(thisObject, cbArguments || []);
        } finally {
            // dojo.doc = ret.doc = oldDoc;
            // dojo.isQuirks = has.add("quirks", oldQ, true, true);
            // dojo.isIE = has.add("ie", oldIE, true, true);
        }
    }

};
