import * as React from 'react';
import { Renderer } from './Player/Renderer';
import { SessionPlayer } from './Player2/SessionPlayer';

type SessionReplayProps = {
    selected: string;
    visitor: string;
}

export class SessionReplay extends React.Component<SessionReplayProps, {
    time: number,
    selected: string
}> {
    constructor(props) {
        super(props);
        this.state = {
            time: 0,
            selected: props.selected
        }
    }
    public state = { time: 0, selected: null };
    public rendererComponent: Renderer;

    componentWillMount() {
        document.title = 'Session Player';
    }

    async componentWillReceiveProps(nextProps) {
        if (nextProps.selected !== this.props.selected) {
            this.setState({
                selected: null
            });
            setTimeout(() => {
                this.setState({
                    selected: nextProps.selected
                });
            }, 10);
        }
    }
    render() {
        return this.state.selected ?
            <div id="sessionReplay">
                <SessionPlayer showOverlay={true} showChart={false} autoPlay={(location.href.indexOf('autoplay=false') === -1)} visitor={this.props.visitor} session={this.state.selected} {...this.props} />
            </div > : ''
    }
}