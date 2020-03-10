import { GeomUtils } from './utils/GeomUtils';
import { create } from './_html';
let snapBox;
/**
 * Preparation routine called during dynamic dragging if snapping is active
 * before looping through all of the widgets in the document.
 * @param {object} context  context object for current document
 * @param {object} rect  l,t,w,h for rectangular area being dragged around. w=h=0 if a point.
 * @returns {boolean}  false=> no need to traverse, same as last time. true=>yes, do the traversal
 */
export class Snap {
    static updateSnapLinesBeforeTraversal(context, rect) {
        context._snapX = null;
        context._snapY = null;
        if (context._lastSnapBox) {
            if (context._lastSnapBox.l == rect.l &&
                context._lastSnapBox.t == rect.t &&
                context._lastSnapBox.w == rect.w &&
                context._lastSnapBox.h == rect.h) {
                return false;
            }
        }
        snapBox = {
            l: rect.l,
            t: rect.t,
            w: rect.w,
            h: rect.h,
            c: rect.l + rect.w / 2,
            r: rect.l + rect.w,
            m: rect.t + rect.h / 2,
            b: rect.t + rect.h
        };
        context._lastSnapBox = snapBox;
        return true;
    }

    /**
     * For a particular widget, see if there is a snapping opportunity that is better
     * than any other previously discovered snapping opportunity. If so, then update
     * various snapping-related properties on the "context" object.
     * @param {object} context  Current "context" object (i.e., current document)
     * @param {object} widget  Current dvWidget object
     * @param {object} computed_style  CSSStyleDeclaration holding computed style on widget's domNode
     * 		(passed in by higher-level routine so that computed style isn't called multiple times on same widget)
     * @param {boolean} doSnapLinesX  whether to show dynamic snap lines (x-axis)
     * @param {boolean} doSnapLinesY  whether to show dynamic snap lines (y-axis)
     */
    static findSnapOpportunities(context, widget, computed_style, doSnapLinesX, doSnapLinesY) {
        const distCheck = 75; // CLoseness distance in pixels - only snap if snapBox is sufficiently close to widget
        const snapBox = context._lastSnapBox;

        const node = widget.domNode;
        if (node.tagName == 'BODY') {
            return;
        }
        let dj_coords = null;
        const helper = widget.getHelper();
        // tslint:disable-next-line:prefer-conditional-expression
        if (helper && helper.getMarginBoxPageCoords) {
            dj_coords = helper.getMarginBoxPageCoords(widget);
        } else {
            dj_coords = GeomUtils.getMarginBoxPageCoordsCached(node);
        }

        const offset = context.getScrollOffset();
        dj_coords.x = dj_coords.l;
        dj_coords.y = dj_coords.t;

        //FIXME: Maybe make this a preference.
        const hitradius = 5;

        let currentDeltaX = context._snapX ? context._snapX.delta : hitradius + 1;
        let currentDeltaY = context._snapY ? context._snapY.delta : hitradius + 1;

        let widgetSnapInfo: any = {
            snapRect: {
                l: dj_coords.x,
                c: dj_coords.x + (dj_coords.w / 2),
                r: dj_coords.x + dj_coords.w,
                t: dj_coords.y,
                m: dj_coords.y + (dj_coords.h / 2),
                b: dj_coords.y + dj_coords.h
            }
        };

        if (helper && helper.getSnapInfo) {
            // If widget has a getSnapInfo helper function, call it
            // passing the default widgetSnapInfo in case it wants to accept
            // the defaults or override the defaults
            widgetSnapInfo = helper.getSnapInfo(widget, widgetSnapInfo);
        }

        function snapX(typeRefObj, typeCurrObj, x, delta?: any) {

            if (delta < currentDeltaX) {
                context._snapX = {
                    type: typeRefObj,
                    typeRefObj: typeRefObj,
                    typeCurrObj: typeCurrObj,
                    x: x,
                    widget: widget,
                    delta: delta
                };
                //context._snapX.x+=offset.x;
                currentDeltaX = delta;
                context._snapXLast = context._snapX;
            }
        }

        function snapY(typeRefObj, typeCurrObj, y, delta?: any) {
            if (delta < currentDeltaY) {
                context._snapY = {
                    type: typeRefObj,
                    typeRefObj: typeRefObj,
                    typeCurrObj: typeCurrObj,
                    y: y,
                    widget: widget,
                    delta: delta
                };
                //context._snapY.y+=offset.y;
                currentDeltaY = delta;
                context._snapYLast = context._snapY;
            }
        }
        const rect = widgetSnapInfo.snapRect;
        let deltaLeft;
        let deltaCenter;
        let deltaRight;
        let deltaTop;
        let deltaMiddle;
        let deltaBottom;
        let delta;

        if (rect) {
            if (doSnapLinesX) {
                const distCheckY = (context._snapXLast && context._snapXLast.widget === widget) ? Infinity : distCheck;
                const distTT = Math.abs(rect.t - snapBox.t);
                const distTB = Math.abs(rect.t - snapBox.b);
                const distBT = Math.abs(rect.b - snapBox.t);
                const distBB = Math.abs(rect.b - snapBox.b);
                // Only snap if snapBox is sufficiently close to widget
                if (distTT <= distCheckY || distTB <= distCheckY || distBT <= distCheckY || distBB <= distCheckY) {
                    deltaLeft = Math.abs(rect.l - snapBox.l);
                    deltaCenter = Math.abs(rect.c - snapBox.c);
                    deltaRight = Math.abs(rect.r - snapBox.r);
                    snapX('left', 'left', rect.l, deltaLeft);
                    snapX('center', 'center', rect.c, deltaCenter);
                    snapX('right', 'right', rect.r, deltaRight);

                    snapX('left', 'center', rect.c, Math.abs(rect.c - snapBox.l));
                    snapX('left', 'right', rect.r, Math.abs(rect.r - snapBox.l));
                    snapX('right', 'left', rect.l, Math.abs(rect.l - snapBox.r));
                    snapX('right', 'center', rect.c, Math.abs(rect.c - snapBox.r));
                    snapX('center', 'left', rect.l, Math.abs(rect.l - snapBox.c));
                    snapX('center', 'right', rect.r, Math.abs(rect.r - snapBox.c));
                }
            }

            if (doSnapLinesY) {
                const distCheckX = (context._snapYLast && context._snapYLast.widget === widget) ? Infinity : distCheck;
                const distLL = Math.abs(rect.l - snapBox.l);
                const distLR = Math.abs(rect.l - snapBox.r);
                const distRL = Math.abs(rect.r - snapBox.l);
                const distRR = Math.abs(rect.r - snapBox.r);
                // Only snap if snapBox is sufficiently close to widget
                if (distLL <= distCheckX || distLR <= distCheckX || distRL <= distCheckX || distRR <= distCheckX) {
                    deltaTop = Math.abs(rect.t - snapBox.t);
                    deltaMiddle = Math.abs(rect.m - snapBox.m);
                    deltaBottom = Math.abs(rect.b - snapBox.b);
                    snapY('top', 'top', rect.t, deltaTop);
                    snapY('middle', 'middle', rect.m, deltaMiddle);
                    snapY('bottom', 'bottom', rect.b, deltaBottom);

                    snapY('top', 'middle', rect.m, Math.abs(rect.m - snapBox.t));
                    snapY('top', 'bottom', rect.b, Math.abs(rect.b - snapBox.t));
                    snapY('bottom', 'top', rect.t, Math.abs(rect.t - snapBox.b));
                    snapY('bottom', 'middle', rect.m, Math.abs(rect.m - snapBox.b));
                    snapY('middle', 'top', rect.t, Math.abs(rect.t - snapBox.m));
                    snapY('middle', 'bottom', rect.b, Math.abs(rect.b - snapBox.m));
                }
            }
        }
        const points = widgetSnapInfo.snapPoints;
        if (points) {
            for (const p of points) {
                deltaLeft = Math.abs(p.x - snapBox.l);
                deltaCenter = Math.abs(p.x - snapBox.c);
                deltaRight = Math.abs(p.x - snapBox.r);
                snapX('point', p.x, deltaLeft);
                snapX('point', p.x, deltaCenter);
                snapX('point', p.x, deltaRight);
                deltaTop = Math.abs(p.y - snapBox.t);
                deltaMiddle = Math.abs(p.y - snapBox.m);
                deltaBottom = Math.abs(p.y - snapBox.b);
                snapY('point', p.y, deltaTop);
                snapY('point', p.y, deltaMiddle);
                snapY('point', p.y, deltaBottom);
            }
        }
    }

