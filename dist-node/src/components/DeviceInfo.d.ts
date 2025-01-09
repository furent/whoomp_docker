import React from "react";
interface DeviceInfoProps {
    version: string;
    wristStatus: string;
    charging: string;
    batteryLevel: number;
}
declare const DeviceInfo: React.FC<DeviceInfoProps>;
export default DeviceInfo;
