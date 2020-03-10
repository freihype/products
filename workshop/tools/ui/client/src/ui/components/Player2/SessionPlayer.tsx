import * as Highcharts from "highcharts";
import * as React from 'react';
import { SizeMe } from 'react-sizeme';
import CurrentTime from './controls/CurrentTime';
import Duration from './controls/Duration';
import MuteUnmute from './controls/MuteUnmute2';
import PlayPause from './controls/PlayPause3';
import Progress from './controls/Progress';
import Repeat from './controls/Repeat';
import SeekBar from './controls/SeekBar';
import Chart from '@material-ui/icons/BarChart';
import Mouse from '@material-ui/icons/Mouse';
import Chart2 from '@material-ui/icons/BarChartTwoTone';
import Skip from './controls/Skip';
import './main.scss';
import { Media } from './Media';
import Player from './Player';
import { getChart } from './SessionChart';
import { keyboardControls } from './utils/keyboard-controls';
import { IconButton } from "@material-ui/core";

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

export class SessionPlayer extends React.Component<any, any> {
  window: Window = window;
  chart: any;
  state: any = { zoom: 1, showChart: false, showOverlay: true }
  constructor(props) {
    super(props);
    this.state = { zoom: 1, showChart: props.showChart, showOverlay: props.showOverlay };
  }
  onChangeZoom(val) {
    console.log('on changed zoom : ', val);
    this.setState({
      zoom: val
    })
  }

  _handlePrevTrack = () => {
    if (this.props.owner.onPrev) {
      this.props.owner.onPrev();
    }
  }

  _handleNextTrack = () => {
    // this.props.onNextTrack();
    if (this.props.owner.onNext) {
      this.props.owner.onNext();
    }
  }

  _handleRepeatTrack = () => {
    // this.props.onRepeatTrack();
    this.setState({
      repeat: !this.state.repeat
    })
  }

  _handleChart() {
    this.hideChart(!this.state.showChart ? 200 : 0);
    this.setState({
      showChart: !this.state.showChart
    });
  }

  _handleOverlay() {
    this.setState({
      showOverlay: !this.state.showOverlay
    });
  }

  _handleEnded = (media) => {
    if (media.isPlaying && this.props.owner.onNext) {
      this.props.owner.onNext();
    }
  }
  _handleOnReady = (media: Media) => {
    this.media = media;
    if (this.props.owner.onPlayerReady) {
      this.props.owner.onPlayerReady(media);
    }
  }
  _handleOnEvents = (media: any, player) => {
    player.owner.setState({
      events: media.events,
      player: player
    });
    // player.owner.navigation.forceUpdate();
    this.setState({
      events: media.events
    })
  }
  media: any;
  pauseButton: HTMLElement;
  playButton: HTMLElement;
  player: Player;
  chartRoot: HTMLDivElement;
  _handleOnPlay(args) {

    const isPlaying = args.isPlaying;
    let el = isPlaying ? this.playButton : this.pauseButton;
    // el.className = el.className + '.animated';
    if (el.className.indexOf('animated') !== -1) {
      el.className = el.className.replace('animated', '');
      el.className = el.className.trim()
    }

    el.className = el.className + ' animated';
    setTimeout(() => {
      el.className = el.className.replace('animated', '');
      el.className = el.className.trim();
    }, 1500);

  }
  controlRoot: HTMLDivElement;
  private _getBoundingClientRect(elem: HTMLElement): { top: number; left: number } {
    if (typeof elem.getBoundingClientRect !== 'function') {
      return { top: 0, left: 0 };
    }
    const { top, left } = elem.getBoundingClientRect();
    return { top, left };
  }

