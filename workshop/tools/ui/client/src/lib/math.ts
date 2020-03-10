/**
 * Returns the kth q-quantile.
 * @link http://en.wikipedia.org/wiki/Quantile#Quantiles_of_a_population
 * ie: median is 1st 2-quantile
 * ie: upper quartile is 3rd 4-quantile
 * @return {Number} q-quantile of values.
 */
const quantile = (arr: number[], i: number, n: number) => {
    if (i === 0) return Math.min.apply(null, arr);
    if (i === n) return Math.max.apply(null, arr);

    let sorted = arr.slice(0);
    sorted.sort((a, b) => a - b);
    let index = sorted.length * i / n;

    if (index % 1 === 0) {
        return 0.5 * sorted[index - 1] + 0.5 * sorted[index];
    }

    return sorted[~~index];
};

export const median = (arr: number[]) => quantile(arr, 1, 2);

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export const mean = (arr: number[]) => sum(arr) / arr.length;


// sqare errors along mean
const sdiff = (arr: number[], mean: number) => arr.map((v) =>
    Math.pow(v - mean, 2)
);

export const standardDeviation = (arr: number[]) =>
    Math.sqrt(mean(sdiff(arr, mean(arr))));
