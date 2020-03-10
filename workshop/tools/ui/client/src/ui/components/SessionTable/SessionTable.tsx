import {
    Column,
    SelectionState,
    Sorting, SortingState,
    FilteringState,
    SearchState,
    IntegratedSorting,
    PagingState,
    IntegratedPaging,
    IntegratedSelection
} from '@devexpress/dx-react-grid';
import {
    ColumnChooser, Grid,
    Table, TableColumnVisibility,
    Toolbar, TableHeaderRow,
    TableColumnResizing,
    PagingPanel,
    TableSelection
} from '@devexpress/dx-react-grid-material-ui';
import { createStyles, Input, Theme, withStyles } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import * as React from 'react';
import { formatTime } from '../../../shared';
import * as get from 'get-value';
import { SessionValuePaths, SessionValueDefaults } from '../../../shared/Sessions';
import { replaceParam } from '../../../shared/Url';
import { ActiveFilters } from './ActiveFilters';
import PersonIcon from '@material-ui/icons/PermIdentity';
import * as moment from 'moment';
import { replaceUrlParam, replaceUrlParams } from '../../../lib/url';
type SessionListProps = {
    selected?: string;
    sessions: any[]
    activeFilters?: any[];
    onSelected: (selected: any[]) => void
};
/*
const styles = ({ typography }: Theme) => createStyles({
    currency: {
        fontWeight: typography.fontWeightMedium,
    },
    numericInput: {
        width: '100%',
    },
});
*/
const mapSessions = (sessions: any[]) => {
    return sessions.map((s) => {
        s.tags = s.tags || {};
        return {
            ...s,
            ...s.tags,
            activity: s.clicks + s.moves + s.inputs + s.viewCount,
            browser: s.tags.agent ? s.tags.agent.family : ''
        }
    })
}
const columns = (): Column[] => {
    return [
        { name: 'user', title: 'User' },
        {
            name: 'email', title: 'EMail', getCellValue: (val) =>
                get(val, SessionValuePaths.email, { default: SessionValueDefaults.email })
        },
        {
            name: 'start', title: 'Date', getCellValue: (val) => {
                //
                return val;
                let moment1 = moment(val.start);
                let moment2 = moment();
                return moment.duration(moment1.diff(moment2)).humanize(true);
                // return new Date(val.start).toDateString();
            }
        },
        { name: 'duration', title: 'Duration', getCellValue: (val) => formatTime(val.duration * 1000) },
        { name: 'browser', title: 'Browser' },
        {
            name: 'os', title: 'OS', getCellValue: (val) => get(val, SessionValuePaths.os, { default: SessionValueDefaults.os })
        },
        {
            name: 'brief', title: 'Info', getCellValue: (val) => {
                return `Clicks : ${val.clicks} | Pages: ${val.viewCount} ${val.errors ? '| Errors: ' + val.errors : ''} ${val.inputs ? '| Input: ' + val.inputs : ''} `
            }
        },
        // { name: 'activity', title: 'Activity' },
        { name: 'referer', title: 'Referer' },
        { name: 'visit', title: 'Visitor' }
    ]
}

const UserCell = ({ value, ...restProps }): any => {
    const { row } = restProps;
    const ref = row.start + 'x' + row.end + 'x' + row.session;
    /*
    let newLink = replaceParam(location.href, 'selected', ref);
    newLink = replaceParam(newLink, 'app', 'play');
    newLink = replaceParam(newLink, 'visitor', row.visit);*/
    let newLink = replaceUrlParams({
        selected: ref,
        app: 'play',
        visitor: row.visit
    });
    if (row.tags.avatar) {
        return (
            <Table.Cell {...restProps as Table.DataCellProps}
                style={{ padding: '4px' }} value={''}>
                <a href={newLink} target='_blank'>
                    <img width={32} src={row.tags.avatar} />
                    <br /><span>{value}</span>
                </a>
            </Table.Cell>
        );
    }
    return (
        <Table.Cell {...restProps as Table.DataCellProps}
            style={{ padding: '4px' }} value={''}>
            <a href={newLink} target='_blank'>
                <PersonIcon />
                <br /><span style={{ textAlign: 'center' }}>{value}</span>
            </a>
        </Table.Cell>);
};