    /**
     * Updates screen to show dynamic snap lines
     */
    static updateSnapLinesAfterTraversal(context) {

        const containerNode = context.getContainerNode();

        if (!context._snapLinesDiv) {
            context._snapLinesDiv = create('div', {
                class: 'snaplines',
                style: 'position:absolute;top:0px;left:0px;z-index:1000001;pointer-events:none;'
            },
                containerNode);
            context._snapLinesDivWidgetX = create('div', {
                class: 'snaplinesWidgetX',
                style: 'position:absolute;pointer-events:none;'
            },
                context._snapLinesDiv);
            context._snapLinesDivAlignX = create('div', {
                class: 'snaplinesAlignX',
                style: 'position:absolute;pointer-events:none;'
            },
                context._snapLinesDiv);
            context._snapLinesDivWidgetY = create('div', {
                class: 'snaplinesWidgetY',
                style: 'position:absolute;pointer-events:none;'
            },
                context._snapLinesDiv);
            context._snapLinesDivAlignY = create('div', {
                class: 'snaplinesAlignY',
                style: 'position:absolute;pointer-events:none;'
            },
                context._snapLinesDiv);
        }

        context._snapLinesDiv.style.display = 'block';

        let box; // Initial values are assigned by internal function snapSetup below leveraging closure

        function snapSetup(context, widget, widgetDiv, alignDiv) {
            widgetDiv.style.display = 'block';
            alignDiv.style.display = 'block';
            const helper = widget.getHelper();
            // tslint:disable-next-line:prefer-conditional-expression
            if (helper && helper.getMarginBoxPageCoords) {
                box = helper.getMarginBoxPageCoords(widget);
            } else {
                box = GeomUtils.getMarginBoxPageCoordsCached(widget.domNode);
            }
            const offset = context.getScrollOffset();

            //box.l-=offset.x;

            box.x = box.l;
            box.y = box.t;
            box.r = box.x + box.w;
            box.b = box.y + box.h;
            box.c = box.x + box.w / 2;
            box.m = box.y + box.h / 2;

            widgetDiv.style.left = box.x + 'px';
            widgetDiv.style.top = box.y + 'px';
            widgetDiv.style.width = box.w + 'px';
            widgetDiv.style.height = box.h + 'px';
            //FIXME: Put into stylesheet
            widgetDiv.style.backgroundColor = 'rgba(255,0,255,.05)';
        }

        let styleAlign = context._snapLinesDivAlignX.style;
        let styleWidget = context._snapLinesDivWidgetX.style;
        if (context._snapX) {
            const snapX = context._snapX;
            snapSetup(context, snapX.widget, context._snapLinesDivWidgetX, context._snapLinesDivAlignX);
            let t;
            let h;
            if (box.y < snapBox.t) {
                t = box.y;
                h = snapBox.t - box.y;
            } else {
                t = snapBox.t;
                h = box.y - snapBox.t;
            }
            if (snapX.typeCurrObj == 'point') {
                styleAlign.left = context._snapX.x + 'px';
            } else if (snapX.typeCurrObj == 'left') {
                styleAlign.left = box.x + 'px';
            } else if (snapX.typeCurrObj == 'center') {
                styleAlign.left = box.c + 'px';
            } else { // "right"
                styleAlign.left = box.r + 'px';
            }
            styleAlign.top = t + 'px';
            styleAlign.width = '1px';
            styleAlign.height = h + 'px';
            //FIXME: Put into stylesheet
            styleAlign.backgroundColor = 'rgba(255,0,255,.75)';
        } else {
            styleAlign.display = 'none';
            styleWidget.display = 'none';
        }
        styleAlign = context._snapLinesDivAlignY.style;
        styleWidget = context._snapLinesDivWidgetY.style;

        if (context._snapY) {
            const snapY = context._snapY;
            snapSetup(context, snapY.widget, context._snapLinesDivWidgetY, context._snapLinesDivAlignY);
            let l;
            let w;
            if (box.x < snapBox.l) {
                l = box.x;
                w = snapBox.l - box.x;
            } else {
                l = snapBox.l;
                w = box.x - snapBox.l;
            }

            if (snapY.type == 'point') {
                styleAlign.top = snapY.y + 'px';
            } else if (snapY.typeCurrObj == 'top') {
                styleAlign.top = box.y + 'px';
            } else if (snapY.typeCurrObj == 'middle') {
                styleAlign.top = box.m + 'px';
            } else { // "bottom"
                styleAlign.top = box.b + 'px';
            }
            styleAlign.left = l + 'px';
            styleAlign.height = '1px';
            styleAlign.width = w + 'px';
            //FIXME: Put into stylesheet
            styleAlign.backgroundColor = 'rgba(255,0,255,.75)';
        } else {
            styleAlign.display = 'none';
            styleWidget.display = 'none';
        }
    }

    /**
     * Clears all snap lines from visual canvas
     */
    static clearSnapLines(context) {
        if (context._snapLinesDiv) {
            context._snapLinesDiv.style.display = 'none';
        }
        context._snapX = context._snapY = null;
    }
}
