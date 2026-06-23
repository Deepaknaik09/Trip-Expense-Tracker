import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, CheckCircle, AlertCircle, Calendar, Clock, FileText, Image, Edit3, Plus, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { getCurrentLocalDate, formatDisplayDate } from '../utils/dateUtils';
import CustomSelect from './CustomSelect';

export default function UploadCard() {
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  
  // Trips & fields for association
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedPaidBy, setSelectedPaidBy] = useState("");


  const [manualData, setManualData] = useState({
    vendor: '',
    amount: '',
    category: '',
    date: getCurrentLocalDate(),
    items: []
  });
  const fileInput = useRef();

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

  // Fetch trips for association
  const fetchTrips = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.username) {
        const res = await fetch(`http://localhost:5000/api/trips?username=${storedUser.username}`);
        const data = await res.json();
        if (data.success) {
          setTrips(data.trips);
        }
      }
    } catch (err) {
      console.error("Failed to load trips in UploadCard:", err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleTripChange = (tripId) => {
    setSelectedTripId(tripId);
    if (!tripId) {
      setSelectedPaidBy("");
      return;
    }
    const selectedTrip = trips.find(t => t.id === parseInt(tripId));
    if (selectedTrip) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (selectedTrip.participants.includes(storedUser.username)) {
        setSelectedPaidBy(storedUser.username);
      } else if (selectedTrip.participants.length > 0) {
        setSelectedPaidBy(selectedTrip.participants[0]);
      }
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload an image file (JPEG, PNG, GIF, BMP) or PDF document');
      return;
    }
    
    setLoading(true);
    setError("");
    setExtractedData(null);
    setFileType(file.type);

    try {
      // Create FormData to send file to backend
      const formData = new FormData();
      formData.append(file.type === 'application/pdf' ? 'pdf' : 'image', file);

      // Call the ML backend API
      const response = await fetch('http://localhost:5000/api/process-bill', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        if (result.manual_entry_required) {
          // Automatically switch to manual entry
          setExtractedData(null);
          setManualEntry(true);
          setError('⚠️ Tesseract OCR not installed. Please enter details manually.');
        } else {
          // Normal OCR extraction
          setExtractedData(result);
          setError(null);
        }
      } else {
        setError(result.error || 'Failed to process bill');
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('❌ Cannot connect to ML backend. Please check:\n• Backend server is running on http://localhost:5000\n• No firewall is blocking the connection\n• Try refreshing the page');
      } else if (err.message.includes('HTTP error')) {
        setError(`❌ Backend error: ${err.message}\nCheck the backend console for details.`);
      } else {
        setError(`❌ Upload failed: ${err.message}`);
      }
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToExpenses = async () => {
    const dataToSave = manualEntry ? manualData : extractedData;
    if (!dataToSave) return;
    
    // Validate manual entry fields
    if (manualEntry) {
      if (!manualData.vendor.trim()) {
        setError('Please enter vendor name');
        return;
      }
      if (!manualData.amount || manualData.amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (!manualData.category) {
        setError('Please select a category');
        return;
      }
    }
    
    try {
      setLoading(true);
      setError("");
      
      // Create expense object with validated date
      const rawDate = dataToSave.date || dataToSave.dates?.[0];
      let validDate = getCurrentLocalDate(); // Default to current date
      
      if (rawDate && rawDate !== 'Invalid Date' && rawDate !== '') {
        // Clean the date string - remove time if present
        const cleanDate = String(rawDate).split(' ')[0];
        
        // Validate the date format
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
          const testDate = new Date(cleanDate);
          if (!isNaN(testDate.getTime())) {
            validDate = cleanDate;
          }
        }
      }
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const expenseData = {
        vendor: dataToSave.vendor,
        amount: parseFloat(dataToSave.amount) || dataToSave.total_amount,
        currency: dataToSave.currency || 'INR',
        category: dataToSave.category,
        date: validDate,
        items: dataToSave.items || [],
        tripId: selectedTripId ? parseInt(selectedTripId) : null,
        paidBy: selectedTripId ? selectedPaidBy : (storedUser.username || null),

      };
      
      // Send to backend
      const response = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData)
      });

      const result = await response.json();
      
      if (result.success) {
        setSaved(true);
        
        // Trigger refresh of expenses list and charts
        window.dispatchEvent(new CustomEvent('expenseAdded', { detail: result.expense }));
        
        // Show success message and reset
        setTimeout(() => {
          setSaved(false);
          setExtractedData(null);
          // Reset states
          setSelectedTripId("");
          setSelectedPaidBy("");

          
          if (manualEntry) {
            setManualData({
              vendor: '',
              amount: '',
              category: '',
              date: getCurrentLocalDate(),
              items: []
            });
            setManualEntry(false);
          }
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to save expense');
      }
      
    } catch (err) {
      setError(`Failed to save expense: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntryToggle = () => {
    setManualEntry(!manualEntry);
    setExtractedData(null);
    setError("");
    setSelectedTripId("");
    setSelectedPaidBy("");

    if (!manualEntry) {
      setManualData({
        vendor: '',
        amount: '',
        category: '',
        date: getCurrentLocalDate(),
        items: []
      });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const selectedTrip = trips.find(t => t.id === parseInt(selectedTripId));

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 input-glow";
  const inputStyle = { background: "#f8fafc", border: "1px solid #e2e8f0" };
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <motion.div
      className="rounded-2xl flex flex-col gap-5 text-slate-800 overflow-hidden"
      style={{ background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Card header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid #f1f5f9" }}
      >
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Add Expense</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        {/* Mode toggle */}
        <div
          className="flex p-0.5 rounded-xl"
          style={{ background: "#f1f5f9" }}
        >
          <button
            onClick={() => { if (manualEntry) handleManualEntryToggle(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{
              background: !manualEntry ? "#fff" : "transparent",
              color: !manualEntry ? "#6366f1" : "#94a3b8",
              boxShadow: !manualEntry ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <UploadCloud size={13} />
            Upload
          </button>
          <button
            onClick={() => { if (!manualEntry) handleManualEntryToggle(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{
              background: manualEntry ? "#fff" : "transparent",
              color: manualEntry ? "#6366f1" : "#94a3b8",
              boxShadow: manualEntry ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Edit3 size={13} />
            Manual
          </button>
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-5">

      {/* Mode toggle is in the card header above */}


      {/* Manual Entry Form */}
      {manualEntry && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1" style={{ color: "#6366f1" }}>
            <Plus size={14} />
            <span className="text-sm font-semibold">Expense Details</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person / Paid By Input */}
            <div>
              <label className={labelCls}>Paid By *</label>
              <input
                type="text"
                value={manualData.vendor}
                onChange={(e) => setManualData(prev => ({...prev, vendor: e.target.value}))}
                placeholder="e.g. Alice, Bob, self"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            
            {/* Amount Input */}
            <div>
              <label className={labelCls}>Amount (₹) *</label>
              <input
                type="number"
                value={manualData.amount}
                onChange={(e) => setManualData(prev => ({...prev, amount: e.target.value}))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            
            {/* Category Dropdown */}
            <div>
              <label className={labelCls}>Category *</label>
              <CustomSelect
                value={manualData.category}
                onChange={(val) => setManualData(prev => ({...prev, category: val}))}
                options={categories}
                placeholder="Select category…"
                className={selectCls}
                style={inputStyle}
              />
            </div>
            
            {/* Date Input */}
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={manualData.date}
                onChange={(e) => setManualData(prev => ({...prev, date: e.target.value}))}
                className={inputCls}
                style={inputStyle}
              />
            </div>

            {/* Associate with Trip */}
            <div>
              <label className={labelCls}>Link to Trip (Optional)</label>
              <CustomSelect
                value={selectedTripId}
                onChange={(val) => handleTripChange(val)}
                options={[
                  { value: "", label: "None (Personal)" },
                  ...trips.map(t => ({ value: t.id, label: `${t.destination} (${t.startDate})` }))
                ]}
                placeholder="None (Personal)"
                className={selectCls}
                style={inputStyle}
              />
            </div>

            {/* Paid By (Only show if trip selected) */}
            {selectedTripId && (
              <div>
                <label className={labelCls}>Paid By</label>
                <CustomSelect
                  value={selectedPaidBy}
                  onChange={(val) => setSelectedPaidBy(val)}
                  options={selectedTrip?.participants || []}
                  placeholder="Select person..."
                  className={selectCls}
                  style={inputStyle}
                />
              </div>
            )}
          </div>


          
          {/* Add Button for Manual Entry */}
          <button
            onClick={handleAddToExpenses}
            disabled={loading || saved || !manualData.vendor.trim() || !manualData.amount || !manualData.category}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background: saved
                ? "linear-gradient(135deg, #10b981, #059669)"
                : loading || !manualData.vendor.trim() || !manualData.amount || !manualData.category
                ? "#e2e8f0"
                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: (!manualData.vendor.trim() || !manualData.amount || !manualData.category) && !saved ? "#94a3b8" : "#fff",
              boxShadow: saved || loading || !manualData.vendor.trim() ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
              cursor: loading || saved ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Saving…</>
            ) : saved ? (
              <><CheckCircle size={16} />Added Successfully!</>
            ) : (
              <><Plus size={15} />Add Expense</>
            )}
          </button>
        </div>
      )}

      {/* File Upload Area */}
      {!manualEntry && (
        <div
          className="flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 rounded-2xl mx-0"
          style={{
            border: "2px dashed #e2e8f0",
            minHeight: "160px",
            background: "#fafafa",
          }}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; }}
          onClick={() => fileInput.current.click()}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #eef2ff, #f5f3ff)" }}
          >
            <UploadCloud size={26} style={{ color: "#6366f1" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Drop file or <span style={{ color: "#6366f1" }}>browse</span></p>
            <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, PDF — up to 10MB</p>
          </div>
          <input
            type="file"
            ref={fileInput}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>
      )}
      
      {/* Status Messages */}
      {loading && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl text-sm"
          style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}
        >
          <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full flex-shrink-0" />
          <span className="font-medium">
            Processing {fileType === 'application/pdf' ? 'PDF invoice' : 'image'} with AI…
          </span>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-3 p-3.5 rounded-xl text-sm"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
        >
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success notification */}
      {saved && (
        <div
          className="flex items-start gap-3 p-3.5 rounded-xl text-sm"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}
        >
          <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Expense saved!</p>
            <p className="text-xs mt-0.5 text-emerald-600">
              ₹{(manualEntry ? parseFloat(manualData.amount) : (extractedData?.total_amount || extractedData?.amount))?.toFixed(2)} from {manualEntry ? manualData.vendor : extractedData?.vendor} added.
            </p>
          </div>
        </div>
      )}
      
      {/* Extracted Data Display */}
      {extractedData && !manualEntry && (
        <div
          className="rounded-xl p-4 space-y-4"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <div className="flex items-center gap-2" style={{ color: "#15803d" }}>
            <CheckCircle size={15} />
            <span className="text-sm font-semibold">Bill scanned successfully</span>
          </div>

          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Paid By", value: extractedData.vendor },
              { label: "Amount", value: `₹${(extractedData.amount || extractedData.total_amount || 0).toFixed(2)}`, highlight: true },
              { label: "Category", value: extractedData.category },
              { label: "Date", value: formatDisplayDate(extractedData.date || extractedData.dates?.[0]).formatted },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="bg-white rounded-xl p-3" style={{ border: "1px solid #dcfce7" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
                <p className={`text-sm font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-700'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Trip association */}
          <div className="space-y-2">
            <label className={labelCls}>Link to Trip (Optional)</label>
            <CustomSelect
              value={selectedTripId}
              onChange={(val) => handleTripChange(val)}
              options={[
                { value: "", label: "None (Personal)" },
                ...trips.map(t => ({ value: t.id, label: `${t.destination} (${t.startDate})` }))
              ]}
              placeholder="None (Personal)"
              className={selectCls}
              style={{ ...inputStyle, background: "#fff" }}
            />
            {selectedTripId && (
              <CustomSelect
                value={selectedPaidBy}
                onChange={(val) => setSelectedPaidBy(val)}
                options={selectedTrip?.participants || []}
                placeholder="Select person..."
                className={selectCls}
                style={{ ...inputStyle, background: "#fff", marginTop: "8px" }}
              />
            )}
          </div>



          {/* Line items */}
          {extractedData.items?.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                View {extractedData.items.length} line item{extractedData.items.length !== 1 ? 's' : ''}
              </summary>
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                {extractedData.items.slice(0, 8).map((item, i) => (
                  <p key={i} className="text-xs text-slate-500 pl-2 border-l-2 border-emerald-200">{item}</p>
                ))}
              </div>
            </details>
          )}

          <button
            onClick={handleAddToExpenses}
            disabled={loading || saved}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background: saved ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: saved ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
              opacity: loading ? 0.8 : 1,
              cursor: loading || saved ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Saving…</>
            ) : saved ? (
              <><CheckCircle size={15} />Added to Expenses!</>
            ) : (
              <>Add to Expenses</>
            )}
          </button>
        </div>
      )}
      </div>
    </motion.div>
  );
}
