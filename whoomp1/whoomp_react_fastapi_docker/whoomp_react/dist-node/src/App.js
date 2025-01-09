import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Header from "./components/Header";
import Buttons from "./components/Buttons";
import DeviceInfo from "./components/DeviceInfo";
import UtilityFunctions from "./components/UtilityFunctions";
import HeartRateChart from "./components/HeartRateChart";
import Notification from "./components/Notification";
import TerminalLog from "./components/TerminalLog";
const App = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isRealtimeActive, setIsRealtimeActive] = useState(false);
    const [notification, setNotification] = useState("");
    const [terminalLogs, setTerminalLogs] = useState([]);
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleToggleRealtime = () => setIsRealtimeActive((prev) => !prev);
    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(""), 2500);
    };
    const logToTerminal = (message) => {
        setTerminalLogs((prevLogs) => [...prevLogs, message]);
    };
    return (_jsx("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800", children: _jsxs("div", { className: "w-full max-w-4xl bg-white rounded-lg shadow-lg p-8 space-y-6", children: [_jsx(Header, {}), _jsx(Buttons, { isConnected: isConnected, onConnect: handleConnect, onDisconnect: handleDisconnect, onToggleRealtime: handleToggleRealtime, isRealtimeActive: isRealtimeActive }), notification && _jsx(Notification, { message: notification }), isConnected && (_jsxs(_Fragment, { children: [_jsx(DeviceInfo, { version: "1.0.0", wristStatus: "On", charging: "Yes", batteryLevel: 75 }), _jsx(UtilityFunctions, { onShowNotification: showNotification }), _jsx(HeartRateChart, {}), _jsx(TerminalLog, { logs: terminalLogs })] }))] }) }));
};
export default App;
