export class AsyncQueue<T> {
    private queue: T[];
    private resolvers: ((value: T) => void)[];

    constructor(){
        this.queue = [];
        this.resolvers = [];
    }

    enqueue(item: T): void {
        if(this.resolvers.length > 0) {
            const resolve = this.resolvers.shift();
            if (resolve) resolve(item);
        } else {
            this.queue.push(item);
        }
    }

    async dequeue(): Promise<T> {
        if (this.queue.length > 0) {
            return this.queue.shift() as T;
        } else {
            return new Promise<T>(resolve => this.resolvers.push(resolve));
        }
    }

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    size(): number {
        return this.queue.length;
    }

}
