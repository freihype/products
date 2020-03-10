import { default as http } from 'axios';
import * as React from 'react';
import { events, views } from './mock/last';
import { SessionAPI } from './SessionAPI';
import { IRenderer } from './types';


const viewId = '1543321206753';
let eventsUrl = 'http://localhost:3000/views/sessions/6I445VKUVP4IPIO8TTKHGIEQPB4I4FEH?parse=true&parseMutations=false&convert=true'
let sessionId = "1543321199538x1543321214625xHUAHGZKVXTAXAQSMZZSJJSMXYSFUANOR";
let visitid = 'HUAHGZKVXTAXAQSMZZSJJSMXYSFUANOR';
let dStart = 1543321199538;
let dEnd = 1543321214625;

let USE_MOCK = true;
if (location.search.indexOf('useMock=false') !== -1) {
    USE_MOCK = false;
}

const createSessionId = (start: number, end: number) => `${start}x${end}x${visitid}`


const viewsTemplate = (view: string, start: number, end: number) => {
    return {
        "views": [{
            "id": view,
            "tabId": view,
            "start": start,
            "end": end,
            "url": "http://guenter-dev:8081/?view=kpi&selected=AgentMemory"
        }],
        "baseEntity": {},
        "id": createSessionId(start, end),
        "duration": end - start
    }
}

type RendererProps = {
    onLoaded: (renderer: IRenderer) => boolean;
    // onEvents: (events: any[]) => boolean;
    // onViews: (views: any[]) => boolean;
    session: string;
    visitor: string;
    renderer: IRenderer;
    size?: any;
    onError: (e: any) => void;
    autoPlay: boolean;
}

export class Renderer extends React.Component<RendererProps, {
    loaded: boolean,
    session: string
}> {
    public state = {
        loaded: false,
        session: null
    };
    container: any;
    error: boolean;
    constructor(props) {
        super(props);
        this.state = {
            session: props.session,
            loaded: false
        }
    }
    componentDidMount() {
        const self = this;
        try {
            const { session } = this.props;
            const useAPI = session && session.length > 0;
            if (useAPI) {
                // console.log('init with session id ' + session);
                sessionId = session;
                USE_MOCK = false;
                const parts = session.split('x');
                dStart = parseInt(parts[0], 10);
                dEnd = parseInt(parts[1], 10);
                visitid = parts[2];
            }

            const api: any = {
                timeline: async (visitid: string) => {
                    if (useAPI) {

                        const parts = visitid.split('x');
                        dStart = parseInt(parts[0], 10);
                        dEnd = parseInt(parts[1], 10);
                        visitid = parts[2];
                        const data = await SessionAPI.views(visitid, dStart, dEnd);

                        if (data.error) {
                            this.props.onError(data);
                            return {
                                views: [],
                                duration: 0
                            };
                        }
                        if (data && data.views) {
                            decorateViewsData(session, data);
                            return data;
                        } else {
                            return {
                                views: [],
                                duration: 0
                            };
                        }
                    }
                    if (USE_MOCK) {
                        console.log('fetch timeline ' + visitid, views);
                        return views;
                    } else {
                        let ret = viewsTemplate(viewId, dStart, dEnd);
                        decorateViewsData(createSessionId(dStart, dEnd), ret);
                        // console.log('fetch timeline ' + visitid, ret);
                        return ret;
                    }
                },
                events: async (sessionId: string, view: { end: any; start: any }, viewReady) => {
                    if (USE_MOCK) {
                        // console.log('fetch events : ' + sessionId, view, events);
                        return events;
                    } else {
                        if (useAPI) {
                            // console.log('fetch events : ' + sessionId, visitid, dStart);
                            const data = await SessionAPI.events(visitid, dStart);
                            data.start = dStart;
                            data.end = dEnd;
                            data.events = data.events.filter((e) => e.type && e.type !== 'view');
                            viewReady.then(() => {
                                if (!self.state.loaded) {
                                    // console.log('loaded fully');
                                    self.props.onLoaded(self.props.renderer);
                                    if (self.props.autoPlay) {
                                        if (location.search.indexOf('autoplay=false') !== -1) {
                                            return;
                                        }
                                        setTimeout(() => {
                                            // console.log('auto play');
                                            self.props.renderer.play();
                                        }, 2000);
                                    } else {
                                        setTimeout(() => {
                                            // console.log('auto play');
                                            self.props.renderer.play();
                                            setTimeout(() => {
                                                self.props.renderer.pause();
                                            }, 1);
                                        }, 2000);
                                    }
                                    self.setState({ loaded: true });
                                }

                            })
                            return data;
                        }
                        return new Promise((resolve, reject) => {
                            http.get(eventsUrl)
                                .then((response) => {
                                    const data: any = response.data;
                                    data.events.forEach((e) => {
                                        if (e.type === 'frame') {
                                            e.payload = { value: "" };
                                        }
                                    })
                                    data.start = dStart;
                                    data.end = dEnd;
                                    resolve(data);
                                })
                                .catch((e) => {
                                    console.error('error loading events!', e);
                                });
                        });
                    }
                }
            }


            this.props.renderer.init(this.container, api, (e) => {
                this.props.onError(e);
                return;
            });
            if (USE_MOCK) {
                this.props.renderer.load(sessionId);
            } else {
                if (sessionId !== '0') {
                    this.props.renderer.load(createSessionId(dStart, dEnd));
                } else {
                    this.error = true;
                }
            }
            if (this.error) {
                console.error('abort');
                return;
            }
        } catch (e) {
            console.error('crash', e);
        }
    }
    onRendererTime(time: number): any {
    }

    shouldComponentUpdate(props, state) {
        return this.props.session !== props.session;
    }

    componentWillReceiveProps(nextProps) {
        // console.log('receive props ', nextProps);
        /*
        if (nextProps.session !== this.props.session) {
            console.error('changed !');
            this.props.renderer['time'] = 0;
            this.props.renderer.pause();
            const parts = nextProps.session.split('x');
            dStart = parseInt(parts[0], 10);
            dEnd = parseInt(parts[1], 10);
            visitid = parts[2];
            // this.props.renderer.load(createSessionId(dStart, dEnd));
            // this.props.renderer.reset();
        }*/
    }

    render() {
        const size = this.props.size;

        // console.log('render renderer! ', this.props);
        if (size && size.width > 0) {
            // size.width -= 200;
            // console.log('render with ', this.props.size);
        }
        return size ? <div
            style={{
                width: size.width, maxWidth: size.width,
                height: size.height, maxHeight: size.height
            }}
            className="rendererContainer"
            ref={(ref) => this.container = ref}>
        </div> : <div
            className="rendererContainer"
            ref={(ref) => this.container = ref}>
            </div>;
    }
}




const decorateViewsData = (sessionId: string, sessionReplayViewsData: any) => {
    try {
        let [startDate, endDate] = sessionId.split('x');

        const firstView = sessionReplayViewsData.views[0];
        const lastView = sessionReplayViewsData.views[sessionReplayViewsData.views.length - 1];

        firstView.start = Math.min(firstView.start, parseInt(startDate, 10));
        lastView.end = Math.max(lastView.end, parseInt(endDate, 10));

        sessionReplayViewsData.duration = lastView.end - firstView.start;
        sessionReplayViewsData.start = new Date(firstView.start).toISOString();
        sessionReplayViewsData.id = sessionId;

        return sessionReplayViewsData;
    } catch (e) {
        return false;
    }
}