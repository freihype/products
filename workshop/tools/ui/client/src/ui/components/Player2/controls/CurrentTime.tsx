import * as React from 'react'
import { withMediaProps } from '../decorators/with-media-props'
import { formatTime } from '../utils/format-time'
import { Typography } from '@material-ui/core';

class CurrentTime extends React.Component<any, any> {
  shouldComponentUpdate({ media }) {
    return this.props.media.currentTime !== media.currentTime
  }

  render() {
    const { media } = this.props
    return (
      <Typography color={"inherit"}>
        {formatTime(media.currentTime)}
      </Typography>
    )
  }
}

export default withMediaProps(CurrentTime)
