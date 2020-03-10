let cache = {};
let u;

function buildFn(fn) {
    return cache[fn] = new Function('item', 'index', 'array', fn); // Function
}
function everyOrSome(some) {
    let every = !some;
    return function (a, fn, o?: any) {
        let i = 0;
        let l = a && a.length || 0;
        let result;
        if (l && typeof a == 'string') { a = a.split(''); }

        if (typeof fn == 'string') {
            fn = cache[fn] || buildFn(fn);
        }
        if (o) {
            for (; i < l; ++i) {
                result = !fn.call(o, a[i], i, a);
                if (some ^ result) {
                    return !result;
                }
            }
        } else {
            for (; i < l; ++i) {
                result = !fn(a[i], i, a);
                if (some ^ result) {
                    return !result;
                }
            }
        }
        return every; // Boolean
    };
}

export const every = everyOrSome(false)
export const some = everyOrSome(true);

export * from './GeomUtils';
export * from './StyleArray';
