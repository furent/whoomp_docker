import React from "react";
interface ButtonsProps {
    isConnected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
    onToggleRealtime: () => void;
    isRealtimeActive: boolean;
}
declare const Buttons: React.FC<ButtonsProps>;
export default Buttons;
