"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import AddMemberModal from "@/components/AddMemberModal";
import { useAuth } from "@/context/AuthContext";
import { useMonth } from "@/context/MonthContext";
import { getMonthName } from "@/lib/utils";

export default function AdminPage() {
  const {
    user,
    isLoggedIn,
    isSuperAdmin,
    isAdminOrManager,
    openLoginModal,
    logout,
    updateUserSession,
  } = useAuth();

  const { selectedMonth, refreshHistory } = useMonth();

  const [members, setMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Request processing states
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [requestActionMsg, setRequestActionMsg] = useState({ type: "", text: "" });

  // Sub-Manager assignment form state (for Super Admin)
  const [assignMemberId, setAssignMemberId] = useState("");
  const [assignUsername, setAssignUsername] = useState("");
  const [assignPassword, setAssignPassword] = useState("");
  const [assignRole, setAssignRole] = useState("sub_manager");
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");

  // Account Settings: Username and Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: "", text: "" });

  // Data Reset State (Super Admin Only)
  const [resetTargetMonth, setResetTargetMonth] = useState(selectedMonth);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (selectedMonth) {
      setResetTargetMonth(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);

    const userRole = isSuperAdmin ? "super_admin" : user?.role || "";

    try {
      // Robust error-isolated fetching for each individual API
      const [membersRes, usersRes, requestsRes] = await Promise.allSettled([
        fetch("/api/members"),
        fetch("/api/auth/users", {
          headers: { "x-user-role": userRole },
        }),
        fetch("/api/admin/requests", {
          headers: { "x-user-role": userRole },
        }),
      ]);

      if (membersRes.status === "fulfilled" && membersRes.value.ok) {
        try {
          const membersData = await membersRes.value.json();
          setMembers(Array.isArray(membersData) ? membersData : []);
        } catch (e) {
          console.warn("Failed to parse members data", e);
        }
      }

      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        try {
          const usersData = await usersRes.value.json();
          setManagers(Array.isArray(usersData) ? usersData : []);
        } catch (e) {
          console.warn("Failed to parse managers data", e);
        }
      }

      if (requestsRes.status === "fulfilled" && requestsRes.value.ok) {
        try {
          const requestsData = await requestsRes.value.json();
          setJoinRequests(Array.isArray(requestsData) ? requestsData : []);
        } catch (e) {
          console.warn("Failed to parse requests data", e);
        }
      }
    } catch (err) {
      console.error("Admin data loading error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSuperAdmin, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Approve Member Join Request
  async function handleApproveRequest(reqItem) {
    setProcessingRequestId(reqItem._id);
    setRequestActionMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": isSuperAdmin ? "super_admin" : user?.role || "",
        },
        body: JSON.stringify({
          userId: reqItem._id,
          action: "approve",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve member");
      }

      setRequestActionMsg({
        type: "success",
        text: `✅ Accepted! "${reqItem.name}" (@${reqItem.username}) is now an approved flat member and can add to the Bajar List.`,
      });

      // Optimistic update
      setJoinRequests((prev) => prev.filter((r) => r._id !== reqItem._id));
      fetchData(true);
      refreshHistory();

      setTimeout(() => setRequestActionMsg({ type: "", text: "" }), 6000);
    } catch (err) {
      setRequestActionMsg({ type: "error", text: `❌ ${err.message}` });
    }
    setProcessingRequestId(null);
  }

  // Handle Reject/Decline Member Join Request
  async function handleDeclineRequest(reqItem) {
    if (
      !confirm(
        `Are you sure you want to decline the join request from "${reqItem.name}" (@${reqItem.username})?`
      )
    )
      return;

    setProcessingRequestId(reqItem._id);
    setRequestActionMsg({ type: "", text: "" });

    try {
      const res = await fetch(`/api/admin/requests?id=${reqItem._id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": isSuperAdmin ? "super_admin" : user?.role || "",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to decline request");
      }

      setRequestActionMsg({
        type: "success",
        text: `🗑️ Join request from "${reqItem.name}" declined and removed.`,
      });

      // Optimistic update
      setJoinRequests((prev) => prev.filter((r) => r._id !== reqItem._id));
      fetchData(true);

      setTimeout(() => setRequestActionMsg({ type: "", text: "" }), 5000);
    } catch (err) {
      setRequestActionMsg({ type: "error", text: `❌ ${err.message}` });
    }
    setProcessingRequestId(null);
  }

  // Add Member manually
  async function handleAddMember(data) {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchData(true);
      refreshHistory();
    }
  }

  // Super Admin: Remove Member (Soft or Permanent)
  async function handleRemoveMember(id, memberName, isPermanent = false) {
    const confirmPrompt = isPermanent
      ? `⚠️ PERMANENT REMOVAL: Are you sure you want to completely delete "${memberName}"? This will permanently remove their member record and linked user account.`
      : `Are you sure you want to deactivate "${memberName}"? This will disable their access but preserve calculation history.`;

    if (!confirm(confirmPrompt)) return;

    try {
      const url = isPermanent
        ? `/api/members?id=${id}&permanent=true`
        : `/api/members?id=${id}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        fetchData(true);
        refreshHistory();
      } else {
        alert(data.error || "Failed to remove member");
      }
    } catch (err) {
      console.error(err);
    }
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
    fetchData(true);
  }

  // Super Admin: Assign a new Sub-Manager or Admin
  async function handleAssignManager(e) {
    e.preventDefault();
    if (!assignUsername.trim() || !assignPassword.trim()) {
      setAssignMsg("❌ Username and password are required");
      return;
    }

    setAssigning(true);
    setAssignMsg("");

    try {
      const selectedMember = members.find((m) => m._id === assignMemberId);
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": isSuperAdmin ? "super_admin" : user?.role || "",
        },
        body: JSON.stringify({
          username: assignUsername.trim(),
          password: assignPassword.trim(),
          name: selectedMember ? selectedMember.name : assignUsername.trim(),
          role: assignRole,
          memberId: assignMemberId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign manager");
      }

      setAssignMsg("✅ Manager assigned successfully!");
      setAssignUsername("");
      setAssignPassword("");
      setAssignMemberId("");
      fetchData(true);
      setTimeout(() => setAssignMsg(""), 3500);
    } catch (err) {
      setAssignMsg(`❌ ${err.message}`);
    }
    setAssigning(false);
  }

  // Super Admin: Unassign Sub-Manager or Admin
  async function handleUnassign(userId) {
    if (!confirm("Are you sure you want to unassign this manager?")) return;

    try {
      const res = await fetch(`/api/auth/users?id=${userId}`, {
        method: "DELETE",
        headers: {
          "x-user-role": isSuperAdmin ? "super_admin" : user?.role || "",
        },
      });
      if (res.ok) {
        fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to unassign");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Settings: Change Username and Password
  async function handleChangeCredentials(e) {
    e.preventDefault();
    setSettingsMsg({ type: "", text: "" });

    if (!currentPassword) {
      setSettingsMsg({ type: "error", text: "Current password is required." });
      return;
    }

    if (!newUsername.trim()) {
      setSettingsMsg({ type: "error", text: "New username cannot be empty." });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSettingsMsg({
        type: "error",
        text: "New passwords do not match. Please verify.",
      });
      return;
    }

    setUpdatingSettings(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUsername: user?.username,
          currentPassword,
          newUsername: newUsername.trim(),
          newPassword: newPassword || currentPassword,
          role: user?.role || (isSuperAdmin ? "super_admin" : "sub_manager"),
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update credentials");
      }

      setSettingsMsg({
        type: "success",
        text: "✅ Login credentials updated successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update frontend session
      if (data.user) {
        updateUserSession(data.user);
      }
    } catch (err) {
      setSettingsMsg({ type: "error", text: `❌ ${err.message}` });
    }
    setUpdatingSettings(false);
  }

  // Super Admin: Reset Data (Month-Wise or Complete)
  async function handleResetData(action, actionLabel) {
    if (!isSuperAdmin) {
      alert("Only Super Admin can reset data.");
      return;
    }

    const confirmMsg = `⚠️ WARNING: Are you sure you want to ${actionLabel} for "${getMonthName(resetTargetMonth)}" (${resetTargetMonth})?\n\nThis will permanently delete records for this month and cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setResetting(true);
    setResetMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "super_admin",
        },
        body: JSON.stringify({
          action,
          month: resetTargetMonth,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset data");
      }

      setResetMsg({
        type: "success",
        text: `✅ ${data.message}`,
      });
      fetchData(true);
      refreshHistory();
      setTimeout(() => setResetMsg({ type: "", text: "" }), 5000);
    } catch (err) {
      setResetMsg({ type: "error", text: `❌ ${err.message}` });
    }
    setResetting(false);
  }

  function handleResetPopup() {
    localStorage.removeItem("bf_visited");
    alert("Developer credit popup will show again on your next page refresh!");
  }

  if (loading) return <LoadingSpinner text="Loading control panel items..." />;

  // If user is not logged in as Admin or Super Admin
  if (!isLoggedIn) {
    return (
      <div className="page-container flex items-center justify-center min-h-[70vh]">
        <div className="glass-card !border-sky-500/30 p-8 max-w-md w-full text-center animate-scale-in shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-sky-500/20">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Protected</h2>
          <p className="text-sm text-slate-400 mb-6">
            This control center requires Manager or Super Admin credentials to access.
          </p>
          <button
            onClick={() => openLoginModal("signin")}
            className="btn btn-primary w-full shadow-lg shadow-sky-500/20 gap-2 font-semibold"
          >
            <span>🔐</span> Manager &amp; Super Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
              ⚙️ Admin &amp; Control Center
            </h1>
            {isSuperAdmin ? (
              <span className="badge badge-sm bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold">
                👑 Super Admin
              </span>
            ) : (
              <span className="badge badge-sm bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold">
                ⭐ {user?.role === "admin" ? "Admin" : "Sub Manager"}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as <span className="text-white font-semibold">{user?.name || user?.username}</span> (@{user?.username})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="btn btn-ghost btn-sm text-slate-300 border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <span className={refreshing ? "animate-spin" : ""}>🔄</span>
            <span>{refreshing ? "Refreshing..." : "Refresh Items"}</span>
          </button>
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ================= SUPER ADMIN FEATURE 1: PENDING MEMBER SIGN-UP REQUESTS ================= */}
      {isSuperAdmin && (
        <div className="glass-card p-5 sm:p-6 mb-8 border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-pink-950/20 animate-fade-in-up shadow-xl shadow-purple-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-purple-500/30">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📬</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-purple-300">
                    Pending Flat Member Join Requests
                  </h2>
                  <span
                    className={`badge badge-sm font-bold ${
                      joinRequests.length > 0
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {joinRequests.length} Pending
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Users who signed up from the Navbar. Accept them to grant Bajar adding access and flat membership.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              Super Admin Approval Required
            </span>
          </div>

          {/* Action Message Feedback */}
          {requestActionMsg.text && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs font-medium animate-fade-in flex items-center gap-2 ${
                requestActionMsg.type === "success"
                  ? "bg-green-500/15 border border-green-500/30 text-green-300"
                  : "bg-red-500/15 border border-red-500/30 text-red-400"
              }`}
            >
              {requestActionMsg.text}
            </div>
          )}

          {joinRequests.length === 0 ? (
            <div className="text-center py-6 px-4 rounded-xl bg-base-100/30 border border-slate-800/80">
              <span className="text-2xl block mb-1">✨</span>
              <p className="text-xs text-slate-400">
                No pending join requests right now. New sign-ups will appear here for your review and acceptance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {joinRequests.map((req) => (
                <div
                  key={req._id}
                  className="p-4 rounded-xl bg-base-100/60 border border-purple-500/20 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>👤</span> {req.name}
                        </h3>
                        <p className="text-xs text-purple-300 font-mono mt-0.5">
                          @{req.username}
                        </p>
                      </div>
                      <span className="badge badge-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
                        Pending
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400 mb-3 bg-base-200/40 p-2.5 rounded-lg border border-slate-800">
                      <p>
                        📱 <span className="text-slate-300 font-medium">{req.phone || "No phone provided"}</span>
                      </p>
                      {req.notes && (
                        <p>
                          🏷️ <span className="text-slate-300 italic">{req.notes}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        🕒 Requested on:{" "}
                        {new Date(req.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Accept & Decline Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <button
                      onClick={() => handleApproveRequest(req)}
                      disabled={processingRequestId === req._id}
                      className="btn btn-success btn-xs flex-1 text-xs font-semibold gap-1 text-slate-950 shadow-md shadow-green-500/20"
                    >
                      {processingRequestId === req._id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "✅ Accept & Add Member"
                      )}
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req)}
                      disabled={processingRequestId === req._id}
                      className="btn btn-ghost btn-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"
                      title="Decline request"
                    >
                      ❌ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACCOUNT & SECURITY SETTINGS: USERNAME AND PASSWORD CHANGE */}
      <div className="glass-card p-5 sm:p-6 mb-8 border-sky-500/30 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-sky-950/20 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔐</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Account Settings: Change Login Credentials
              </h2>
              <p className="text-xs text-slate-400">
                Update your login username and password for{" "}
                <span className="text-sky-300 font-semibold font-mono">
                  @{user?.username}
                </span>{" "}
                ({isSuperAdmin ? "Super Admin" : user?.role || "Manager"})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="text-xs text-sky-400 hover:underline cursor-pointer"
          >
            {showPasswords ? "Hide Passwords" : "Show Passwords"}
          </button>
        </div>

        {/* Feedback Message */}
        {settingsMsg.text && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-medium ${
              settingsMsg.type === "success"
                ? "bg-green-500/10 border border-green-500/30 text-green-300"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {settingsMsg.text}
          </div>
        )}

        <form onSubmit={handleChangeCredentials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Current Password */}
            <div>
              <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block mb-1">
                Current Password *
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
                required
              />
            </div>

            {/* New Username */}
            <div>
              <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block mb-1">
                New Username *
              </label>
              <input
                type="text"
                placeholder="e.g. asif or manager1"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block mb-1">
                New Password *
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
                required
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block mb-1">
                Confirm New Password *
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={updatingSettings}
              className="btn btn-primary btn-sm px-6 font-semibold shadow-md shadow-sky-500/20 text-xs sm:text-sm"
            >
              {updatingSettings ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "💾 Save New Credentials"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SUPER ADMIN EXCLUSIVE SECTION: Manager & Sub-Manager Assignment */}
      {isSuperAdmin && (
        <div className="glass-card p-5 sm:p-6 mb-8 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-slate-900/40 to-purple-500/5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">👑</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-amber-300">
                  Super Admin Controls: Sub-Manager Assignment
                </h2>
                <p className="text-xs text-slate-400">
                  Assign or unassign sub-managers and admins who can control operational records
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              Super Admin Only
            </span>
          </div>

          {/* Assignment Form */}
          <form onSubmit={handleAssignManager} className="mb-6 bg-base-100/40 rounded-xl p-4 border border-slate-700/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <span>➕</span> Assign New Sub-Manager or Admin
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Select Member (optional link) */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Link Member (Optional)
                </label>
                <select
                  value={assignMemberId}
                  onChange={(e) => {
                    setAssignMemberId(e.target.value);
                    const sel = members.find((m) => m._id === e.target.value);
                    if (sel && !assignUsername) {
                      setAssignUsername(sel.name.toLowerCase().replace(/\s+/g, ""));
                    }
                  }}
                  className="select select-bordered select-sm w-full bg-base-100/60 border-slate-700 text-xs text-white"
                >
                  <option value="">Custom User (No Link)</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Username */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Login Username *
                </label>
                <input
                  type="text"
                  placeholder="e.g. manager1"
                  value={assignUsername}
                  onChange={(e) => setAssignUsername(e.target.value)}
                  className="input input-bordered input-sm w-full bg-base-100/60 border-slate-700 text-xs text-white"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Login Password *
                </label>
                <input
                  type="text"
                  placeholder="e.g. pass123"
                  value={assignPassword}
                  onChange={(e) => setAssignPassword(e.target.value)}
                  className="input input-bordered input-sm w-full bg-base-100/60 border-slate-700 text-xs text-white"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>

              {/* Role & Submit */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Role
                  </label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value)}
                    className="select select-bordered select-sm w-full bg-base-100/60 border-slate-700 text-xs text-white"
                  >
                    <option value="sub_manager">Sub Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={assigning}
                  className="btn btn-warning btn-sm text-xs font-semibold px-4 text-slate-950"
                >
                  {assigning ? <span className="loading loading-spinner loading-xs" /> : "Assign"}
                </button>
              </div>
            </div>

            {assignMsg && (
              <p className="text-xs font-medium mt-3 text-center">{assignMsg}</p>
            )}
          </form>

          {/* List of Active Assigned Sub-Managers */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <span>📋</span> Active Assigned Managers &amp; Admins ({managers.length})
            </h3>

            {managers.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No custom sub-managers assigned yet. Use the form above to assign one.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {managers.map((mgr) => (
                  <div
                    key={mgr._id}
                    className="p-3 rounded-xl bg-base-100/50 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">⭐</span>
                        <p className="text-xs font-bold text-white truncate">
                          {mgr.name || mgr.username}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        @{mgr.username} •{" "}
                        <span className="text-sky-300 font-medium capitalize">
                          {mgr.role?.replace("_", " ")}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleUnassign(mgr._id)}
                      className="btn btn-ghost btn-xs text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                      title="Unassign Manager"
                    >
                      Unassign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPER ADMIN EXCLUSIVE SECTION: MONTH-WISE DATA RESET */}
      {isSuperAdmin && (
        <div className="glass-card p-5 sm:p-6 mb-8 border-rose-500/30 bg-gradient-to-br from-rose-500/5 via-slate-900/40 to-amber-500/5 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🗑️</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-rose-300">
                  Month-Wise Data Reset Center
                </h2>
                <p className="text-xs text-slate-400">
                  Super Admin authority to clear or reset meals, bajar lists, and flat expenses month-wise
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              Super Admin Only
            </span>
          </div>

          {/* Target Month Selector */}
          <div className="bg-base-100/50 p-4 rounded-xl border border-slate-700/60 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1">
                  Target Month for Reset:
                </label>
                <p className="text-xs text-slate-400">
                  Selected Target: <span className="font-bold text-sky-300">{getMonthName(resetTargetMonth)}</span> ({resetTargetMonth})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={resetTargetMonth}
                  onChange={(e) => setResetTargetMonth(e.target.value)}
                  className="input input-bordered input-sm bg-base-200 border-slate-700 text-xs font-bold text-sky-300"
                />
                <button
                  type="button"
                  onClick={() => setResetTargetMonth(selectedMonth)}
                  className="btn btn-ghost btn-xs text-slate-300 border border-slate-700"
                >
                  Active Month
                </button>
              </div>
            </div>
          </div>

          {/* Reset Feedback Message */}
          {resetMsg.text && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs font-medium text-center animate-fade-in ${
                resetMsg.type === "success"
                  ? "bg-green-500/10 border border-green-500/30 text-green-300"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {resetMsg.text}
            </div>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Reset Meals */}
            <div className="p-4 rounded-xl bg-base-100/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">🍽️</span>
                  <h3 className="text-xs font-bold text-white">Reset Meals</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Clears all Day &amp; Night meals for {getMonthName(resetTargetMonth)}.
                </p>
              </div>
              <button
                onClick={() =>
                  handleResetData("reset_meals_month", "Reset All Meals")
                }
                disabled={resetting}
                className="btn btn-outline btn-warning btn-xs w-full text-xs font-semibold"
              >
                Reset Meals ({resetTargetMonth})
              </button>
            </div>

            {/* 2. Reset Bajar List */}
            <div className="p-4 rounded-xl bg-base-100/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">🛒</span>
                  <h3 className="text-xs font-bold text-white">Reset Bajar List</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Clears all market/bajar expense entries for {getMonthName(resetTargetMonth)}.
                </p>
              </div>
              <button
                onClick={() =>
                  handleResetData("reset_bajar_month", "Reset Bajar List")
                }
                disabled={resetting}
                className="btn btn-outline btn-warning btn-xs w-full text-xs font-semibold"
              >
                Reset Bajar ({resetTargetMonth})
              </button>
            </div>

            {/* 3. Reset Flat Expenses */}
            <div className="p-4 rounded-xl bg-base-100/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">🏢</span>
                  <h3 className="text-xs font-bold text-white">Reset Flat Expenses</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Clears all utility bills &amp; rent for {getMonthName(resetTargetMonth)}.
                </p>
              </div>
              <button
                onClick={() =>
                  handleResetData(
                    "reset_flat_expenses_month",
                    "Reset Flat Expenses"
                  )
                }
                disabled={resetting}
                className="btn btn-outline btn-warning btn-xs w-full text-xs font-semibold"
              >
                Reset Flat Bills ({resetTargetMonth})
              </button>
            </div>

            {/* 4. Complete Month Reset */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between hover:border-rose-500/50 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">⚠️</span>
                  <h3 className="text-xs font-bold text-rose-300">
                    Reset All for Month
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Cleans meals, bajar, and flat bills for {getMonthName(resetTargetMonth)}.
                </p>
              </div>
              <button
                onClick={() =>
                  handleResetData(
                    "reset_all_month",
                    "Reset All Data (Meals + Bajar + Bills)"
                  )
                }
                disabled={resetting}
                className="btn btn-error btn-xs w-full text-xs font-semibold text-white shadow-md shadow-rose-500/20"
              >
                Reset All ({resetTargetMonth})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Members Management & System Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Management (2 cols) */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white flex items-center gap-2 text-base">
                <span>👥</span> Manage Flat Members
              </h2>
              <span className="badge badge-sm bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold">
                {members.length} Active
              </span>
            </div>
            <button
              onClick={() => setShowAddMember(true)}
              className="btn btn-primary btn-sm gap-1 text-xs"
            >
              <span>+</span> Add Member
            </button>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">
              No active members found. Click &quot;+ Add Member&quot; or accept pending sign-ups above.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {members.map((m, i) => (
                <div
                  key={m._id}
                  className="bg-base-100/50 rounded-xl p-3.5 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  {editingMember === m._id ? (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input input-bordered input-sm bg-base-100/60 border-slate-700 text-xs text-white"
                          placeholder="Member Name"
                        />
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="input input-bordered input-sm bg-base-100/60 border-slate-700 text-xs text-white"
                          placeholder="Phone Number"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="btn btn-success btn-xs flex-1"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingMember(null)}
                          className="btn btn-ghost btn-xs flex-1 text-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white truncate">
                              {m.name}
                            </p>
                            {m.role && (
                              <span className="badge badge-xs bg-sky-500/20 text-sky-300 border-sky-500/30">
                                {m.role}
                              </span>
                            )}
                            {m.username && (
                              <span className="text-[11px] font-mono text-slate-400">
                                @{m.username}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {m.phone ? `📱 ${m.phone}` : "No phone number"} • Member #{i + 1}
                          </p>
                        </div>
                      </div>

                      {/* Member Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(m)}
                          className="btn btn-ghost btn-xs text-sky-400 hover:bg-sky-500/10"
                          title="Edit member"
                        >
                          ✏️ Edit
                        </button>

                        {/* Super Admin can remove / deactivate member */}
                        <button
                          onClick={() => handleRemoveMember(m._id, m.name, false)}
                          className="btn btn-ghost btn-xs text-amber-400 hover:bg-amber-500/10"
                          title="Deactivate member"
                        >
                          ⏸️
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleRemoveMember(m._id, m.name, true)}
                            className="btn btn-ghost btn-xs text-rose-400 hover:bg-rose-500/10"
                            title="Permanently remove member"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Info & Utilities (1 col) */}
        <div className="space-y-4">
          {/* System Info Card */}
          <div className="glass-card p-5 animate-fade-in-up">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
              <span>📋</span> System Status
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-base-100/40 rounded-lg">
                <span className="text-slate-400">Active Flat Members</span>
                <span className="font-bold text-sky-400">{members.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-base-100/40 rounded-lg">
                <span className="text-slate-400">Pending Join Requests</span>
                <span className="font-bold text-purple-400">{joinRequests.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-base-100/40 rounded-lg">
                <span className="text-slate-400">Sub-Managers</span>
                <span className="font-bold text-pink-400">{managers.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-base-100/40 rounded-lg">
                <span className="text-slate-400">Database</span>
                <span className="badge badge-xs bg-green-500/15 text-green-300 border-green-500/30">
                  MongoDB Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-base-100/40 rounded-lg">
                <span className="text-slate-400">Active Session</span>
                <span className="font-mono text-amber-300 font-bold">@{user?.username}</span>
              </div>
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="glass-card p-5 animate-fade-in-up">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
              <span>🔧</span> Controls &amp; Utilities
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => fetchData()}
                className="btn btn-ghost btn-sm w-full justify-start gap-2 text-slate-300 text-xs border border-slate-700/60"
              >
                <span>🔄</span> Refresh All Data Items
              </button>
              <button
                onClick={handleResetPopup}
                className="btn btn-ghost btn-sm w-full justify-start gap-2 text-slate-300 text-xs border border-slate-700/60"
              >
                <span>💫</span> Reset Developer Popup
              </button>
            </div>
          </div>

          {/* Developer Credit Card */}
          <div className="glass-card p-5 text-center bg-gradient-to-br from-sky-500/10 via-slate-900/40 to-purple-500/10 border-sky-500/20 animate-fade-in-up">
            <div className="text-3xl mb-2 animate-float">🍛</div>
            <h3 className="font-bold text-white text-sm">
              Bachelor Flat Meal Manager
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Automated Calculation Sheet</p>
            <div className="w-12 h-0.5 mx-auto bg-gradient-to-r from-sky-500 to-purple-500 rounded my-3" />
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Developed by
            </p>
            <p className="font-bold gradient-text text-sm mt-0.5">
              SM FERDOUS AHMMED (ASIF)
            </p>
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
