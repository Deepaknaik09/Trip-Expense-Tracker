import React, { useState, useEffect } from "react";
import { Plus, Calendar, Users, DollarSign, Trash2, MapPin, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Trips({ user, onSelectTrip }) {
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  
  // Form fields
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [participantsText, setParticipantsText] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch trips
      const tripsResponse = await fetch(`http://localhost:5000/api/trips?username=${user.username}`);
      const tripsData = await tripsResponse.json();
      
      // Fetch all expenses to calculate totals
      const expensesResponse = await fetch("http://localhost:5000/api/expenses");
      const expensesData = await expensesResponse.json();

      if (tripsData.success) {
        setTrips(tripsData.trips);
      }
      if (expensesData.success) {
        setExpenses(expensesData.expenses);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load trips data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.username]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setError("");

    if (!destination.trim() || !budget || !startDate || !endDate) {
      setError("Please fill in all required fields.");
      return;
    }

    const participants = participantsText
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    try {
      const response = await fetch("http://localhost:5000/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          budget: parseFloat(budget),
          startDate,
          endDate,
          participants,
          createdBy: user.username,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTrips((prev) => [...prev, result.trip]);
        setShowModal(false);
        // Reset form
        setDestination("");
        setBudget("");
        setStartDate("");
        setEndDate("");
        setParticipantsText("");
      } else {
        setError(result.error || "Failed to create trip.");
      }
    } catch (err) {
      setError("Server error. Failed to create trip.");
    }
  };

  const handleDeleteTrip = async (id, e) => {
    e.stopPropagation(); // Avoid triggering card click
    if (!window.confirm("Are you sure you want to delete this trip? All linked expenses will lose association with this trip.")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/trips/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setTrips((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete trip:", err);
    }
  };

  // Helper: calculate total spent for a trip
  const getTripSpent = (tripId) => {
    return expenses
      .filter((e) => e.tripId === tripId)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
          <p className="text-gray-600 text-sm">Manage budgets, expenses, and split contributions for your travels.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          Create Trip
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center max-w-xl mx-auto mt-8">
          <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full mb-4">
            <Compass size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No trips created yet</h2>
          <p className="text-gray-600 mb-6">Create a trip to set a budget, add trip-specific receipts, and calculate how to split expenses with friends.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const spent = getTripSpent(trip.id);
            const budgetPercent = trip.budget > 0 ? (spent / trip.budget) * 100 : 0;
            
            // Determine warning state
            let alertMessage = "";
            let progressColor = "bg-green-600";
            if (spent >= trip.budget) {
              alertMessage = "Budget Exceeded!";
              progressColor = "bg-red-600";
            } else if (budgetPercent >= 80) {
              alertMessage = "Approaching Budget limit! (>80%)";
              progressColor = "bg-orange-500";
            }

            return (
              <motion.div
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group relative overflow-hidden"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
              >
                {/* Header info */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-blue-600 shrink-0" size={18} />
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-700 transition">
                        {trip.destination}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, e)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition shrink-0"
                      title="Delete Trip"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Date and Participants info */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{trip.startDate} to {trip.endDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      <span>{trip.participants?.length || 1} participant(s)</span>
                    </div>
                  </div>
                </div>

                {/* Budget Tracker */}
                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Spent: ₹{spent.toLocaleString()}</span>
                    <span className="text-gray-700 font-bold">Budget: ₹{trip.budget.toLocaleString()}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${progressColor} h-full rounded-full transition-all`}
                      style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                    />
                  </div>

                  {/* Warning label */}
                  {alertMessage && (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded mt-2 ${
                      spent >= trip.budget ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"
                    }`}>
                      <AlertTriangle size={12} />
                      <span>{alertMessage}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Trip Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 text-gray-800"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg">Create New Trip</h2>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-xl font-bold focus:outline-none">
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                <input
                  type="text"
                  placeholder="e.g. Paris, Goa, Tokyo"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participants (Comma-separated names)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alice, Bob, Charlie (excluding you)"
                  value={participantsText}
                  onChange={(e) => setParticipantsText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500 block mt-1">You will be automatically added as a participant.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
