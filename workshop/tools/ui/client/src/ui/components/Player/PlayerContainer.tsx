import * as React from 'react';
import { Renderer } from './Renderer';
import { IRenderer } from './types';
import { Timeline } from './Timeline';
import { main } from '../../../renderer/main';

type PlayerContainerProps = {
    selected?: string;
}

export class PlayerContainer extends React.Component<PlayerContainerProps, {
    time: number
}> {
    public state = { time: 0 };
    public rendererComponent: Renderer;
    container: any;
    public renderer: IRenderer = main as any;
    timeline: Timeline;
    onRendererTime(time: number): any {
        this.setState({
            time: time
        })
        this.timeline.setState({
            time: time
        });
        this.timeline.setTime(time);
    }

    onLoaded(renderer: IRenderer) {
        this.renderer.addListener('time', (time: number) => this.onRendererTime(time));
        this.timeline.setState({
            time: 0,
            renderer: renderer
        })
    }

    onViews(views: any[]) {

    }

    onEvents(events: any[]) {

    }

    onSliderValueChanged(value: number) {
        // console.log('on slider changed ' + value, this.renderer['playing']);
        if (value === 0) {
            return;
        }
        let isPlaying = this.renderer['playing'];
        if (isPlaying) {
            this.renderer.pause();
            isPlaying = false;
        }
        if (!isPlaying) {
            this.renderer.time = value;
            // this.renderer.play();
        }
        // wasPlaying && this.renderer.play();
    }
    onPlay() {
        this.renderer.play();
    }
    onPause() {
        this.renderer.pause();
    }
    render() {
        return <div>
            <div className="rendererContainer" ref={(ref) => this.container = ref}>
                {/**<SessionPlayer session={this.props.selected} />**/}
                <Timeline
                    ref={(ref) => this.timeline = ref}
                    session={this.props.selected}
                    onChanged={this.onSliderValueChanged.bind(this)}
                    onPlay={this.onPlay.bind(this)}
                    onPause={this.onPause.bind(this)}
                    onNext={this.onPlay.bind(this)}
                    onPrev={this.onPlay.bind(this)}
                ></Timeline>
                <Renderer
                    renderer={this.renderer}
                    session={this.props.selected}
                    ref={(ref) => this.rendererComponent = ref}
                    onLoaded={this.onLoaded.bind(this)}
                    onError={() => { }}
                >
                </Renderer>
            </div>
        </div >;
    }
}