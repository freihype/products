/**
 * Merge two styleArray structures set1 and set2 such that set2 overrides values in set1
 */
export const mergeStyleArrays = (set1, set2) => {
    if (!set1) {
        set1 = [];
    }
    if (!set2) {
        set2 = [];
    }
    const oldValues = [ ...set1 ];
    // Remove properties from oldValues that are in set1
    for (let i = 0; i < set2.length; i++) {
        // tslint:disable-next-line:forin
        for (const name1 in set2[i]) {	// should only have one property
            for (let j = oldValues.length - 1; j >= 0; j--) {
                const oldItem = oldValues[j];
                for (const name2 in oldItem) {	// should only have one property
                    if (name1 == name2) {
                        oldValues.splice(j, 1);
                        break;
                    }
                }
            }
        }
    }
    //FIXME: need to sort values, taking shorthands into account
    const newValues = oldValues.concat(set2);
    return newValues;
}
