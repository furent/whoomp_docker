export declare class FileStreamHandler {
    private fileName;
    private writableStream;
    constructor(fileName?: string);
    /**
     * Opens a file stream for writing data.
     * @returns {Promise<boolean>}
     */
    openFileStream(): Promise<boolean>;
    /**
     * Streams data directly to the file.
     * @param {ArrayBuffer | Uint8Array | string} data - The data to stream.
     * @returns {Promise<void>}
     */
    streamData(data: ArrayBuffer | Uint8Array | string): Promise<void>;
    /**
     * Closes the file stream.
     * @returns {Promise<void>}
     */
    closeFileStream(): Promise<void>;
}
