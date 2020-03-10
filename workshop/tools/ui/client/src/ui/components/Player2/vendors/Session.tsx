import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { default as vendorPropTypes } from './vendor-prop-types';
import { IRenderer } from '../../Player/types';
import { create } from '../../../../renderer/main';
import { Renderer } from '../../Player/Renderer';
import { SessionAPI } from '../../Player/SessionAPI';
import { filterByTime } from '../../../../shared';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { head, last } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
const ErrorComponent = (e) => <div style={{ width: '100%', height: '400px', margin: '0 auto', padding: 24 }}>
  <Paper className={'error'} elevation={10}>
    <Typography variant="h5" component="h1" style={{ padding: '20px' }} color="error" >
      An Error occured
      </Typography>
    <Typography component="code" style={{ padding: '20px' }} color="textSecondary">
      {e.message}
    </Typography>
  </Paper>
</div>
export default class Session extends React.Component<{
  src: string,
  visitor: string,
  onPlay: (playing: boolean) => void;
  onPlaying: (playing: boolean) => void;
  onPause: (paused: boolean) => void;
  onProgress: (val: number) => void;
  onDuration: (val: number) => void;
  onTimeUpdate: (val: number) => void;
  onEnded: (loading: boolean) => void;
  onError: (...e) => void;
  onMute: (muted: boolean) => void;
  isLoading: (loading: boolean) => void;
  onVolumeChange: (val: number) => void;
  onReady: (renderer?: any) => void;
  onEvents: (data: any) => void;
  height: number;
  width: number;
  autoPlay: boolean;
}, any> {

  static propTypes = vendorPropTypes;
  state: any = { skipInactivity: true, isPlaying: true, events: [], duration: 0 }

  _isReady = false;
  _isMounted = false;
  _progressId = null;
  _timeUpdateId = null;
  _any: any;

  public renderer: IRenderer;

  _playerStopped: any;
  isPlaying: boolean = true;
  firedLoaded: boolean = false;
  window: Window;
  name: string = 'SessionVendor';
  time: number;
  async componentWillMount() {

    // this.renderer = create() as any;
    this.window = window;
    const parts = this.props.src.split('x');
    const data = await SessionAPI.timeline(parts[2]);
    if (data && data.error) {
      this._handleError(data);
      return;
    }
    const state = {
      renderer: create() as any,
      events: data.events,
      start: data.start,
      end: data.end,
      duration: (data.end - data.start) / 1000
    }

    this.setState(state);
    this.props.onDuration(this.state.duration);
    this.props.onEvents(data);
    window['SE'] = data.events;
  }

  async componentWillReceiveProps(nextProps) {
    if (nextProps.src !== this.props.src) {
      // console.log('new src!');
      return;
      this.window = window;
      const parts = nextProps.src.split('x');
      const data = await SessionAPI.timeline(parts[2]);
      if (data && data.error) {
        this._handleError(data);
        return;
      }
      const state = {
        renderer: create() as any,
        events: data.events,
        start: data.start,
        end: data.end,
        duration: (data.end - data.start) / 1000
      }


      this.setState(state);
      if (this._isReady) {
        // this.props.onReady(this.renderer)
      }
    }
  }

  play() {
    this.state.renderer.play();
    this.props.onPlay(true)
  }

  pause() {
    this.state.renderer.pause();
    this.props.onPause(false);
  }

  stop() {
    this.state.renderer.pause();
  }

  seekTo(currentTime) {
    // console.log('seek to ' + currentTime);
    this.state.renderer['time'] = currentTime * 1000;
  }

  mute(muted) {
    this.props.onMute(muted)
    this.props.onVolumeChange(muted ? 0 : 1)
  }

  setVolume(volume) {
    this.props.onVolumeChange(+volume)
  }

  _handleProgress = () => {
    if (!this._isMounted) return;
    const progress = 0;
    this.props.onProgress(progress);
    if (this._progressId && progress < 1) {
      this._progressId = requestAnimationFrame(this._handleProgress);
    }
  }

  _handleTimeUpdate = () => {
    if (!this._isMounted) return;
    this.props.onTimeUpdate(0);
    if (this._timeUpdateId) {
      this._timeUpdateId = requestAnimationFrame(this._handleTimeUpdate)
    }
  }
  onRendererTime(time: number): any {
    this.time = time;
    setTimeout(() => {
      this.props.onTimeUpdate((time / 1000));
    });
    if ((time / 1000) === this.state.duration) {
      this.props.onProgress(time / 1000);
      this.props.onPause(false);
      // console.log('on ended ' + this.isPlaying);
      this._handleEnded(this.isPlaying);
    }
  }
  _handleCanPlay = () => { }
  _handlePlay = () => {
    this.props.onPlay(true)
  }
  _handleEnded = (isPlaying) => {
    setTimeout(() => {
      this.props.onEnded(isPlaying);
    }, 100);
  }
  _handlePause = () => {
    console.log('handle pause');
    this.props.onPause(false)
  }
  _isNotLoading = () => {
    console.log('is not loading');
    this.props.isLoading(false)
  }
  _isLoading = () => {
    console.log('is laoding');
    this.props.isLoading(true)
  }
  _handleError(e) {
    if (this._playerStopped) {
      this._playerStopped = false
    } else {
      this.props.onError(e);
    }
    this.setState({ error: e });
  }
  _handleDuration = ({ target: { duration } }) => {
    this.props.onDuration(duration)
  }

  componentWillUnmount() {
    this.state.renderer && this.state.renderer.destroy();
    this.state.renderer = null;
    this.renderer = null;
    this._isMounted = false
    if (this._progressId) {
      cancelAnimationFrame(this._progressId)
    }
    if (this._timeUpdateId) {
      cancelAnimationFrame(this._timeUpdateId)
    }

  }
  onPlaying(playing) {
    this.isPlaying = playing;
    this.props.onDuration(this.state.duration);
    playing ? this.props.onPlay(true) : this.props.onPause(false);
    if (!this.firedLoaded) {
      this.firedLoaded = true;
      this.props.onReady(this.state.renderer);
    }
  }
  onLoaded() {
    if (this._isMounted) {
      return;
    }
    this._isMounted = true;
    if (this.state.renderer.addListener) {
      this.state.renderer.addListener('time', this.onRendererTime.bind(this));
      this.state.renderer.addListener('playing', this.onPlaying.bind(this));
    } else {
      console.error('have no renderer');
    }
  }

  componentDidMount() {
    this.setState({
      parent: ReactDOM.findDOMNode(this).parentNode
    })
  }

  getNextTime(now) {
    let { events } = this.state;
    const first = head<any>(events);
    const _last = last<any>(events)
    const nowInEvents = first.time + now;
    const next = filterByTime(events, nowInEvents, _last.time);
    const nextAction = next[0];
    if (nextAction) {
      const nextActionInSec = (nextAction.time - nowInEvents) / 1000;
      if (nextActionInSec > 1) {
        return nextAction.time - first.time - 1000;
      }
    }
    return false;
  }
  render() {
    // console.log('render session', this);
    const parent = this.state.parent;
    if (this.state.error) {
      return ErrorComponent(this.state.error);
    }
    if (parent && this.isPlaying && this.time && this.state.skipInactivity && this.state.events) {
      const nextTime = this.getNextTime(this.time);
      if (nextTime) {
        setTimeout(() => {
          this.state.renderer.time = nextTime;
        });
      }
    }
    if (this.state.renderer) {
      this.renderer = this.state.renderer;
    }
    return parent && this.state.renderer ? <Renderer
      renderer={this.state.renderer}
      session={this.props.src}
      visitor={this.props.visitor}
      autoPlay={this.props.autoPlay}
      onLoaded={this.onLoaded.bind(this)}
      onError={this._handleError.bind(this)}
      size={{ width: this.props.width, height: this.props.height }}
    ></Renderer>
      : <div> </div>;
  }

}


