import * as moment from 'moment';
const operators = {
    or: predicates => row => predicates.reduce((acc, predicate) => acc || predicate(row), false),
    and: predicates => row => predicates.reduce((acc, predicate) => acc && predicate(row), true),
};

const toLowerCase = value => String(value).toLowerCase();

export const operationPredicates = {
    contains: (value, filter) => {
        // console.log('contains', value);
        return toLowerCase(value).indexOf(toLowerCase(filter.value)) > -1;
    },
    notContains: (value, filter) => toLowerCase(value).indexOf(toLowerCase(filter.value)) === -1,
    startsWith: (value, filter) => toLowerCase(value).startsWith(toLowerCase(filter.value)),
    endsWith: (value, filter) => toLowerCase(value).endsWith(toLowerCase(filter.value)),
    equal: (value, filter) => value === filter.value,
    notEqual: (value, filter) => value !== filter.value,
    greaterThan: (value, filter) => value > filter.value,
    greaterThanOrEqual: (value, filter) => value >= filter.value,
    lessThan: (value, filter) => value < filter.value,
    lessThanOrEqual: (value, filter) => value <= filter.value,
    after: (value, filter) => value > filter.value,
    before: (value, filter) => value < filter.value,
    atLeast: (value, filter) => {
        let d = new Date(null);
        d.setSeconds(value);
        let eD: Date = filter.value;
        let e = new Date(null);
        e.setSeconds(eD.getSeconds());
        e.setMinutes(eD.getMinutes());
        const duration = moment.duration(moment(d).diff(moment(e)));
        return duration.asSeconds() > 0;
    },
    atMost: (value, filter) => {
        let d = new Date(null);
        d.setSeconds(value);
        let eD: Date = filter.value;
        let e = new Date(null);
        e.setSeconds(eD.getSeconds());
        e.setMinutes(eD.getMinutes());
        const duration = moment.duration(moment(d).diff(moment(e)));
        return duration.asSeconds() < 0;
    },
    has: (value, filter) => {
        return value.find((v) =>
            v.indexOf(filter.value) !== -1
        ) != null

    },
    hasNot: (value, filter) => value.indexOf(filter.value) === -1
};

export const defaultFilterPredicate = (value, filter) => {
    const operation = filter.operation || 'greaterThanOrEqual';
    return operationPredicates[operation](value, filter);
};

const buildPredicate = (
    initialFilterExpression,
    getCellValue,
    getColumnPredicate,
) => {

    // console.log('build - predicate ', initialFilterExpression);
    const getSimplePredicate = (filterExpression) => {
        const { columnName } = filterExpression;
        const customPredicate = getColumnPredicate && getColumnPredicate(columnName);
        const predicate = customPredicate || defaultFilterPredicate;
        return row => predicate(getCellValue(row, columnName), filterExpression, row);
    };

    const getOperatorPredicate = (filterExpression) => {
        const build = operators[toLowerCase(filterExpression.operator)];
        // eslint-disable-next-line no-use-before-define
        return build && build(filterExpression.filters.map(getPredicate));
    };

    const getPredicate = filterExpression => getOperatorPredicate(filterExpression) || getSimplePredicate(filterExpression);

    return getPredicate(initialFilterExpression);
};


export const filteredRows = (
    rows,
    filterExpression,
    getCellValue,
    getColumnPredicate?
) => {
    if (!(filterExpression && Object.keys(filterExpression).length && rows.length)) {
        return { rows };
    }

    const predicate = buildPredicate(
        filterExpression,
        getCellValue,
        getColumnPredicate,
    );

    return { rows: rows.filter(predicate) };
};

export const filteredCollapsedRowsGetter = (
    { collapsedRowsMeta },
) => row => collapsedRowsMeta && collapsedRowsMeta.get(row);

export const unwrappedFilteredRows = ({ rows }) => rows;
