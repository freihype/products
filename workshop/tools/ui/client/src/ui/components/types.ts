
export interface IEvented {
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    emit(event: string | symbol, ...args: any[]): boolean;
}