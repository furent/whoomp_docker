import React from "react";

const HeartRateChart: React.FC = () => {
  return (
    <div className="mt-4">
      <p className="text-lg">Heart Rate: <span id="heartRate">--</span> bpm</p>
      <div className="flex items-center gap-1 mb-4">
        <label htmlFor="timeLimit" className="text-sm font-semibold">
          Time Limit (minutes)
        </label>
        <input
          type="number"
          id="timeLimit"
          defaultValue="10"
          min="1"
          max="60"
          className="border border-gray-300 rounded-md p-1 w-12 text-sm focus:ring-2"
        />
      </div>
      <canvas id="heartRateChart" width="400" height="200"></canvas>
    </div>
  );
};

export default HeartRateChart;
