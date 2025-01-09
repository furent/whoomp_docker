import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const HeartRateChart = () => {
    return (_jsxs("div", { className: "mt-4", children: [_jsxs("p", { className: "text-lg", children: ["Heart Rate: ", _jsx("span", { id: "heartRate", children: "--" }), " bpm"] }), _jsxs("div", { className: "flex items-center gap-1 mb-4", children: [_jsx("label", { htmlFor: "timeLimit", className: "text-sm font-semibold", children: "Time Limit (minutes)" }), _jsx("input", { type: "number", id: "timeLimit", defaultValue: "10", min: "1", max: "60", className: "border border-gray-300 rounded-md p-1 w-12 text-sm focus:ring-2" })] }), _jsx("canvas", { id: "heartRateChart", width: "400", height: "200" })] }));
};
export default HeartRateChart;
