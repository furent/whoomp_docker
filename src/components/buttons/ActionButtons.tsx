// src/components/ActionButtons.tsx
import React from "react";

interface ActionButtonsProps {
  isConnected: boolean;
  isRealtimeActive: boolean;
  loading: boolean;
  handleConnect: () => void;
  handleToggleRealtime: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isConnected,
  isRealtimeActive,
  loading,
  handleConnect,
  handleToggleRealtime,
}) => (
  <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`${
        isConnected ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
      } text-white font-semibold py-2 px-6 rounded shadow-md transition duration-200 ease-in-out disabled:opacity-50`}
    >
      {loading ? "Processing..." : isConnected ? "Disconnect" : "Connect WHOOP"}
    </button>

    <button
      onClick={handleToggleRealtime}
      disabled={!isConnected}
      className={`${
        isRealtimeActive ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
      } text-white font-semibold py-2 px-6 rounded shadow-md transition duration-200 ease-in-out disabled:opacity-50`}
    >
      {isRealtimeActive ? "Stop Heart Rate" : "Start Heart Rate"}
    </button>

    <button
      disabled={!isConnected}
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded shadow-md transition duration-200 ease-in-out disabled:opacity-50"
    >
      Download History
    </button>
  </div>
);

export default ActionButtons;
