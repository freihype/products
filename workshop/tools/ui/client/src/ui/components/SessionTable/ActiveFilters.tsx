import * as React from 'react';
import { getMessagesFormatter } from '@devexpress/dx-core';
import {
    Template,
    TemplatePlaceholder,
    Plugin,
    TemplateConnector,
} from '@devexpress/dx-react-core';

const pluginDependencies = [
    { name: 'Toolbar' },
    { name: 'SearchState' },
];

const defaultMessages = {
    searchPlaceholder: 'Search...',
};

export class ActiveFilters extends React.PureComponent<any, any> {
    render() {
        return (
            <Plugin>
                <Template name="toolbarContent">
                    <TemplatePlaceholder />
                    <TemplateConnector>
                        {
                            (
                                { columns, hiddenColumnNames, isColumnTogglingEnabled },
                                { toggleColumnVisibility },
                            ) => {
                                // console.log('columns', columns, hiddenColumnNames);
                                return <React.Fragment></React.Fragment>
                            }
                        }
                    </TemplateConnector>
                </Template>
            </Plugin>
        );
    }
}
