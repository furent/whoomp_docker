import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const TerminalLog = ({ logs }) => {
    return (_jsxs("div", { className: "max-w bg-white rounded-lg shadow-md p-4 border mt-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Terminal Log" }), _jsx("div", { className: "max-w-3xl bg-black text-green-400 font-mono text-sm p-4 rounded-lg mt-4 overflow-auto h-96", children: _jsx("pre", { children: logs.join("\n") }) })] }));
};
export default TerminalLog;
