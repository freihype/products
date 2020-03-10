import "../assets/css/App.css";
import { FilterTypeMap } from '../../shared';
import { PropertyFilter } from './SessionTable/types';

const flatten = (filters_: PropertyFilter[]): PropertyFilter[] => {
    let filters: any[] = [];
    filters_.forEach((f) => {
        filters.push(f);
        if (f.filter.next) {
            filters = filters.concat(f.filter.next.map((n) => {
                return {
                    prop: f.prop,
                    filter: n
                }
            }));
        }
    });
    return filters;
}

export const toFilterExpression = (filters: PropertyFilter[]) => {
    const all = flatten(filters);
    const ors = all.filter((f) => {
        return f.filter.type === 'or'
    });
    const heads = filters.map((f: PropertyFilter): PropertyFilter => {
        return {
            filter: {
                op: f.filter.op,
                value: f.filter.value
            } as any,
            prop: f.prop
        }
    })

    const ands1 = all.filter((f) => {
        return f.filter.type === 'and'
    });

    const ands = [...heads, ...ands1];

    const ret = {
        operator: 'or',
        filters: [{
            operator: 'or',
            filters: ors.map((f) => {
                return {
                    columnName: f.prop,
                    value: FilterTypeMap[f.prop] === 'number' ? parseInt(f.filter.value) : f.filter.value,
                    op: f.filter.op
                }
            })
        },
        {
            operator: 'and',
            filters: ands.map((f) => {
                return {
                    columnName: f.prop,
                    value: FilterTypeMap[f.prop] === 'number' ? parseInt(f.filter.value) : f.filter.value,
                    op: f.filter.op
                }
            })
        }
        ]
    }
    return ret;
}


