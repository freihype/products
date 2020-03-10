export class Beacon {
    constructor(
        public version: number,
        public jsTime: number,
        public startTime: number,
        public endTime: number,
        public sequenceNumber?: number,
        public payload?: string,
        public type?: string) {
    }
}