  setChartRoot(chartRoot, width, events) {
    if (chartRoot && !this.chart && this.state.showChart !== false) {
      // console.log('got session events : ', events);
      this.chart = getChart(chartRoot, width, events);
    }
  }
  hideChart(height) {
    if (!height && this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.chart && (this.chart as Highcharts.ChartObject).setSize(null, height);
  }
  updateChart(width) {
    if (this.chart) {
      (this.chart as Highcharts.ChartObject).setSize(width, 160);
    }
  }

  render() {
    const { repeatTrack, visitor, session, owner, showControls } = this.props;
    const { repeat, showChart, showOverlay } = this.state;
    let overLay: any = document.querySelector('div.rendererContainer > div > div:nth-child(1)');
    if (overLay) {
      overLay.style.display = showOverlay ? 'inherit' : 'none';
    }
    const self = this;
    return (
      <SizeMe monitorHeight={true}>
        {({ size }) => {
          let height; let width;
          width = size.width;
          if (owner.navigationRoot && this.controlRoot && owner.navigationRoot.parentElement) {
            const sessionReplayRoot = document.getElementsByClassName('sessionReplayRoot')[0] as HTMLElement;
            width = sessionReplayRoot.offsetWidth - owner.navigationRoot.offsetWidth;
            height = window.innerHeight;
            height -= this.controlRoot.offsetHeight;
            // const re = this._getBoundingClientRect(this.controlRoot);
            height -= this._getBoundingClientRect(this.controlRoot).top;
          } else {
            if (size.height > 100) {
              height = size.height;
            }
            if (size.width > 100) {
              width = size.width;
            }
          }
          // console.log('zoom ', this.state.zoom, width, height, ref);
          showChart !== false && this.updateChart(width);
          return <Media owner={owner}>
            {
              mediaProps =>
                <div
                  className={'media-player' + (mediaProps.isFullscreen ? ' media-player--fullscreen' : '')}
                  onKeyDown={keyboardControls.bind(null, mediaProps)}
                  tabIndex={0}
                  style={{ width: width + 'px' }}
                >
                  {showControls !== false ?
                    <div ref={(ref) => this.controlRoot = ref} className="media-controls media-controls--full">
                      <div className="media-control-group media-control-group--seek" style={{ padding: '0px 16px' }}>
                        <Progress className="media-control media-control--progress" />
                        <SeekBar className="media-control media-control--seekbar" />
                      </div>
                      <div className="media-row">
                        <div className="media-control-group">
                          <PrevTrack className="media-control media-control--prev-track" onClick={this._handlePrevTrack} />
                          <PlayPause className="media-control media-control--play-pause" />
                          <NextTrack className="media-control media-control--next-track" onClick={this._handleNextTrack} />
                          <MuteUnmute className="media-control media-control--mute-unmute" />
                          <CurrentTime className="media-control media-control--current-time" /> &nbsp;/ &nbsp; <Duration className="media-control media-control--duration" />
                        </div>
                        {/**
                      <div className="media-control-group" style={{ marginRight: '16px' }}>
                        <Typography color={"textPrimary"} style={{ marginRight: '16px' }} >Zoom {this.state.zoom}x</Typography>
                        <SliderO onChange={(e) => this.onChangeZoom(e)} />
                      </div>
                      **/}
                        <div className="media-control-group" style={{ marginRight: '16px' }}>
                          {/**
                        <Typography style={{ marginRight: '16px' }} >Speed 1x</Typography>
                        <SliderO />
                        **/}
                          <IconButton color={showChart ? "secondary" : "inherit"} onClick={this._handleChart.bind(this)}>
                            {
                              showChart ? <Chart /> : <Chart2 />
                            }
                          </IconButton>
                          <IconButton color={showOverlay ? "inherit" : "secondary"} onClick={this._handleOverlay.bind(this)}>
                            {
                              <Mouse />
                            }
                          </IconButton>
                          <Skip className="media-control media-control--next-track" onClick={this._handleNextTrack} />
                          <Repeat
                            className="media-control media-control--repeat"
                            isActive={repeat}
                            onClick={this._handleRepeatTrack}
                          />
                        </div>
                      </div>


                      <div className="media-row">
                        {this.state && this.state.events ?
                          <div ref={(ref) => { this.setChartRoot(ref, size.width - 8, this.state.events) }} className="media-control-group" id="chart">
                          </div> : ''
                        }
                      </div>
                    </div> : ''
                  }

                  <div style={{ overflow: 'hidden' }} className="media-player-element2"
                    onClick={() => mediaProps.playPause()} >
                    <div className="play-button" ref={(ref) => this.playButton = ref}>
                      <div className="play-button-bg">
                        <div className="icon-wrapper">
                          <i className="fa fa-play" style={{ fontSize: '40px' }}>
                          </i>
                        </div>
                      </div>
                    </div>
                    <div className="pause-button" ref={(ref) => this.pauseButton = ref}>
                      <div className="pause-button-bg">
                        <div className="icon-wrapper">
                          <i className="fa fa-pause" style={{ fontSize: '40px' }}></i>
                        </div>
                      </div>
                    </div>

                    <Player
                      ref={(ref) => this.player = ref}
                      className={"player"}
                      src={session}
                      visitor={visitor}
                      loop={repeatTrack}
                      autoPlay={this.props.autoPlay}
                      onEnded={this._handleEnded}
                      onReady={(args) => self._handleOnReady(args)}
                      onEvents={(args) => self._handleOnEvents(args, mediaProps)}
                      onPlay={this._handleOnPlay.bind(this)}
                      onPause={this._handleOnPlay.bind(this)}
                      owner={owner}
                      height={height ? height * this.state.zoom : height}
                      width={width ? width * this.state.zoom : width}
                    />

                  </div>

                </div>
            }
          </Media>
        }
        }
      </SizeMe>
    )
  }
}