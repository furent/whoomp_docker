import { jsx as _jsx } from "react/jsx-runtime";
const Notification = ({ message }) => {
    return (_jsx("div", { className: "fixed bottom-4 right-4 bg-black text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg", children: message }));
};
export default Notification;
