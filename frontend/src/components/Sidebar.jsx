import React from "react";
import { Home, Upload, BarChart2, Compass, Settings, LogOut } from "lucide-react";

export default function Sidebar({ setPage, activePage, onLogout }) {
  const menu = [
    { name: "Dashboard", icon: <Home size={20} /> },
    { name: "Trips", icon: <Compass size={20} /> },
    { name: "Upload Receipt", icon: <Upload size={20} /> },
    { name: "Reports", icon: <BarChart2 size={20} /> },
    { name: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-md h-full flex flex-col py-6">
      <div className="px-6 mb-8">
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          SmartSpend
        </span>
      </div>
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {menu.map((item) => (
            <li key={item.name}>
              <button
                className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg transition-all ${
                  activePage === item.name || (item.name === "Trips" && activePage === "TripDetails")
                    ? "bg-blue-50 text-blue-700 font-semibold" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                onClick={() => setPage(item.name)}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {/* Logout Button */}
      <div className="px-4 mt-auto pt-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
