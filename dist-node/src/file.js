export class FileStreamHandler {
    fileName;
    writableStream;
    constructor(fileName = "data_stream.bin") {
        this.fileName = fileName;
        this.writableStream = null;
    }
    /**
     * Opens a file stream for writing data.
     * @returns {Promise<boolean>}
     */
    async openFileStream() {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: this.fileName,
                types: [
                    {
                        description: 'Binary Files',
                        accept: { 'application/octet-stream': ['.bin'], 'text/plain': ['.txt'] }
                    }
                ]
            });
            this.writableStream = await fileHandle.createWritable();
            console.log(`File stream opened for: ${this.fileName}`);
            return true;
        }
        catch (error) {
            console.error(`Error opening file stream: ${error}`);
            return false;
        }
    }
    /**
     * Streams data directly to the file.
     * @param {ArrayBuffer | Uint8Array | string} data - The data to stream.
     * @returns {Promise<void>}
     */
    async streamData(data) {
        if (!this.writableStream) {
            console.error(`File stream not opened. Call openFileStream() first.`);
            return;
        }
        try {
            // Ensure data is in the correct format before writing
            if (typeof data === "string") {
                data = new TextEncoder().encode(data); // Convert string to binary
            }
            await this.writableStream.write(data);
            console.log(`Data streamed to ${this.fileName} successfully.`);
        }
        catch (error) {
            console.error(`Error streaming data: ${error}`);
        }
    }
    /**
     * Closes the file stream.
     * @returns {Promise<void>}
     */
    async closeFileStream() {
        if (this.writableStream) {
            try {
                await this.writableStream.close();
                this.writableStream = null;
                console.log(`File stream closed for: ${this.fileName}`);
            }
            catch (error) {
                console.error(`Error closing file stream: ${error}`);
            }
        }
        else {
            console.warn(`No open stream to close for: ${this.fileName}`);
        }
    }
}
