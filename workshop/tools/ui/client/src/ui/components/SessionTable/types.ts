export interface Filter {
    op: string;
    value: any;
    type?: string;
    next?: Filter[];
    visible: boolean;
}
export interface PropertyFilter {
    prop: string;
    filter: Filter;
}