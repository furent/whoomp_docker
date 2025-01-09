import React from "react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => (
  <header className="mb-6">
    <h1 className="text-4xl font-extrabold text-white">{title}</h1>
    <p className="text-gray-300 mt-2">{subtitle}</p>
  </header>
);

export default Header;
