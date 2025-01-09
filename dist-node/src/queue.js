export class AsyncQueue {
    queue;
    resolvers;
    constructor() {
        this.queue = [];
        this.resolvers = [];
    }
    enqueue(item) {
        if (this.resolvers.length > 0) {
            const resolve = this.resolvers.shift();
            if (resolve)
                resolve(item);
        }
        else {
            this.queue.push(item);
        }
    }
    async dequeue() {
        if (this.queue.length > 0) {
            return this.queue.shift();
        }
        else {
            return new Promise(resolve => this.resolvers.push(resolve));
        }
    }
    isEmpty() {
        return this.queue.length === 0;
    }
    size() {
        return this.queue.length;
    }
}
