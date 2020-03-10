export const stopEvent = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
}
