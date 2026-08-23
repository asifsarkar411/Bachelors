"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getCurrentMonth, getMonthName, getDaysInMonth } from "@/lib/utils";

export default function MealsPage() {
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState({});
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [year, m] = month.split("-").map(Number);
  const daysInMonth = getDaysInMonth(year, m);
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    return `${month}-${day}`;
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, mealsRes] = await Promise.all([
        fetch("/api/members"),
        fetch(`/api/meals?month=${month}`),
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
  }, [month]);

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
          <h1 className="text-2xl font-bold gradient-text">🍽️ Meal Count Sheet</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track Day & Night meals for each member
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input input-bordered input-sm bg-base-200 border-slate-700 text-sm"
          />
          <button
            onClick={saveMeals}
            disabled={saving}
            className="btn btn-primary btn-sm gap-1"
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "💾"
            )}{" "}
            Save All
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className="mb-4 text-sm font-medium text-center animate-fade-in">
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
        <div className="glass-card overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="!sticky left-0 z-20 bg-slate-900/95 min-w-[50px]">
                    Date
                  </th>
                  {members.map((m) => (
                    <th
                      key={m._id}
                      colSpan={2}
                      className="text-center !text-sky-300"
                    >
                      {m.name}
                    </th>
                  ))}
                  <th className="text-center !text-amber-300">Day Total</th>
                </tr>
                <tr>
                  <th className="!sticky left-0 z-20 bg-slate-900/95"></th>
                  {members.map((m) => (
                    <th key={m._id} colSpan={2} className="!p-0">
                      <div className="flex">
                        <span className="flex-1 text-center text-[10px] py-1 text-green-400 border-r border-slate-700/50">
                          Day
                        </span>
                        <span className="flex-1 text-center text-[10px] py-1 text-purple-400">
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
                  return (
                    <tr key={date}>
                      <td className="!sticky left-0 z-10 bg-slate-900/90 backdrop-blur-sm whitespace-nowrap">
                        <span className="font-medium text-white text-sm">
                          {dayNum}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          {dayName}
                        </span>
                      </td>
                      {members.map((m) => (
                        <td key={`${date}_${m._id}`} colSpan={2} className="!p-1">
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="0.5"
                              value={getMeal(date, m._id, "dayMeal") || ""}
                              onChange={(e) =>
                                setMeal(date, m._id, "dayMeal", e.target.value)
                              }
                              placeholder="0"
                              className="meal-input"
                            />
                            <input
                              type="number"
                              min="0"
                              max="2"
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
                              className="meal-input"
                            />
                          </div>
                        </td>
                      ))}
                      <td className="text-center font-semibold text-amber-300 text-sm">
                        {getDayTotal(date) || "-"}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-sky-500/10 font-bold">
                  <td className="!sticky left-0 z-10 bg-sky-900/40 backdrop-blur-sm text-sky-300">
                    TOTAL
                  </td>
                  {members.map((m) => (
                    <td
                      key={`total_${m._id}`}
                      colSpan={2}
                      className="text-center text-sky-300 text-lg"
                    >
                      {getMemberTotal(m._id)}
                    </td>
                  ))}
                  <td className="text-center text-amber-300 text-lg">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {members.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 stagger-children">
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
      )}
    </div>
  );
}
