import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const DeviceInfo = ({ version, wristStatus, charging, batteryLevel, }) => {
    return (_jsxs("div", { className: "max-w-sm bg-white rounded-lg shadow-md p-4 border", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Device Information" }), _jsxs("p", { className: "text-sm mt-2", children: ["Version: ", _jsx("span", { children: version })] }), _jsxs("p", { className: "text-sm mt-2", children: ["Wrist: ", _jsx("span", { children: wristStatus })] }), _jsxs("p", { className: "text-sm mt-2", children: ["Charging: ", _jsx("span", { children: charging })] }), _jsxs("p", { className: "text-sm mt-2", children: ["Battery Level: ", _jsxs("span", { children: [batteryLevel, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 mt-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: `${batteryLevel}%` } }) })] }));
};
export default DeviceInfo;
