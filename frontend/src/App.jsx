import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import UploadCard from "./components/UploadCard";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import Trips from "./components/Trips";
import TripDetails from "./components/TripDetails";
import Login from "./components/Login";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("Dashboard");
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setSelectedTripId(null);
    setPage("Dashboard");
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in, show login page
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  let content;
  if (page === "Dashboard") {
    content = <Dashboard />;
  } else if (page === "Trips") {
    content = (
      <Trips
        user={user}
        onSelectTrip={(id) => {
          setSelectedTripId(id);
          setPage("TripDetails");
        }}
      />
    );
  } else if (page === "TripDetails") {
    content = (
      <TripDetails
        user={user}
        tripId={selectedTripId}
        onBack={() => setPage("Trips")}
      />
    );
  } else if (page === "Upload Receipt") {
    content = <UploadCard />;
  } else if (page === "Reports") {
    content = <Reports />;
  } else if (page === "Settings") {
    content = <Settings />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar setPage={setPage} activePage={page} onLogout={handleLogout} />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          {content}
        </main>
      </div>
    </div>
  );
}
