// components/Button.tsx
import React from "react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, disabled, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-white font-semibold py-2 px-6 rounded shadow-md transition duration-200 ease-in-out ${
        className ? className : ""
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );
};

export default Button;
