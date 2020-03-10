import * as PropTypes from "prop-types";
import * as React from 'react';
import contextTypes from './context-types';
import getVendor from './utils/get-vendor';
import { Media } from "./Media";

export interface IPlayerProps {
  className: string;
  src: string;
  loop: boolean;
  autoPlay: boolean;

  defaultCurrentTime?: number;
  defaultVolume?: number;
  defaultMuted?: boolean;

  vendor?: string;
  onEnded?: (media: Media) => void;
  onReady?: (renderer?: any) => void;
  onPlay?: (renderer?: any) => void;
  onPause?: (renderer?: any) => void;
  onEvents?: (renderer?: any) => void;
  owner?: any;
  height: number;
  width: number;
  visitor: string;
};

class Player extends React.Component<IPlayerProps, any> {
  static propTypes = {
    vendor: PropTypes.oneOf(['sr']),
    defaultCurrentTime: PropTypes.number,
    defaultVolume: PropTypes.number,
    defaultMuted: PropTypes.bool,
  }

  static defaultProps = {
    defaultCurrentTime: 0,
    defaultVolume: 1,
    defaultMuted: false
  }

  static contextTypes = contextTypes

  _defaultsSet = false
  _component: any;

  componentWillMount() {
    const {
      defaultCurrentTime,
      defaultMuted,
      defaultVolume,
      ...restProps
    } = this.props

    this._setPlayerProps({ volume: defaultVolume, ...restProps })

    this._setPlayerState({
      currentTime: defaultCurrentTime,
      volume: defaultMuted ? 0 : defaultVolume,
    })

    // we need to unset the loading state if no source was loaded
    if (!this.props.src) {
      this._setLoading(false)
    }
  }

  componentWillUpdate(nextProps) {
    this._setPlayerProps(nextProps)

    // clean state if the media source has changed
    if (this.props.src !== nextProps.src) {
      this._setPlayerState({
        currentTime: 0,
        progress: 0,
        duration: 0,
        isLoading: true,
        isPlaying: false
      })
    }
  }

  get instance() {
    return this._component && this._component.instance
  }

  _setPlayer = component => {
    this.context._mediaSetters.setPlayer(component)
    this._component = component
  }

  _setPlayerProps(props) {
    this.context._mediaSetters.setPlayerProps(props)
  }

  _setPlayerState(state) {
    this.context._mediaSetters.setPlayerState(state)
  }

  _setDefaults() {
    const { media } = this.context
    const { defaultCurrentTime, defaultVolume, defaultMuted } = this.props
    if (defaultCurrentTime > 0) {
      media.seekTo(defaultCurrentTime)
    }
    if (defaultMuted) {
      media.mute(defaultMuted)
    } else if (defaultVolume !== 1) {
      media.setVolume(defaultVolume)
    }
    this._defaultsSet = true
  }

  _setLoading = isLoading => {
    this.context._mediaSetters.setPlayerState({ isLoading })
  }

  _handleOnReady = () => {
    const { media } = this.context;
    const { autoPlay, onReady } = this.props;
    if (!this._defaultsSet) {
      this._setDefaults()
    } else {
      media.mute(media.isMuted)
      media.setVolume(media.volume)
    }

    if (autoPlay) {
      media.play()
    }

    this._setLoading(false)

    if (typeof onReady === 'function') {
      onReady(media)
    }
  }

  _handleOnEnded = () => {
    const { media, _mediaSetters } = this.context
    const { loop, onEnded } = this.props
    if (loop) {
      media.seekTo(0)
      media.play()
    } else {
      _mediaSetters.setPlayerState({ isPlaying: false })
    }
    if (typeof onEnded === 'function') {
      onEnded(media)
    }
  }

  componentWillUnmount() {
    // this._setPlayer(null)
  }
  render() {
    const {
      src,
      visitor,
      vendor: _vendor,
      autoPlay,
      onReady,
      onEnded,
      defaultCurrentTime,
      defaultVolume,
      defaultMuted,
      owner,
      ...extraProps
    } = this.props

    const { vendor, component } = getVendor(src, _vendor);

    return React.createElement(component as any, {
      src,
      visitor,
      width: this.props.width,
      height: this.props.height,
      vendor,
      autoPlay,
      extraProps,
      ref: this._setPlayer,
      isLoading: this._setLoading,
      onReady: this._handleOnReady,
      onEnded: this._handleOnEnded,
      ...this.context._mediaGetters.getPlayerEvents,
    })
  }
}

export default Player
