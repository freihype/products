import * as lodash from 'lodash';
import * as React from 'react';
import { HTMLWidget } from '../..';
import { PropertiesComponent } from '../../../components/Properties';
import { RESOURCE_VARIABLES } from '../../../config';
import { Handle, destroy } from '../../../shared/Evented';
import { IContentHandler } from '../../../types';
import { EditorContext } from '../../EditorContext';
import { EVENTS } from '../../types';
import { WidgetPalette } from '../Palette/WidgetPalette';
import { DevicePalette } from '../Palette/DevicePalette';
import { HTMLFile } from '../html/HTMLFile';
import { Metadata } from '../metadata';
import { Frame } from './Frame';
import { WidgetToProperties, createHandler } from './WidgetProperties';
import './index.scss';
import { WidgetCommandBar, IWidgetCommand } from '../CommandBar/WidgetCommandBar';
import { v4 } from 'uuid';
import { runAction } from './WidgetActions';
import * as $ from 'jquery';
import { setCurrentEditor } from '../../Runtime';

export class VisualEditor extends React.Component<any, any> implements IContentHandler, IWidgetCommand {
    commandBar: WidgetCommandBar;
    _context: EditorContext;
    public frame: Frame;
    public handles: Handle[];
    public id: string;

    constructor() {
        super(arguments);
        this.id = v4();
    }

    // widget command interface
    public onAction(path: string) {
        console.log('widget command : ', path);
        runAction(path, this._context);
    }

    // content handler interface
    public open(what: any) {
        return new Promise((resolve, reject) => { });
    };

    public showWidgetProperties(widgets: HTMLWidget[]) {
        const first = lodash.first(widgets);
        const properties: PropertiesComponent = this.props.properties();
        if (properties) {
            properties.next(createHandler, this, first, WidgetToProperties);
        } else {
            console.error('have no properties', this);
        }
        if (this.commandBar) {
            this.commandBar.setState({
                selection: widgets
            })
        } else {
            console.error('have no command bar', this);
        }
    }

    public initHandlers() {
        this.handles = [
            this._context.on(EVENTS.WIDGET_SELECTED, (widgetSelection) => {
                console.log('widget selected : ', widgetSelection, this);
                this.showWidgetProperties(widgetSelection.widget);
            })]
        console.log('init handlers', this);
    }

    public updateNavigation() {
        const app = this.props.handler;
        const navi = app.navigation;

        const collector = (ref: any) => {
            navi.addView(ref);
        };

        navi.setState({
            sources: [
                () => <div key='palette-key'>
                    <WidgetPalette ref={collector} {...this.props} showFilter={true} frame={this.frame} context={this._context} editor={this} />
                </div>,
                () => <div key='device-palette-key'>
                    <DevicePalette ref={collector} {...this.props} showFilter={true} frame={this.frame} context={this._context} editor={this} />
                </div>
            ]
        })
    }

    render() {
        return <div className='VisualEditor'>
            <WidgetCommandBar
                ref={(cb) => { this.commandBar = cb; console.log('cb', this) }}
                handler={this}
                project={this.props.project}
            />
            <Frame editor={this} ref={(ref) => this.frame} />
        </div>
    }

    _connectCallback(failureInfo) {
        try {
            if (failureInfo instanceof Error) {
                throw failureInfo;
            }

            // debugger;
            const context = this._context;
            let popup;
            try {
                context.activate2();
            } catch (e) {
                console.error('crash in context activation! : ' + e, e.stack);
            }
            const _doc = context.getDocument();

            // resize kludge to make Dijit visualEditor contents resize
            // seems necessary due to combination of 100%x100% layouts and extraneous width/height measurements serialized in markup
            /*
            //@ximpl.
                    context.getTopWidgets().forEach(function (widget) {
                        if (widget.resize) {
                                widget.resize();
                            }
                        });
                        */

            // pagebuilt event triggered after converting model into dom for visual page editor
            // dojo.publish('/davinci/ui/context/pagebuilt', [context]);
        } catch (e) {
            failureInfo = e;
        } finally {
            /*
            if (failureInfo.errorMessage) {
                this.loadingDiv.innerHTML = failureInfo.errorMessage || "(unknown)";
                console.error('error! ', failureInfo.errorMessage);

            } else if (failureInfo instanceof Error) {
                if (this.loadingDiv.parentNode) {
                    this.loadingDiv.parentNode.removeChild(this.loadingDiv);
                }
                delete this.loadingDiv;
                dojo.publish('/davinci/ui/context/pagebuilt', [context]);
                console.error('error! ', failureInfo);
            } else {
                if (this.loadingDiv.parentNode) {
                    this.loadingDiv.parentNode.removeChild(this.loadingDiv);
                }
                delete this.loadingDiv;
            }
            */
        }
    }
    public frameReady(html: string, frame: any) {
        // console.log('visual editor frame ready', this);
        setCurrentEditor(this);
        this.frame = frame;
        const hFile = new HTMLFile('./test.html');
        let ret = null;
        try {
            ret = hFile.setText(html, null);
        } catch (e) {
            console.error('error settings text', e);
        }
        const d = Metadata.init(this, RESOURCE_VARIABLES.META_ROOT);
        $(frame._frame).attr('frameBorder', '0');
        d.then((all) => {
            this._context = new EditorContext(this);
            this._context._setSource(hFile, (failureInfo) => {
                this._connectCallback(failureInfo);
                this.updateNavigation();
                this.initHandlers();
            }, null);
        })
    }
    componentWillUnmount() {
        this._context.destroy();
        this.handles.forEach((h) => destroy);
    }
    getContext() {
        return this._context;
    }
}
