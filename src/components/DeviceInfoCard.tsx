// src/components/DeviceInfoCard.tsx
import React from "react";

interface DeviceInfoCardProps {
  title: string;
  value: string | number;
  progress?: number;
  progressColor?: string;
}

const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({ title, value, progress, progressColor }) => (
  <div className="bg-gray-700 rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-4 text-gray-300">{value}</p>
    {progress !== undefined && (
      <div className="flex items-center mt-4">
        <div className="w-full bg-gray-600 rounded-full h-4 mr-3">
          <div
            className={`h-4 rounded-full ${progressColor || "bg-green-500"}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-300">{progress}%</span>
      </div>
    )}
  </div>
);

export default DeviceInfoCard;
