export * from './StringUtils';
export * from './HexUtils';
export const autobind = (target, key, descriptor) => {
    const fn = descriptor.value;
    let defining = false;
    return {
        configurable: true,
        // tslint:disable-next-line:space-before-function-paren
        get: function () {
            // tslint:disable-next-line:no-invalid-this
            if (defining || (fn && this === fn.prototype) || this.hasOwnProperty(key)) {
                return fn;
            }
            // Bind method only once, and update the property to return the bound value from now on
            // tslint:disable-next-line:no-invalid-this
            const fnBound = fn && fn.bind(this);
            defining = true;
            // tslint:disable-next-line:no-invalid-this
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                enumerable: true,
                value: fnBound
            });
            defining = false;
            return fnBound;
        },
        // tslint:disable-next-line:no-any
        // tslint:disable-next-line:space-before-function-paren
        set: function (newValue) {
            // tslint:disable-next-line:no-invalid-this
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                enumerable: true,
                value: newValue
            });
        }
    };
}
