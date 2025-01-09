/**
 * Displays a notification with customizable text for a few seconds.
 * @param {string} message - The notification message to display.
 */
export declare function showNotification(message: string): void;
export declare function logToTerminal(message: string): void;
export declare function hideElements(hide: boolean): void;
export declare function updateDeviceVersion(harvard: string, boylston: string): void;
export declare function updateWristStatus(isWorn: boolean): void;
export declare function updateChargingStatus(charging: boolean): void;
export declare function updateBattery(batteryLevel: number): void;
export declare function updateClock(unixTimestamp: number): void;
export declare function createHeartRateChart(): void;
export declare function updateHeartStatus(isRealtimeActive: boolean): void;
export declare function updateHeartRate(heartRate: number): void;
export declare function updateTime(event: Event): void;
