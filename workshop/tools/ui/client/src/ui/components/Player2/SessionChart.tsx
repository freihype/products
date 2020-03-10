import * as Highcharts from "highcharts";
import { setTheme } from './SessionChartTheme';
import { ISessionEvents, EventType } from "../../../shared";
import * as utils from '../../../shared';

setTheme(location.href.indexOf('dark') !== -1);

const toMouseTS = (data: ISessionEvents) => {
    const events = data.events;
    const moves = utils.filterByType('move', events);

    const first = utils.firstOf(EventType.MOVE, moves);
    let ret = [
        [0, 0]
    ];

    ret = moves.map((e, i) => {
        const distance = utils.distance(moves[i > 0 ? i - 1 : 0], e);
        return [
            (e.time - data.start),
            (1 / distance !== Infinity ? 1 / distance : 0) / 2
        ]
    });

    ret.push([(data.end - data.start), 0])
    return ret;
}
const toMouseClicksTS = (data: ISessionEvents) => {
    const events = data.events;
    const moves = utils.filterByType('click', events);
    const first = utils.firstOf(EventType.CLICK, moves);
    let ret = [
        [0, 0]
    ];

    ret = moves.map((e, i) => {
        return [
            (e.time - data.start),
            0.2
        ]
    });

    ret.push([(data.end - data.start), 0])
    return ret;
}
const toScrollTS = (data: ISessionEvents) => {
    const events = data.events;
    const moves = utils.filterByType('scroll', events);
    let ret = [
        [0, 0]
    ];

    ret = moves.map((e, i) => {
        const distance = e.payload.top + e.payload.left;
        return [
            (e.time - data.start),
            1 / distance !== Infinity ? 1 / distance : 0
        ]
    });

    ret.push([(data.end - data.start), 0])
    return ret;
}
const toInputTS = (data: ISessionEvents) => {
    const events = data.events;
    const moves = utils.filterByType('input', events);
    let ret = [
        [0, 0]
    ];

    ret = moves.map((e, i) => {
        const distance = 1;
        return [
            (e.time - data.start),
            1 / distance !== Infinity ? 1 / distance : 0
        ]
    });

    ret.push([(data.end - data.start), 0])
    return ret;
}
const toViewTS = (data: ISessionEvents) => {
    const events = data.events;
    const moves = utils.filterByType('view', events);
    let ret = [
        [0, 0]
    ];

    ret = moves.map((e, i) => {
        const distance = 1;
        return [
            (e.time - data.start),
            1 / distance !== Infinity ? 1 / distance : 0
        ]
    });

    ret.push([(data.end - data.start), 0])
    return ret;
}
export const getChart = (container, width, events: ISessionEvents) => {

    const mouse = toMouseTS(events);
    const clicks = toMouseClicksTS(events);
    const scroll = toScrollTS(events);
    const inputs = toInputTS(events);
    const views = toViewTS(events);
    let ret = Highcharts.chart(container,
        {
            chart: {
                zoomType: 'x',
                width: width - 8,
                height: 200,
                type: 'areaspline'
            },
            title: {
                text: ''
            },
            subtitle: {
                text: '',
                useHTML: false
                // 'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            },
            xAxis: {
                type: 'datetime',
                gridLineWidth: 0,
                title: {
                    text: ''
                }
            },
            yAxis: {
                title: {
                    text: ''
                },
                gridLineWidth: 0,
            },
            legend: {
                enabled: true
            },
            credits: {
                enabled: false,
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors[0]]
                            // [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            },
            series: [{
                type: 'column',
                name: 'Mouse moves',
                data: (mouse as Array<[number, number]>)
            },
            {
                type: 'column',
                name: 'Mouse clicks',
                data: (clicks as Array<[number, number]>)
            },
            {
                type: 'column',
                name: 'Scroll',
                data: (scroll as Array<[number, number]>)
            },
            {
                type: 'column',
                name: 'Input',
                data: (inputs as Array<[number, number]>)
            },
            {
                type: 'column',
                name: 'View',
                data: (views as Array<[number, number]>)
            }
            ]
        });

    setTimeout(() => {
        // ret.series[0].addPoint([715790, 2000], true, false, true);
        // ret.series[0].data[20].select(true, true);
        // ret.series[0].
    }, 3000);

    return ret;
};
