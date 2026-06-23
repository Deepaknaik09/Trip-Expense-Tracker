import React, { useState } from "react";
import { UserCircle, Camera, Save, LogOut, Shield, Bell, Globe } from "lucide-react";

export default function Settings({ user, onLogout }) {
  const [username, setUsername] = useState(user?.username || "User");
  const [email, setEmail] = useState(`${user?.username || "user"}@example.com`);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [saved, setSaved] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfilePhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and app preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-500 to-violet-600" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-indigo-600">{initials}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center cursor-pointer shadow-sm transition-colors">
                <Camera size={12} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
            <div className="pb-1">
              <p className="font-semibold text-slate-800 text-lg leading-tight">{username}</p>
              <p className="text-sm text-slate-400">{email}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white focus:border-transparent transition-all"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white focus:border-transparent transition-all"
                  placeholder="Enter email"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
              }`}
            >
              <Save size={14} />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Globe size={15} className="text-indigo-500" />
          Preferences
        </h2>

        <div className="flex items-center justify-between py-3 border-b border-slate-50">
          <div>
            <p className="text-sm font-medium text-slate-700">Currency</p>
            <p className="text-xs text-slate-400 mt-0.5">Preferred currency for expense display</p>
          </div>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 transition"
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Bell size={14} className="text-slate-400" />
              Budget Notifications
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Alert when 80% of monthly budget is used</p>
          </div>
          <button
            onClick={() => setNotifications(n => !n)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-rose-700 flex items-center gap-2 mb-4">
          <Shield size={15} />
          Account
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Sign Out</p>
            <p className="text-xs text-slate-400 mt-0.5">Logout from your TripSpend account</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-50 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
