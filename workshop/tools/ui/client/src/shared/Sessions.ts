import { capitalize } from "./Formatter";
import * as userAgent from 'useragent';
import { keyOf } from "../lib";
import * as moment from 'moment';
export const SessionValuePaths = {
    os: 'tags.agent.os.family',
    browser: 'tags.agent.family',
    email: 'tags.email',
    country: 'tags.location.country_name',
    pages: 'values.pages',
    user: 'tags.user'
}
export const SessionValuesFilter = {
    pages: (config, values) => {
        values.pages = values.pages.map((p) => p.replace(config.root, ''));
        return values;
    }
}
export const SessionValueDefaults = {
    os: 'Unknown',
    email: 'Unknown'
}
const EventStatistics = ['viewCount', 'clicks', 'errors', 'moves', 'inputs'];
const EventSources = ['pages', 'clicked', 'errorMessages', 'input'];
const TimeProperties = ['start', 'duration'];
const SourceProperties = ['referer', 'tags.location.country_name', 'tags.ip'];
const BrowserProperties = ['tags.agent.family', 'tags.agent.mobile', 'tags.agent.os.family'];
const UserProperties = ['tags.user', 'tags.email', 'tags.name'];
const APIProperties = ['tag'];

export let FilterTypeMap = {
    pages: 'array',
    errorMessages: 'array',
    errors: 'number',
    duration: 'time',
    start: 'date',
    tag: 'jsonpath'
};
const durationHumanized = (date: Date) => {
    let moment1 = moment(date);
    let now = new Date(Date.now());
    now.setDate(date.getDate());

    now.setHours(date.getHours());
    let moment2 = moment(now);
    const d = moment.duration(moment1.diff(moment2));
    console.log('d', d);
    return d.humanize(false);
}

const durationHumanized2 = (date: Date) => {
    return moment(date).format('mm:ss');
    return `${date.getMinutes()}:${date.getSeconds()}`;
}
export let FilterValueFormatter = {
    start: (value) => new Date(value).toDateString(),
    duration: (value) => durationHumanized2(value),
    end: (value) => new Date(value).toDateString(),
    pages: (value) => `'${value}'`
}
export const FilterGroups = [
    { label: 'Event Statistics', items: EventStatistics },
    { label: 'Event Sources', items: EventSources },
    { label: 'Times', items: TimeProperties },
    { label: 'Location', items: SourceProperties },
    { label: 'Technology', items: BrowserProperties },
    { label: 'User', items: UserProperties },
    // { label: 'API', items: APIProperties }
]

export const FilterLabelMap = {
    'tags.ip': 'IP Address',
    'os': 'Operating System',
    'clicked': 'Did click element',
    'errorMessages': 'Had error',
    'input': 'Entered text',
    'viewCount': 'Number of views',
    'clicks': 'Number of clicks',
    'errors': 'Number of errors',
    'tags.agent.family': 'Browser',
    'tags.agent.mobile': 'Is Mobile',
    'tags.agent.os.family': 'OS',
    'tags.email': 'Email',
    'tags.user': 'User',
    'tags.name': 'User name',
    'pages': 'Visited pages',
    'tags.location.country_name': 'Country',
    'start': 'Date',
    'tag': 'Tag'
}


EventStatistics.forEach((p) => FilterTypeMap[p] = 'number');
// TimeProperties.forEach((p) => FilterTypeMap[p] = 'date');
UserProperties.forEach((p) => FilterTypeMap[p] = 'string');
SourceProperties.forEach((p) => FilterTypeMap[p] = 'string');
BrowserProperties.forEach((p) => FilterTypeMap[p] = 'string');
export const createColumn = (property) => {
    return {
        header: FilterLabelMap[property] || capitalize(property),
        accessor: property,
        dataType: FilterTypeMap[property] || 'string'
    };
}
export const getColumn = (val) => {
    return columns().find((p) => {
        return p.accessor === val;
    })
}

export const columns = () => {
    return [
        ...EventStatistics,
        ...TimeProperties,
        ...SourceProperties,
        ...BrowserProperties,
        ...UserProperties
    ].map(createColumn)
}

export interface UserTags {
    user: string;
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar: string;
}

export type BrowserTag = userAgent.Agent & {
    mobile: boolean;
}

export type Tags = UserTags & {
    agent: BrowserTag;
}
export interface ISession {
    session: string;
    status: string;
    referer: string;
    visit: string;
    clicks: number;
    moves: number;
    inputs: number;
    errors: number;
    viewCountr: number;
    duration: number;
    tags: Tags;
    start: number;
    end: number;
    errorMessages: string[]
}
export const defaultMessages = {
    filterPlaceholder: 'Filter...',
    contains: 'Contains',
    notContains: 'Does not contain',
    startsWith: 'Starts with',
    endsWith: 'Ends with',
    equal: 'Equals',
    notEqual: 'Does not equal',
    greaterThan: 'Greater than',
    greaterThanOrEqual: 'Greater than or equal to',
    lessThan: 'Less than',
    before: 'Is before',
    after: 'Is after',
    lessThanOrEqual: 'Less than or equal to',
    has: 'Has',
    hasNot: 'Has not',
    atLeast: 'At least',
    atMost: 'At most',
};

export const defaultOperands = {
    number: keyOf(defaultMessages, defaultMessages.greaterThanOrEqual),
    string: keyOf(defaultMessages, defaultMessages.contains),
    array: keyOf(defaultMessages, defaultMessages.has),
    time: keyOf(defaultMessages, defaultMessages.atLeast),
    date: keyOf(defaultMessages, defaultMessages.after)
};
const defaultDuration = () => {
    const d = new Date();
    d.setHours(24);
    d.setMinutes(0);
    d.setSeconds(20);
    return d;
}
export const defaultOperandsValue = {
    number: 0,
    string: '',
    time: defaultDuration(),
    date: Date.now()
};
