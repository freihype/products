import { ConnectDragSource, XYCoord, DragLayer, DragDropContextProvider, DragSource, DragSourceConnector, DragSourceMonitor, ConnectDragPreview } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import * as React from 'react';
export enum ItemTypes {
    CARD = 'card'
}
const layerStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
}

export const style: React.CSSProperties = {
    border: '1px dashed gray',
    backgroundColor: 'transparent',
    paddingLeft: '5px',
    paddingRight: '5px',
    marginRight: '1.5rem',
    marginBottom: '1.5rem',
    cursor: 'move',
    float: 'left',
    height: '20px'
}
export const styleD: React.CSSProperties = {
    border: '1px dashed gray',
    backgroundColor: 'transparent',
    // padding: '0.5rem 1rem',
    paddingLeft: '5px',
    marginRight: '1.5rem',
    marginBottom: '1.5rem',
    cursor: 'move',
    float: 'left',
    pointerEvents: 'none'
}

const styles2 = {
    display: 'inline-block',
    transform: 'rotate(-7deg)',
    WebkitTransform: 'rotate(-7deg)',
}
function snapToGrid(x: number, y: number) {
    const snappedX = Math.round(x / 32) * 32
    const snappedY = Math.round(y / 32) * 32
    return [snappedX, snappedY]
}
export interface CustomDragLayerProps {
    item?: any
    itemType?: string
    initialOffset?: XYCoord
    currentOffset?: XYCoord
    isDragging?: boolean
    snapToGrid: boolean
}

function getItemStyles(props: CustomDragLayerProps) {
    const { initialOffset, currentOffset } = props
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        }
    }

    let { x, y } = currentOffset

    if (props.snapToGrid) {
        x -= initialOffset.x;
        y -= initialOffset.y;
        [x, y] = snapToGrid(x, y);
        x += initialOffset.x;
        y += initialOffset.y;
    }

    const transform = `translate(${x}px, ${y}px)`
    return {
        transform,
        WebkitTransform: transform,
    }
}

export interface BoxDragPreviewProps {
    title: string
}

export interface BoxDragPreviewState {
    tickTock: any
}

export class BoxDragPreview extends React.PureComponent<BoxDragPreviewProps, BoxDragPreviewState> {
    private interval: any

    constructor(props: BoxDragPreviewProps) {
        super(props)
        this.tick = this.tick.bind(this)
        this.state = {
            tickTock: false,
        }
    }

    public componentDidMount() {
        this.interval = setInterval(this.tick, 500)
    }

    public componentWillUnmount() {
        clearInterval(this.interval)
    }

    public render() {
        const { title } = this.props
        const { tickTock } = this.state

        return (
            <div style={styles2}>
                {title}
            </div>
        )
    }

    private tick() {
        this.setState({
            tickTock: !this.state.tickTock,
        })
    }
}

@DragLayer<CustomDragLayerProps, {}, CustomDragLayer, {}>(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
}))

export class CustomDragLayer extends React.Component<CustomDragLayerProps> {
    public renderItem(type: any, item: any) {
        switch (type) {
            case ItemTypes.CARD:
                return <BoxDragPreview title={item.title} />
            default:
                return null
        }
    }

    public render() {
        const { item, itemType, isDragging } = this.props;

        if (!isDragging) {
            return null
        }

        return (
            <div style={layerStyles}>
                <div style={getItemStyles(this.props)}>
                    {this.renderItem(itemType, item)}
                </div>
            </div>
        )
    }
}

export interface BoxProps {
    name: string
    isDragging?: boolean
    connectDragSource?: ConnectDragSource
}
