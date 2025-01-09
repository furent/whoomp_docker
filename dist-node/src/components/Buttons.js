import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const Buttons = ({ isConnected, onConnect, onDisconnect, onToggleRealtime, isRealtimeActive, }) => {
    return (_jsx("div", { className: "flex items-center space-x-2 mb-4", children: !isConnected ? (_jsx("button", { onClick: onConnect, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded", children: "Connect WHOOP" })) : (_jsxs(_Fragment, { children: [_jsx("button", { onClick: onDisconnect, className: "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded", children: "Disconnect" }), _jsx("button", { onClick: onToggleRealtime, className: `${isRealtimeActive ? "bg-yellow-500" : "bg-green-500"} hover:bg-green-700 text-white font-bold py-2 px-4 rounded`, children: isRealtimeActive ? "Stop Realtime" : "Start Realtime" })] })) }));
};
export default Buttons;
