import * as it from './iterator';
// tslint:disable-next-line:interface-name
export interface Hash<T> {
	[ id: string ]: T;
}
// tslint:disable-next-line:interface-name
export interface List<T> {
	[index: number]: T;
	length: number;
}
/**
 * Interface of the simple literal object with any string keys.
 */
export interface IObjectLiteral {
	[key: string]: any;
}

export type JSONPathExpression = string;