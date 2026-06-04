import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Users, DollarSign, Plus, CheckCircle, AlertTriangle, AlertCircle, Trash2, HeartPulse, User } from "lucide-react";
import { motion } from "framer-motion";
import { getCurrentLocalDate } from "../utils/dateUtils";

export default function TripDetails({ user, tripId, onBack }) {
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Quick Add Form
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(getCurrentLocalDate());
  const [paidBy, setPaidBy] = useState("");
  const [isMedical, setIsMedical] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const categories = [
    'Food & Dining',
    'Accommodation',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Healthcare',
    'Entertainment',
    'Travel',
    'Education',
    'Groceries',
    'Other'
  ];

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      // Fetch this specific trip (we can fetch all trips and filter)
      const tripsResponse = await fetch(`http://localhost:5000/api/trips?username=${user.username}`);
      const tripsData = await tripsResponse.json();

      // Fetch expenses filtered by tripId
      const expensesResponse = await fetch(`http://localhost:5000/api/expenses?tripId=${tripId}`);
      const expensesData = await expensesResponse.json();

      if (tripsData.success) {
        const foundTrip = tripsData.trips.find(t => t.id === tripId);
        setTrip(foundTrip);
        if (foundTrip) {
          // Default paidBy to the current user if they are in participants, else first participant
          if (foundTrip.participants.includes(user.username)) {
            setPaidBy(user.username);
          } else if (foundTrip.participants.length > 0) {
            setPaidBy(foundTrip.participants[0]);
          }
        }
      }

      if (expensesData.success) {
        setExpenses(expensesData.expenses);
      }
    } catch (err) {
      console.error("Error fetching trip details:", err);
      setError("Failed to load trip details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [tripId, user.username]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!vendor.trim() || !amount || !category || !date || !paidBy) {
      setError("Please fill in all required fields.");
      return;
    }

    setFormLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor,
          amount: parseFloat(amount),
          category,
          date,
          tripId: trip.id,
          paidBy,
          isMedical,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setExpenses((prev) => [result.expense, ...prev]);
        setSuccess("Expense added successfully!");
        // Reset form except date and paidBy
        setVendor("");
        setAmount("");
        setCategory("");
        setIsMedical(false);
        
        // Trigger generic expense update for charts/tables elsewhere
        window.dispatchEvent(new CustomEvent('expenseAdded', { detail: result.expense }));
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to add expense.");
      }
    } catch (err) {
      setError("Server error. Failed to add expense.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        // Trigger event
        window.dispatchEvent(new CustomEvent('expenseAdded'));
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 font-semibold text-lg">Trip not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  // Calculations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetPercent = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;
  
  // Medical Expenses calculations
  const medicalExpenses = expenses.filter(e => e.isMedical || e.category === 'Healthcare');
  const medicalTotal = medicalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const medicalPercentOfTotal = totalSpent > 0 ? (medicalTotal / totalSpent) * 100 : 0;

  // Active Trip status & reminder checks
  const isTripActive = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return todayStr >= trip.startDate && todayStr <= trip.endDate;
  };
  
  const hasRecentExpense = () => {
    if (expenses.length === 0) return false;
    const sorted = [...expenses].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    const latest = sorted[0];
    const latestDate = new Date(latest.createdAt || latest.date);
    const timeDiff = new Date() - latestDate;
    return timeDiff < 24 * 60 * 60 * 1000;
  };

  const showActiveTripReminder = isTripActive() && !hasRecentExpense();

  // Debt split settlement algorithm
  const calculateSettlements = () => {
    const numParticipants = trip.participants.length || 1;
    const sharePerPerson = totalSpent / numParticipants;
    
    // Initialize payments and balances
    const paidMap = {};
    const balances = {};
    
    trip.participants.forEach(p => {
      paidMap[p] = 0;
      balances[p] = -sharePerPerson;
    });

    expenses.forEach(e => {
      const payer = e.paidBy || trip.createdBy || user.username;
      if (paidMap[payer] !== undefined) {
        paidMap[payer] += e.amount;
        balances[payer] += e.amount;
      } else {
        // Fallback for edge cases
        paidMap[trip.createdBy] = (paidMap[trip.createdBy] || 0) + e.amount;
        balances[trip.createdBy] = (balances[trip.createdBy] || -sharePerPerson) + e.amount;
      }
    });

    // Separate debtors and creditors
    const debtors = [];
    const creditors = [];
    Object.keys(balances).forEach(person => {
      const val = parseFloat(balances[person].toFixed(2));
      if (val < -0.01) {
        debtors.push({ name: person, amount: -val });
      } else if (val > 0.01) {
        creditors.push({ name: person, amount: val });
      }
    });

    // Sort descending
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transfers = [];
    let i = 0, j = 0;
    
    // Copy objects to avoid mutating inside calculation
    const dCopy = debtors.map(d => ({ ...d }));
    const cCopy = creditors.map(c => ({ ...c }));

    while (i < dCopy.length && j < cCopy.length) {
      const debtor = dCopy[i];
      const creditor = cCopy[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: parseFloat(amount.toFixed(2))
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return { paidMap, balances, sharePerPerson, transfers };
  };

  const { paidMap, balances, sharePerPerson, transfers } = calculateSettlements();

  return (
    <div className="space-y-6 text-gray-800">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Trip Details</span>
          <h1 className="text-3xl font-extrabold text-gray-900">{trip.destination}</h1>
        </div>
      </div>

      {/* Warning/Reminder Banners */}
      <div className="space-y-3">
        {totalSpent >= trip.budget && (
          <motion.div 
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={22} className="text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Budget Exceeded!</span>
              <p className="text-sm text-red-700">Your total expenses (₹{totalSpent.toLocaleString()}) have exceeded your budget of ₹{trip.budget.toLocaleString()}.</p>
            </div>
          </motion.div>
        )}

        {totalSpent < trip.budget && budgetPercent >= 80 && (
          <motion.div 
            className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertTriangle size={22} className="text-orange-600 shrink-0" />
            <div>
              <span className="font-bold">Approaching Budget Limit!</span>
              <p className="text-sm text-orange-700">You have spent {budgetPercent.toFixed(1)}% of your planned budget.</p>
            </div>
          </motion.div>
        )}

        {showActiveTripReminder && (
          <motion.div 
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Calendar size={22} className="text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">📅 Active Trip Expense Reminder</span>
              <p className="text-sm text-blue-700">This trip is currently active, and no expenses have been logged in the last 24 hours. Keep your expenditure updated!</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Trip Details and Calculations (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Spent</span>
              <span className="text-2xl font-bold text-gray-900 mt-1">₹{totalSpent.toLocaleString()}</span>
              <span className="text-xs text-gray-400 mt-1">out of ₹{trip.budget.toLocaleString()}</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Budget Status</span>
              <span className="text-2xl font-bold text-gray-900 mt-1">{budgetPercent.toFixed(0)}%</span>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${totalSpent >= trip.budget ? "bg-red-600" : budgetPercent >= 80 ? "bg-orange-500" : "bg-green-600"}`}
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Per Person Share</span>
              <span className="text-2xl font-bold text-blue-600 mt-1">₹{Math.round(sharePerPerson).toLocaleString()}</span>
              <span className="text-xs text-gray-400 mt-1">split among {trip.participants.length} people</span>
            </div>
          </div>

          {/* Split Bill Settlements Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Split Bill Settlements
            </h2>

            {/* Individual Balances List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Participant Contributions</h3>
                <div className="space-y-2">
                  {trip.participants.map(p => {
                    const paid = paidMap[p] || 0;
                    const balance = balances[p] || 0;
                    return (
                      <div key={p} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="font-semibold">{p === user.username ? `${p} (You)` : p}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Paid: ₹{paid.toLocaleString()}</p>
                          <p className={`text-xs font-bold ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {balance >= 0 ? `+₹${balance.toFixed(2)}` : `-₹${Math.abs(balance).toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transfers list */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Suggested Transfers</h3>
                {transfers.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-lg text-sm text-gray-500">
                    🎉 Expenses are perfectly settled! No transfers needed.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transfers.map((t, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm flex flex-col justify-between gap-1">
                        <p className="text-blue-900">
                          <span className="font-bold">{t.from}</span> owes <span className="font-bold">{t.to}</span>
                        </p>
                        <p className="text-lg font-bold text-blue-700">₹{t.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Expense Reporting */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HeartPulse size={20} className="text-red-500" />
                Medical Expense Report
              </h2>
              <span className="text-sm font-semibold bg-red-50 text-red-700 px-3 py-1 rounded-full">
                Total Medical: ₹{medicalTotal.toLocaleString()}
              </span>
            </div>

            {medicalExpenses.length === 0 ? (
              <div className="p-4 bg-gray-50 text-center rounded-lg text-sm text-gray-500">
                No medical expenses recorded for this trip.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Medical expenses account for <span className="font-bold text-red-600">{medicalPercentOfTotal.toFixed(1)}%</span> of the overall trip expenditure.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2">Item/Vendor</th>
                        <th className="px-4 py-2">Paid By</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {medicalExpenses.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{e.vendor}</p>
                              <p className="text-xs text-gray-400">{e.date}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{e.paidBy || trip.createdBy}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">₹{e.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Linked Expenses List */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Trip Expenses List ({expenses.length})</h2>

            {expenses.length === 0 ? (
              <div className="p-10 text-center bg-gray-50 text-gray-500 rounded-lg text-sm">
                No expenses associated with this trip yet. Use the quick form or upload a bill to add expenses.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Paid By</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900">{e.vendor}</p>
                          <p className="text-xs text-gray-400">{e.date} {e.isMedical && "• 🚑 Medical"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{e.paidBy || trip.createdBy}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          ₹{e.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Quick Add Expense Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Quick Add Expense</h2>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Vendor *</label>
                <input
                  type="text"
                  placeholder="e.g. Hotel Marriott, Taxi Service"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Paid By *</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {trip.participants.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isMedical"
                  checked={isMedical}
                  onChange={(e) => setIsMedical(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isMedical" className="font-medium text-gray-700 select-none">
                  🚑 Mark as Medical Expense
                </label>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {formLoading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
