export declare class AsyncQueue<T> {
    private queue;
    private resolvers;
    constructor();
    enqueue(item: T): void;
    dequeue(): Promise<T>;
    isEmpty(): boolean;
    size(): number;
}
