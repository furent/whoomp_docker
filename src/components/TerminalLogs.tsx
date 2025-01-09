import React from "react";

interface TerminalLogsProps {
  logs: string;
}

const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs }) => (
  <div className="bg-gray-700 rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold text-white mb-4">Terminal Logs</h3>
    <div className="max-h-60 overflow-auto bg-gray-900 text-green-400 p-4 rounded">
      <pre>{logs}</pre>
    </div>
  </div>
);

export default TerminalLogs;
