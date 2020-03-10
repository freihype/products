
import { default as Slider, Handle } from 'rc-slider';
import 'rc-slider/assets/index.css';
import { default as Tooltip } from 'rc-tooltip';
import * as React from 'react';
import { formatTime } from '../../../../shared';
import { withMediaProps } from '../decorators/with-media-props';
import { Media } from '../Media';
import Session from '../vendors/Session';
import './slider.scss';
const fa = require('@fortawesome/fontawesome-free/js/all');

type ISeekBarProps = Partial<{
  media: Media,
  className: string;
  style: any
}>;
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


const toSliderMarks = (events: any[]) => {
  const marks = {}

  events.forEach((e) => {
    const t = e.time;
    if (!marks[t] && (e.type === 'click' || e.type === 'view')) {
      marks[t] = {
        label: '' // formatTime(t - data.start)
      }
    }
  });
  return marks;
}


class SeekBar extends React.Component<ISeekBarProps, any> {
  _isPlayingOnMouseDown = false
  _onChangeUsed = false
  slider: Slider;
  marks: any;

  shouldComponentUpdate({ media }) {
    return (
      this.props.media.currentTime !== media.currentTime ||
      this.props.media.duration !== media.duration
    )
  }

  _handleMouseDown = () => {
    this._isPlayingOnMouseDown = this.props.media.isPlaying
    this.props.media.pause()
  }

  _handleMouseUp = ({ target: { value } }) => {
    // seek on mouseUp as well because of this bug in <= IE11
    // https://github.com/facebook/react/issues/554
    if (!this._onChangeUsed) {
      this.props.media.seekTo(+value)
    }

    // only play if media was playing prior to mouseDown
    if (this._isPlayingOnMouseDown) {
      this.props.media.play()
    }
  }

  _handleChange = (value) => {
    this.props.media.seekTo(+value)
    this._onChangeUsed = true
  }


  getMarks(events: any[]) {
    if (this.marks) {
      return this.marks;
    }
    this.marks = toSliderMarks(events);
    return this.marks;
  }
  setTime(time: number) {
    if (this.slider) {
      setTimeout(() => {
        if (this.slider) {
          this.slider.setState({
            value: time
          });
        }
      }, 10);
    }
  }
  render() {
    const { media } = this.props;
    const { currentTime, player } = media;
    const session: Session = player;
    if (session && session.state.events) {
      const { start, end, events } = session.state;
      this.setTime(start + (currentTime * 1000));
      return <Slider
        handle={handle}
        onChange={(value) => this._handleChange((value - start) / 1000)}
        ref={(ref) => this.slider = ref}
        marks={this.getMarks(events)}
        min={start}
        max={end}
      />
    } else {
      return <div></div>;
    }
  }
}

export default withMediaProps(SeekBar)
