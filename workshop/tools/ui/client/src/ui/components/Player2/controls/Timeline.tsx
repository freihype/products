import * as React from 'react';
import { Renderer } from '../../Player/Renderer';
import { IRenderer } from '../../Player/types';
// import 'rc-slider/assets/index.css';
import { default as Slider, Handle } from 'rc-slider';
import { default as Tooltip } from 'rc-tooltip';

import { SessionAPI } from '../../Player/SessionAPI';
import moment = require('moment');
import { filterByTime, formatTime } from '../../../../shared';

const fa = require('@fortawesome/fontawesome-free/js/all');

const handle = (props) => {
    const { value, dragging, index, ...restProps } = props;
    return (
        <Tooltip
            prefixCls="rc-slider-tooltip"
            overlay={formatTime(value)}
            visible={dragging}
            placement="top"
            key={index}
            trigger={['hover']}
        >
            <Handle value={value} {...restProps} />
        </Tooltip>
    );
};


type TimelineProps = {
    selected?: string;
    session: string;
    onChanged: (value: number) => void;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export class Timeline extends React.Component<TimelineProps, {
    time: number,
    start: number,
    end: number,
    marks: any,
    skip: boolean,
    events: any[],
    renderer: IRenderer;
}> {
    public state = {
        time: 0,
        start: 0, end: 0, marks: {},
        skip: true,
        events: [], renderer: null,
        didSetup: false
    };
    public rendererComponent: Renderer;
    container: any;
    renderer: IRenderer;
    didSetup: boolean = false;
    public slider: Slider;
    public isPlaying: false;
    async componentWillMount() {

        const parts = this.props.session.split('x');
        const data = await SessionAPI.timeline(parts[2]);
        console.log('timeline events : ' + this.props.session, data);
        const marks = {}

        data.events.forEach((e) => {
            const t = e.time;
            if (!marks[t] && e.type !== 'move' && e.type !== 'frame') {
                marks[t] = {
                    label: '' // formatTime(t - data.start)
                }
            }
        });

        this.setState({
            events: data.events,
            marks: marks,
            start: data.start,
            end: data.end
        })

    }
    onChangeSlider(value: number) {
        console.log('on change slider ', value);
    }
    setTime(time: number) {
        this.slider.setState({
            value: this.state.start + time
        });
    }

    onPlay(button: any) {
        console.log('on play ! ');
        this.props.onPlay();
    }
    onPause(button: any) {
        this.props.onPause();
    }
    public isSkipping = false;
    
    getNextTime(now) {
        let { events } = this.state;
        const first = events[0];
        const last = events[events.length - 1];
        // const skipEvents = ['view', 'frame', 'resize'];
        // let actions = events.filter((e) => skipEvents.indexOf(e.type) === -1);

        const nowInEvents = first.time + now;
        const next = filterByTime(events, nowInEvents, last.time);
        const nextAction = next[0];
        if (nextAction) {
            const nextActionInSec = (nextAction.time - nowInEvents) / 1000;
            if (nextActionInSec > 2) {
                return nextAction.time - first.time - 1000;
            }
        }
        return false;
    }
    eventAt(time) {
        const first = this.state.events[0];
        if (first) {
            for (let i = 0; i < this.state.events.length; i++) {
                const now = first.time + time;
                const e = this.state.events[i];
                if (e.time === now) {
                    return e;
                }
            }
        }
    }


    render() {

        const { renderer, time, skip } = this.state;
        if (!this.didSetup && renderer) {
            renderer.addListener('playing', (playing) => {
                this.isPlaying = playing;
            });
            this.didSetup = true;
        }

        if (this.isPlaying && skip) {
            const nextTime = this.getNextTime(time);
            if (nextTime) {
                this.state.renderer.pause();
                this.state.renderer.time = nextTime;
                this.state.renderer.play();
            }
        }
        const at = this.eventAt(time);
        if (this.state.events && this.state.events[0] && at) {
            // console.log('render time ' + time, this.state.events[0].time + time, at);
        }
        return <div>
            <div className="rendererContainer" ref={(ref) => this.container = ref}>
                <Slider
                    defaultValue={this.state.time}
                    handle={handle}
                    onChange={(value) => {
                        this.props.onChanged(value - this.state.start);
                    }}
                    ref={(ref) => this.slider = ref}
                    marks={this.state.marks}
                    min={this.state.start}
                    max={this.state.end}
                />
                <br />
            </div>
        </div >;
    }
    onSkip(arg0: this): void {
        this.setState({
            skip: !this.state.skip
        })
    }
}