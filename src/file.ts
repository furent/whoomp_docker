export class FileStreamHandler {
    private fileName: string;
    private dataChunks: Uint8Array[];

    constructor(fileName: string = "historical_data_stream.bin") {
        this.fileName = fileName;
        this.dataChunks = [];
    }

    /**
     * Streams data by accumulating it in memory.
     * @param {ArrayBuffer | Uint8Array | string} data - The data to stream.
     */
    streamData(data: ArrayBuffer | Uint8Array | string): void {
        if (typeof data === "string") {
            data = new TextEncoder().encode(data); // Convert string to binary
        }

        if (data instanceof ArrayBuffer) {
            data = new Uint8Array(data);
        }

        this.dataChunks.push(data as Uint8Array);
        console.log(`Accumulated ${data.byteLength} bytes. Total chunks: ${this.dataChunks.length}`);
    }

    /**
     * Triggers a download of the accumulated data as a binary file.
     */
    triggerDownload(): void {
        if (this.dataChunks.length === 0) {
            console.warn("No data to download.");
            return;
        }

        const blob = new Blob(this.dataChunks, { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileName;
        a.click();
        URL.revokeObjectURL(url);
        console.log(`Download triggered for ${this.fileName}. Total size: ${blob.size} bytes.`);
    }

    /**
     * Returns the number of data chunks accumulated.
     * @returns {number} The count of data chunks.
     */
    getDataChunksCount(): number {
        return this.dataChunks.length;
    }
}
