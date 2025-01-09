import { jsx as _jsx } from "react/jsx-runtime";
const Header = () => {
    return (_jsx("header", { className: "text-6xl font-mono font-extrabold mb-8", children: _jsx("a", { target: "_blank", rel: "noopener noreferrer", className: "hover:underline text-blue-600", children: "Whoomp There It Is!" }) }));
};
export default Header;