const Cell = (props) => {
    const { column, row } = props;
    if (column.name === 'start') {
        let moment1 = moment(row.start);
        let moment2 = moment();
        let val = moment.duration(moment1.diff(moment2)).humanize(true);
        return <Table.Cell {...props} value={val} />;
    }
    if (column.name === 'user') {
        return <UserCell {...props} />;
    }
    return <Table.Cell {...props} />;
};


const TableRow = ({ row, ...restProps }) => {
    return (
        <Table.Row
            {...restProps as Table.DataRowProps}
        />);
};

const Pager = ({ classes, ...restProps }) => {
    console.log('rest : ', { ...restProps });
    return <div>
        <PagingPanel.Container
            {...restProps as PagingPanel.ContainerProps}
            className={`${classes.pager} custom-pager`}
        ></PagingPanel.Container></div>;
};
const pstyles = theme => ({
    pager: {
        "& button": {
            width: 'initial',
            height: 'initial'
        }
    }
});
const comparePriority = (a, b) => {
    return (a < b) ? -1 : 1;
};
export const PagerComponent = withStyles(pstyles as any, { name: "MyPager" })(
    Pager
);
export class SessionTable extends React.Component<SessionListProps, any> {
    hiddenColumnNamesChange: (hiddenColumnNames: any) => void;
    changeSearchValue: (value: any) => void;
    changeSorting: (sorting: any) => void;
    shouldComponentUpdate(props) {
        return props.sessions.length !== this.props.sessions.length;
    }
    constructor(props) {
        super(props);
        this.state = {
            columns: columns(),
            sessions: [],
            selection: [],
            sorting: [
                { columnName: 'start', direction: 'asc' } as Sorting
            ],
            defaultHiddenColumnNames: ['referer', 'email', 'visit'],
            tableColumnExtensions: [
                { columnName: 'user', width: 80 },
                { columnName: 'start', width: 120 },
                { columnName: 'email', width: 120 },
                { columnName: 'browser', width: 120 },
                { columnName: 'os', width: 100 },
                { columnName: 'duration', width: 80 },
                { columnName: 'info', width: 'auto' },
            ],
            integratedSortingColumnExtensions: [
                { columnName: 'start', compare: comparePriority }
            ],
        };
        this.hiddenColumnNamesChange = (hiddenColumnNames) => {
            this.setState({ hiddenColumnNames });
        };

        this.changeSearchValue = value => this.setState({
            searchValue: value
        });

        this.changeSorting = sorting => this.setState({ sorting });
    }
    container: any;
    changeSelection(selection) {
        const sessions = [];
        console.log('selection : ', selection);
        selection.forEach((v, i) => {
            sessions.push(this.props.sessions[v]);
        });
        this.setState({ selection: selection });
        this.forceUpdate();
        this.props.onSelected(sessions);
    };
    handleSortChange(sorting) {
        this.setState({ sorting });
    };
    render() {
        let { tableColumnExtensions, sorting, defaultHiddenColumnNames, searchValue, selection } = this.state;
        let { sessions } = this.props;
        sessions = mapSessions(sessions);
        return (
            <Paper>
                <Grid
                    rows={sessions}
                    columns={columns()}>

                    <SearchState
                        value={searchValue}
                        onValueChange={this.changeSearchValue}
                    />
                    <FilteringState
                        columnFilteringEnabled={false}
                        defaultFilters={[]}
                    />

                    <SortingState
                        defaultSorting={sorting}
                        onSortingChange={this.changeSorting}
                    />
                    <IntegratedSorting columnExtensions={this.state.integratedSortingColumnExtensions} />

                    <SelectionState
                        selection={selection}
                        onSelectionChange={this.changeSelection.bind(this)}
                    />
                    <PagingState
                        defaultCurrentPage={0}
                        pageSize={8}
                    />
                    <IntegratedSelection />
                    <IntegratedPaging />
                    <Table cellComponent={Cell} rowComponent={TableRow} columnExtensions={tableColumnExtensions} />

                    {
                        sessions.length > 10 ? <PagingPanel containerComponent={PagerComponent as any} /> : ''
                    }

                    <TableColumnResizing />
                    <TableHeaderRow showSortingControls />
                    <TableSelection showSelectAll />
                    <TableColumnVisibility
                        defaultHiddenColumnNames={defaultHiddenColumnNames}
                        onHiddenColumnNamesChange={this.hiddenColumnNamesChange}
                        emptyMessageComponent={() => <div></div>}
                    />
                    <Toolbar />
                    <ColumnChooser />
                </Grid>
            </Paper>
        );
    }
}