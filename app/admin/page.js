"use client";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import AddMemberModal from "@/components/AddMemberModal";

export default function AdminPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  async function fetchMembers() {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  async function handleAddMember(data) {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) fetchMembers();
  }

  async function handleDeleteMember(id) {
    if (
      !confirm(
        "Are you sure? This will deactivate the member but keep their data."
      )
    )
      return;
    await fetch(`/api/members?id=${id}`, { method: "DELETE" });
    fetchMembers();
  }

  function startEdit(member) {
    setEditingMember(member._id);
    setEditName(member.name);
    setEditPhone(member.phone || "");
  }

  async function saveEdit() {
    await fetch("/api/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: editingMember,
        name: editName,
        phone: editPhone,
      }),
    });
    setEditingMember(null);
    fetchMembers();
  }

  async function handleResetPopup() {
    localStorage.removeItem("bf_visited");
    alert("Developer popup will show again on next visit!");
  }

  if (loading) return <LoadingSpinner text="Loading admin panel..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold gradient-text">⚙️ Admin Panel</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage members, settings, and system controls
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Members Management */}
        <div className="glass-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>👥</span> Members ({members.length})
            </h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="btn btn-primary btn-sm gap-1"
            >
              <span>+</span> Add Member
            </button>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No members yet
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {members.map((m, i) => (
                <div
                  key={m._id}
                  className="bg-base-100/40 rounded-lg p-3 hover:bg-base-100/60 transition-all"
                >
                  {editingMember === m._id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input input-bordered input-sm w-full bg-base-100/50 border-slate-700 text-sm"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="input input-bordered input-sm w-full bg-base-100/50 border-slate-700 text-sm"
                        placeholder="Phone"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="btn btn-success btn-xs flex-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMember(null)}
                          className="btn btn-ghost btn-xs flex-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {m.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {m.phone || "No phone"} • #{i + 1}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(m)}
                          className="btn btn-ghost btn-xs text-sky-400"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteMember(m._id)}
                          className="btn btn-ghost btn-xs text-red-400"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          {/* System Info */}
          <div className="glass-card p-5 animate-fade-in-up">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span>📋</span> System Info
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-base-100/30 rounded-lg p-3">
                <span className="text-sm text-slate-400">Active Members</span>
                <span className="badge badge-sm bg-sky-500/15 text-sky-300 border-sky-500/30">
                  {members.length}
                </span>
              </div>
              <div className="flex items-center justify-between bg-base-100/30 rounded-lg p-3">
                <span className="text-sm text-slate-400">Database</span>
                <span className="badge badge-sm bg-green-500/15 text-green-300 border-green-500/30">
                  MongoDB Atlas
                </span>
              </div>
              <div className="flex items-center justify-between bg-base-100/30 rounded-lg p-3">
                <span className="text-sm text-slate-400">Framework</span>
                <span className="badge badge-sm bg-purple-500/15 text-purple-300 border-purple-500/30">
                  Next.js
                </span>
              </div>
              <div className="flex items-center justify-between bg-base-100/30 rounded-lg p-3">
                <span className="text-sm text-slate-400">Developer</span>
                <span className="text-sm font-semibold gradient-text">
                  SM FERDOUS AHMMED (ASIF)
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="glass-card p-5 animate-fade-in-up">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span>🔧</span> Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={handleResetPopup}
                className="btn btn-ghost btn-sm w-full justify-start gap-2 text-slate-300 hover:text-white"
              >
                <span>🔄</span> Reset Developer Popup
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-ghost btn-sm w-full justify-start gap-2 text-slate-300 hover:text-white"
              >
                <span>♻️</span> Refresh Data
              </button>
            </div>
          </div>

          {/* Developer Credit */}
          <div className="glass-card p-5 text-center bg-gradient-to-br from-sky-500/5 to-purple-500/5 border-sky-500/10 animate-fade-in-up">
            <div className="text-4xl mb-3 animate-float">🍛</div>
            <h3 className="font-bold text-white mb-1">
              Bachelor Flat Meal Manager
            </h3>
            <p className="text-xs text-slate-500 mb-2">v1.0.0</p>
            <div className="w-12 h-0.5 mx-auto bg-gradient-to-r from-sky-500 to-purple-500 rounded mb-3" />
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
              Developed by
            </p>
            <p className="font-bold gradient-text">SM FERDOUS AHMMED (ASIF)</p>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={handleAddMember}
      />
    </div>
  );
}
