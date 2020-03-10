import * as React from 'react';
import { Renderer } from './Renderer';
import { IRenderer } from './types';
// import 'rc-slider/assets/index.css';
import { default as Slider, Handle } from 'rc-slider';
import { default as Tooltip } from 'rc-tooltip';

import { SessionAPI } from './SessionAPI';
import moment = require('moment');
import { filterByTime, eventAt, nextFrom } from '../../../shared';

const fa = require('@fortawesome/fontawesome-free/js/all');

const style = { width: '90%', margin: 10, paddingLeft: 10, marginRight: 20 };
const playerControlsStyle = { margin: '4px', padding: '2px' };
const playerControlButton = { margin: '4px', padding: '2px' };


const PrevTrack = (props) => (
    <svg width="10px" height="12px" viewBox="0 0 10 12" {...props}>
        <polygon fill="#FAFBFB" points="10,0 2,4.8 2,0 0,0 0,12 2,12 2,7.2 10,12" />
    </svg>
)

const NextTrack = (props) => (
    <svg width="10px" height="12px" viewBox="0 0 10 12" {...props}>
        <polygon fill="#FAFBFB" points="8,0 8,4.8 0,0 0,12 8,7.2 8,12 10,12 10,0" />
    </svg>
)

function log(value) {
    console.log(value);
}

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

const formatTime = (ts: number) => {
    return moment(ts).format('mm:ss');
    const d = new Date(ts);
    return d.getMinutes() + ':' + d.getSeconds();
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
        // console.log('timeline events : ' + this.props.session, data);
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

    render() {

        const { renderer, time, skip } = this.state;
        if (!this.didSetup && renderer) {
            renderer.addListener('playing', (playing) => {
                this.isPlaying = playing;
            });
            this.didSetup = true;
        }

        if (this.isPlaying && skip) {
            const nextTime = nextFrom(time, this.state.events);
            if (nextTime) {
                this.state.renderer.pause();
                this.state.renderer.time = nextTime;
                this.state.renderer.play();
            }
        }
        // const at = eventAt(time, this.state.events);
        // <!--div>{formatTime(this.state.time)}</div-->
        return <div>
            <div className="rendererContainer" ref={(ref) => this.container = ref}>
                {/**
                <div style={style}>
                    {<div style={playerControlsStyle} className="playerControls">
                        <span onClick={(e) => this.onPlay(this)} style={playerControlButton}>
                            <span style={playerControlButton} className={"fa fa-backward"}></span>
                        </span>
                        <span onClick={(e) => this.onPlay(this)} style={playerControlButton}>
                            <span style={playerControlButton} className={"fa fa-play"}></span>
                        </span>
                        <span onClick={(e) => this.onPause(this)} style={playerControlButton}>
                            <span style={playerControlButton} className={"fa fa-pause"}></span>
                        </span>
                        <span onClick={(e) => this.onPlay(this)} style={playerControlButton}>
                            <span style={playerControlButton} className={"fa fa-forward"}></span>
                        </span>

                        <span onClick={(e) => this.onSkip(this)} style={playerControlButton}>
                            <span style={playerControlButton} className={this.state.skip ? "fa fa-toggle-on" : "fa fa-toggle-off"}></span>
                        </span>

                    </div>
            **/}
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