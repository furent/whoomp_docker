import React from "react";

interface UtilityFunctionsProps {
  onShowNotification: (message: string) => void;
}

const UtilityFunctions: React.FC<UtilityFunctionsProps> = ({
  onShowNotification,
}) => {
  return (
    <div className="max-w-sm bg-white rounded-lg shadow-md p-4 border mt-4">
      <h3 className="text-lg font-semibold text-gray-900">Utility Functions</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          className="text-xs bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded"
          onClick={() => onShowNotification("Get Clock Clicked")}
        >
          Get Clock
        </button>
        <button
          className="text-xs bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded"
          onClick={() => onShowNotification("Run Alarm Clicked")}
        >
          Run Alarm
        </button>
        <button
          className="text-xs bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded"
          onClick={() => onShowNotification("Run Haptics Clicked")}
        >
          Run Haptics
        </button>
        <button
          className="text-xs bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded"
          onClick={() => onShowNotification("Reboot Clicked")}
        >
          Reboot
        </button>
      </div>
    </div>
  );
};

export default UtilityFunctions;
