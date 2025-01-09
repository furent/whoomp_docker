import React from "react";

const TopBar: React.FC = () => {
  return (
    <div className="topbar">
      <div className="text-xl font-bold">Whoomp App</div>
      <nav className="flex space-x-6">
        <a href="#home" className="hover:text-white transition duration-300">
          Home
        </a>
        <a href="#about" className="hover:text-white transition duration-300">
          About
        </a>
        <a href="#contact" className="hover:text-white transition duration-300">
          Contact
        </a>
      </nav>
    </div>
  );
};

export default TopBar;
