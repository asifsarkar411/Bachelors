"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getCurrentMonth, getMonthName, getDaysInMonth } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useMonth } from "@/context/MonthContext";

export default function MealsPage() {
  const { isLoggedIn, isAdminOrManager, openLoginModal } = useAuth();
  const { selectedMonth, setSelectedMonth, isCurrentMonth } = useMonth();

  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [year, m] = selectedMonth.split("-").map(Number);
  const daysInMonth = getDaysInMonth(year, m);
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    return `${selectedMonth}-${day}`;
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, mealsRes] = await Promise.all([
        fetch("/api/members"),
        fetch(`/api/meals?month=${selectedMonth}`),
      ]);
      const membersData = await membersRes.json();
      const mealsData = await mealsRes.json();

      setMembers(Array.isArray(membersData) ? membersData : []);

      // Build meals lookup: { "date_memberId": { dayMeal, nightMeal } }
      const mealsMap = {};
      if (Array.isArray(mealsData)) {
        mealsData.forEach((ml) => {
          mealsMap[`${ml.date}_${ml.memberId}`] = {
            dayMeal: ml.dayMeal || 0,
            nightMeal: ml.nightMeal || 0,
          };
        });
      }
      setMeals(mealsMap);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getMeal(date, memberId, type) {
    const key = `${date}_${memberId}`;
    return meals[key]?.[type] || 0;
  }

  function setMeal(date, memberId, type, value) {
    const key = `${date}_${memberId}`;
    setMeals((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        dayMeal: prev[key]?.dayMeal || 0,
        nightMeal: prev[key]?.nightMeal || 0,
        [type]: Number(value) || 0,
      },
    }));
  }

  function getMemberTotal(memberId) {
    let total = 0;
    dates.forEach((date) => {
      total += getMeal(date, memberId, "dayMeal");
      total += getMeal(date, memberId, "nightMeal");
    });
    return total;
  }

  function getDayTotal(date) {
    let total = 0;
    members.forEach((m) => {
      total += getMeal(date, m._id, "dayMeal");
      total += getMeal(date, m._id, "nightMeal");
    });
    return total;
  }

  function getGrandTotal() {
    return members.reduce((sum, m) => sum + getMemberTotal(m._id), 0);
  }

  async function saveMeals() {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    setSaving(true);
    setSaveMsg("");
    try {
      // Save each date's meals
      for (const date of dates) {
        const mealsForDate = members
          .map((m) => ({
            memberId: m._id,
            dayMeal: getMeal(date, m._id, "dayMeal"),
            nightMeal: getMeal(date, m._id, "nightMeal"),
          }))
          .filter((ml) => ml.dayMeal > 0 || ml.nightMeal > 0);

        if (mealsForDate.length > 0) {
          await fetch("/api/meals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, meals: mealsForDate }),
          });
        }
      }
      setSaveMsg("✅ Saved successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg("❌ Error saving");
      console.error(err);
    }
    setSaving(false);
  }

  if (loading) return <LoadingSpinner text="Loading meal sheet..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
            🍽️ Meal Count Sheet
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {getMonthName(selectedMonth)} — Track Day &amp; Night meals per person
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input input-bordered input-sm bg-base-200 border-slate-700 text-xs sm:text-sm flex-1 sm:flex-none"
          />

          <button
            onClick={saveMeals}
            disabled={saving}
            className="btn btn-primary btn-sm gap-1.5 shadow-md shadow-sky-500/20 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "💾"
            )}{" "}
            Save Sheet
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className="mb-4 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs sm:text-sm font-medium text-center animate-fade-in">
          {saveMsg}
        </div>
      )}

      {members.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-lg text-slate-400 mb-2">No members found</p>
          <p className="text-sm text-slate-500">
            Add members from the Dashboard or Admin page first.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden animate-fade-in-up border-slate-800">
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="!sticky left-0 z-20 bg-slate-900/95 min-w-[65px]">
                    Date
                  </th>
                  {members.map((m) => (
                    <th
                      key={m._id}
                      colSpan={2}
                      className="text-center !text-sky-300 min-w-[100px]"
                    >
                      {m.name}
                    </th>
                  ))}
                  <th className="text-center !text-amber-300 min-w-[80px]">Day Total</th>
                </tr>
                <tr>
                  <th className="!sticky left-0 z-20 bg-slate-900/95"></th>
                  {members.map((m) => (
                    <th key={m._id} colSpan={2} className="!p-0">
                      <div className="flex">
                        <span className="flex-1 text-center text-[10px] py-1 text-green-400 border-r border-slate-700/50 bg-slate-900/60">
                          Day
                        </span>
                        <span className="flex-1 text-center text-[10px] py-1 text-purple-400 bg-slate-900/60">
                          Night
                        </span>
                      </div>
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dates.map((date) => {
                  const dayNum = parseInt(date.split("-")[2]);
                  const dayName = new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const isToday =
                    new Date().toISOString().split("T")[0] === date;

                  return (
                    <tr
                      key={date}
                      className={isToday ? "bg-sky-500/5" : ""}
                    >
                      <td
                        className={`!sticky left-0 z-10 whitespace-nowrap ${
                          isToday
                            ? "bg-slate-900/95 border-l-2 border-sky-400"
                            : "bg-slate-900/90"
                        } backdrop-blur-sm`}
                      >
                        <span className="font-semibold text-white text-xs sm:text-sm">
                          {dayNum}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          {dayName}
                        </span>
                      </td>
                      {members.map((m) => (
                        <td key={`${date}_${m._id}`} colSpan={2} className="!p-1">
                          <div className="flex gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={getMeal(date, m._id, "dayMeal") || ""}
                              onChange={(e) =>
                                setMeal(date, m._id, "dayMeal", e.target.value)
                              }
                              placeholder="0"
                              className="meal-input text-xs sm:text-sm"
                            />
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={getMeal(date, m._id, "nightMeal") || ""}
                              onChange={(e) =>
                                setMeal(
                                  date,
                                  m._id,
                                  "nightMeal",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="meal-input text-xs sm:text-sm"
                            />
                          </div>
                        </td>
                      ))}
                      <td className="text-center font-bold text-amber-300 text-xs sm:text-sm">
                        {getDayTotal(date) || "-"}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-sky-500/15 font-bold border-t-2 border-sky-500/30">
                  <td className="!sticky left-0 z-10 bg-sky-950/90 backdrop-blur-sm text-sky-300 font-extrabold text-xs sm:text-sm">
                    TOTAL
                  </td>
                  {members.map((m) => (
                    <td
                      key={`total_${m._id}`}
                      colSpan={2}
                      className="text-center text-sky-300 text-sm sm:text-base font-extrabold"
                    >
                      {getMemberTotal(m._id)}
                    </td>
                  ))}
                  <td className="text-center text-amber-300 text-sm sm:text-base font-extrabold">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {members.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Member Monthly Meal Count
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
            {members.map((m) => (
              <div key={m._id} className="glass-card p-3 text-center">
                <p className="text-xs text-slate-400 truncate">{m.name}</p>
                <p className="text-xl font-bold text-white mt-1">
                  {getMemberTotal(m._id)}
                </p>
                <p className="text-[10px] text-slate-500">meals</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
