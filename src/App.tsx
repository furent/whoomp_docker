import React, { useState, useEffect } from "react";
import { connectToWhoop, disconnectFromWhoop, sendToggleRealtime } from "./whoomp";
import "./App.css";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [deviceVersion, setDeviceVersion] = useState<{ harvard: string; boylston: string } | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isWorn, setIsWorn] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string>("");

  const [heartRateData, setHeartRateData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      borderWidth: number;
      pointRadius: number;
      pointStyle: string;
      fill: boolean;
      tension: number;
    }[];
  }>({
    labels: [],
    datasets: [
      {
        label: "Heart Rate (bpm)",
        data: [],
        borderColor: "#3B82F6", // Tailwind's blue-500
        borderWidth: 2,
        pointRadius: 0,
        pointStyle: "line",
        fill: false,
        tension: 0.2,
      },
    ],
  });

  // Function to handle incoming notifications
  const handleNotification = (message: string) => {
    console.log("Notification received:", message);
    setNotification(message);
    // Auto-hide after 2.5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  // Function to handle incoming logs
  const handleLog = (message: string) => {
    console.log("Log received:", message);
    setTerminalLogs((prevLogs) => prevLogs + message + "\n");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectFromWhoop({
          onDisconnect: () => {
            setIsConnected(false);
            console.log("Disconnected from WHOOP on unmount");
          },
        });
      }
    };
  }, [isConnected]);

  // Function to handle connection and setup callbacks
  const handleConnect = async () => {
    console.log("Connect button clicked");
    if (!isConnected) {
      setLoading(true);
      setErrorMessage(null); // Reset any previous errors
      console.log("Attempting to connect to WHOOP...");
      const success = await connectToWhoop({
        onConnectSuccess: () => {
          console.log("Connection successful");
          setIsConnected(true);
          setLoading(false);
        },
        onConnectFailure: (error) => {
          console.error("Connection failed:", error);
          setLoading(false);
          setErrorMessage(`Failed to connect: ${error.message}`);
        },
        onDisconnect: () => {
          console.log("Disconnected from WHOOP");
          setIsConnected(false);
          setLoading(false);
        },
        onBatteryUpdate: (level) => {
          console.log("Battery level updated:", level);
          setBatteryLevel(level);
        },
        onVersionUpdate: (harvard, boylston) => {
          console.log("Device version updated:", harvard, boylston);
          setDeviceVersion({ harvard, boylston });
        },
        onChargingStatusUpdate: (charging) => {
          console.log("Charging status updated:", charging);
          setIsCharging(charging);
        },
        onWristStatusUpdate: (worn) => {
          console.log("Wrist status updated:", worn);
          setIsWorn(worn);
        },
        onClockUpdate: (unix) => {
          console.log("Clock updated:", unix);
          setCurrentTime(unix);
        },
        onHeartRateUpdate: (rate) => {
          console.log("Heart rate updated:", rate);
          setHeartRate(rate);
          updateHeartRateChart(rate);
        },
        onNotification: handleNotification,
        onLog: handleLog,
      });

      if (success) {
        console.log("connectToWhoop returned true");
      } else {
        console.log("connectToWhoop returned false");
      }
    } else {
      console.log("Attempting to disconnect from WHOOP...");
      setLoading(true);
      const success = await disconnectFromWhoop({
        onDisconnect: () => {
          console.log("Disconnection successful");
          setIsConnected(false);
          setLoading(false);
        },
      });

      if (success) {
        console.log("disconnectFromWhoop returned true");
      } else {
        // This will now only execute if an actual error occurred during disconnection
        console.error("disconnectFromWhoop returned false");
        setErrorMessage("Failed to disconnect properly.");
        setLoading(false);
      }
      
    }
  };

  // Function to handle toggling real-time heart rate
  const handleToggleRealtime = async () => {
    console.log("Toggle real-time heart rate clicked");
    if (isConnected) {
      await sendToggleRealtime();
      setIsRealtimeActive(!isRealtimeActive);
      console.log(`Real-time heart rate ${!isRealtimeActive ? "started" : "stopped"}`);
    } else {
      alert("Please connect to WHOOP first.");
    }
  };

  // Function to update heart rate chart
  const updateHeartRateChart = (rate: number) => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setHeartRateData((prevData) => {
      const newLabels = [...prevData.labels, timeLabel];
      const newData = [...prevData.datasets[0].data, rate];

      // Limit the number of data points
      const timeLimitSeconds = 60 * 100; // 100 minutes
      if (newLabels.length > timeLimitSeconds) {
        newLabels.shift();
        newData.shift();
      }

      return {
        ...prevData,
        labels: newLabels,
        datasets: [
          {
            ...prevData.datasets[0],
            data: newData,
          },
        ],
      };
    });
  };

  return (
    <div className="bg-black min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-4xl font-extrabold text-white">WHOOMP</h1>
          <p className="text-gray-300 mt-2">
            Control and monitor your WHOOP strap via Bluetooth Low Energy (BLE).
          </p>
        </header>

        {/* Notifications */}
        {notification && (
          <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-500">
            {notification}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
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

        {/* Device Information */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Battery Level */}
            <div className="bg-gray-700 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-white">Battery Level</h3>
              <div className="flex items-center mt-4">
                <div className="w-full bg-gray-600 rounded-full h-4 mr-3">
                  <div
                    className={`h-4 rounded-full ${
                      batteryLevel !== null
                        ? batteryLevel < 20
                          ? "bg-red-500"
                          : batteryLevel < 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-gray-500"
                    }`}
                    style={{ width: `${batteryLevel !== null ? batteryLevel : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {batteryLevel !== null ? `${batteryLevel.toFixed(1)}%` : "Loading..."}
                </span>
              </div>
            </div>

            {/* Device Version */}
            <div className="bg-gray-700 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-white">Device Version</h3>
              <p className="mt-4 text-gray-300">
                {deviceVersion ? `${deviceVersion.harvard} / ${deviceVersion.boylston}` : "Loading..."}
              </p>
            </div>

            {/* Charging Status */}
            <div className="bg-gray-700 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-white">Charging Status</h3>
              <p
                className={`mt-4 text-sm font-semibold ${
                  isCharging ? "text-green-500" : "text-red-500"
                }`}
              >
                {isCharging ? "Charging" : "Not Charging"}
              </p>
            </div>

            {/* Wrist Status */}
            <div className="bg-gray-700 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-white">Wrist Status</h3>
              <p
                className={`mt-4 text-sm font-semibold ${
                  isWorn ? "text-green-500" : "text-red-500"
                }`}
              >
                {isWorn ? "On" : "Off"}
              </p>
            </div>

            {/* Current Time */}
            <div className="bg-gray-700 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-white">Current Time</h3>
              <p className="mt-4 text-gray-300">
                {currentTime ? new Date(currentTime * 1000).toLocaleString() : "Loading..."}
              </p>
            </div>

            {/* Heart Rate */}
            <div className="bg-gray-700 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-white">Heart Rate</h3>
              <p className="mt-4 text-gray-300">
                {heartRate !== null ? `${heartRate} BPM` : "Loading..."}
              </p>
            </div>
          </div>
        )}

        {/* Heart Rate Chart */}
        {isConnected && (
          <div className="bg-gray-700 rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Heart Rate Chart</h3>
            <Line
              data={heartRateData}
              options={{
                responsive: true,
                animation: false,
                plugins: {
                  tooltip: {
                    enabled: true,
                    mode: "index",
                    intersect: false,
                    callbacks: {
                      label: function (context: any) {
                        return `Heart Rate: ${context.raw} bpm`;
                      },
                    },
                  },
                  legend: {
                    display: false,
                  },
                },
                hover: {
                  mode: "index",
                  intersect: false,
                },
                scales: {
                  x: {
                    display: true,
                    title: {
                      display: true,
                      text: "Time",
                      color: "#fff",
                    },
                    ticks: {
                      color: "#fff",
                    },
                    grid: {
                      color: "#444",
                    },
                  },
                  y: {
                    display: true,
                    title: {
                      display: true,
                      text: "Heart Rate (bpm)",
                      color: "#fff",
                    },
                    ticks: {
                      color: "#fff",
                    },
                    grid: {
                      color: "#444",
                    },
                    beginAtZero: false,
                    suggestedMin: 50,
                    suggestedMax: 120,
                  },
                },
              }}
              className="text-white"
            />
          </div>
        )}

        {/* Terminal Logs */}
        {terminalLogs && (
          <div className="bg-gray-700 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Terminal Logs</h3>
            <div className="max-h-60 overflow-auto bg-gray-900 text-green-400 p-4 rounded">
              <pre>{terminalLogs}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
