import React, { useState, useEffect } from "react";
import { Plus, Calendar, Users, DollarSign, Trash2, MapPin, AlertTriangle, Compass } from "lucide-react";
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Compass size={22} className="text-indigo-500" />
            My Trips
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage budgets and track expenses for your travels</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm shadow-indigo-200 active:scale-[0.98] transition-all text-sm"
        >
          <Plus size={16} />
          New Trip
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="inline-flex p-4 bg-indigo-50 text-indigo-500 rounded-2xl mb-4">
            <Compass size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No trips yet</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Create a trip to set a budget, add trip-specific receipts, and split expenses with your travel companions.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm shadow-indigo-200 transition"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip) => {
            const spent = getTripSpent(trip.id);
            const budgetPercent = trip.budget > 0 ? (spent / trip.budget) * 100 : 0;
            let alertMessage = "";
            let barColor = "bg-emerald-500";
            if (spent >= trip.budget) { alertMessage = "Budget Exceeded"; barColor = "bg-rose-500"; }
            else if (budgetPercent >= 80) { alertMessage = "Near Limit"; barColor = "bg-amber-400"; }

            return (
              <motion.div
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all flex flex-col gap-4 group relative overflow-hidden"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
              >
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${barColor} opacity-70 rounded-t-2xl`} />

                {/* Header */}
                <div className="flex justify-between items-start pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <MapPin size={15} className="text-indigo-500" />
                    </div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {trip.destination}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTrip(trip.id, e)}
                    className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-all"
                    title="Delete Trip"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Date and participants */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {trip.startDate} → {trip.endDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {trip.participants?.length || 1} traveler{(trip.participants?.length || 1) !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Budget tracker */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">₹{spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} spent</span>
                    <span className="text-slate-700">₹{trip.budget.toLocaleString('en-IN', { maximumFractionDigits: 0 })} budget</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${barColor} h-full rounded-full transition-all`}
                      style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                    />
                  </div>
                  {alertMessage && (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl ${
                      spent >= trip.budget ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <AlertTriangle size={11} />
                      {alertMessage}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
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
