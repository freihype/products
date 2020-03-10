import * as React from 'react'
import * as PropTypes from 'prop-types'
import contextTypes from './context-types'
import requestFullscreen from './utils/request-fullscreen'
import exitFullscreen from './utils/exit-fullscreen'
import fullscreenChange from './utils/fullscreen-change'
import Player from './Player';
enum EMEDIA_EVENTS {
  onPlay = 'isPlaying',
  onPause = 'isPlaying',
  onDuration = 'duration',
  onProgress = 'progress',
  onTimeUpdate = 'currentTime',
  onMute = 'isMuted',
  onVolumeChange = 'volume',
  onError = 'onError',
  onEvents = 'events'
}

export class Media extends React.Component<any, {
  currentTime: number,
  progress: number,
  duration: number,
  volume: number,
  isLoading: boolean,
  isPlaying: boolean,
  isMuted: boolean,
  isFullscreen: boolean,
  owner: any,
  skipInactivity: boolean
}> {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  }

  static childContextTypes = contextTypes

  public state = {
    currentTime: 0,
    progress: 0,
    duration: 0.1,
    volume: 1,
    isLoading: true,
    isPlaying: false,
    isMuted: false,
    isFullscreen: false,
    owner: null,
    skipInactivity: true
  }

  _isMounted = true;
  _playerProps = {};
  _lastVolume = 0;
  currentTime: number = 0;
  progress: number = 0;
  duration: number = 0.1;
  volume: number = 1;
  isLoading: boolean = true;
  isPlaying: boolean = false;
  isMuted: boolean = false;
  isFullscreen: boolean = false;
  owner: any;
  player: any;

  _player: any; // this is set by ref(Session.tsx)

  getChildContext() {
    return {
      media: this._getPublicMediaProps(),
      _mediaSetters: {
        setPlayer: this._setPlayer,
        setPlayerProps: this._setPlayerProps,
        setPlayerState: this._setPlayerState,
      },
      _mediaGetters: {
        getPlayerEvents: this._getPlayerEvents(),
      }
    }
  }

  init() {
    this._isMounted = true
    fullscreenChange('add', this._handleFullscreenChange)
  }

  componentWillUnmount() {
    this._isMounted = false
    fullscreenChange('remove', this._handleFullscreenChange)
  }

  _getPublicMediaProps() {
    return {
      ...this.state,
      play: this.play,
      pause: this.pause,
      playPause: this.playPause,
      skipInactivity: this.skipInactivity,
      stop: this.stop,
      seekTo: this.seekTo,
      skipTime: this.skipTime,
      mute: this.mute,
      muteUnmute: this.muteUnmute,
      setVolume: this.setVolume,
      addVolume: this.addVolume,
      fullscreen: this.fullscreen,
      player: this._player,
      owner: this.props.owner
    }
  }

  _getPlayerEvents() {
    const events = {}
    Object.keys(EMEDIA_EVENTS).forEach(key => {
      const stateKey = EMEDIA_EVENTS[key]
      const handlePropCallback = () => {

        const propCallback = this._playerProps[key];
        if (typeof propCallback === 'function') {
          propCallback(this.state)
        }
      }

      events[key] = val => {
        if (stateKey) {
          if (this._isMounted) {
            const state = {

            };
            state[stateKey] = val;
            this.setState(state, handlePropCallback)
          }
        } else {
          handlePropCallback()
        }
      }
    })
    return events
  }

  _setPlayer = component => {
    this._player = component;
    // console.log('set player', this)
  }

  _setPlayerProps = props => {
    this._playerProps = props;
  }

  _setPlayerState = state => {
    this.setState(state)
  }

  play = () => {
    return this._player.play()// session.tsx
  }

  pause = () => {
    this._player.pause()
  }

  skipInactivity(skip: boolean) {
    this.player.setState({ skipInactivity: skip });
  }

  playPause = () => {
    if (!this.state.isPlaying) {
      return this.play()
    } else {
      this.pause()
    }
  }

  stop = () => {
    this._player.stop()
  }

  seekTo = currentTime => {
    this._player.seekTo(currentTime)
    this.setState({ currentTime })
  }

  skipTime = amount => {
    const { currentTime, duration } = this.state
    let newTime = currentTime + amount
    if (newTime < 0) {
      newTime = 0
    } else if (newTime > duration) {
      newTime = duration
    }
    this.seekTo(newTime)
  }

  mute = isMuted => {
    if (!this._player) {
      return;
    }
    if (isMuted) {
      this._lastVolume = this.state.volume
      this._player.setVolume(0)
    } else {
      const volume = this._lastVolume > 0 ? this._lastVolume : 0.1
      this._player.setVolume(volume)
    }
    this._player.mute(isMuted)
  }

  muteUnmute = () => {
    this.mute(!this.state.isMuted)
  }

  setVolume = volume => {
    const isMuted = volume <= 0
    if (isMuted !== this.state.isMuted) {
      this.mute(isMuted)
    } else {
      this._lastVolume = volume
    }
    this._player.setVolume(volume)
  }

  addVolume = amount => {
    let newVolume = this.state.volume + amount * 0.01
    if (newVolume < 0) {
      newVolume = 0
    } else if (newVolume > 1) {
      newVolume = 1
    }
    this.setVolume(newVolume)
  }

  fullscreen = () => {
    /*
    if (!this.state.isFullscreen) {
      this._player.node[requestFullscreen]()
    } else {
      document[exitFullscreen]()
    }*/
  }

  _handleFullscreenChange = ({ target }) => {
    if (target === this._player.node) {
      this.setState({ isFullscreen: !this.state.isFullscreen })
    }
  }

  render() {
    const { children } = this.props
    if (typeof children === 'function') {
      return children(this._getPublicMediaProps())
    }
    return React.Children.only(children)
  }
}