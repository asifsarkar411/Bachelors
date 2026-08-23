"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentMonth } from "@/lib/utils";

const MonthContext = createContext();

const STORAGE_KEY = "bachelor_selected_month";

export function MonthProvider({ children }) {
  const currentMonthStr = getCurrentMonth();
  const [selectedMonth, setSelectedMonthState] = useState(currentMonthStr);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && /^\d{4}-\d{2}$/.test(saved)) {
        setSelectedMonthState(saved);
      }
    } catch (e) {
      console.warn("Could not load saved month", e);
    }
  }, []);

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.history && Array.isArray(data.history)) {
        setHistoryList(data.history);
      }
    } catch (e) {
      console.warn("History fetch warning:", e.message);
    }
    setLoadingHistory(false);
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  function setSelectedMonth(monthStr) {
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) return;
    setSelectedMonthState(monthStr);
    try {
      localStorage.setItem(STORAGE_KEY, monthStr);
    } catch (e) {}
  }

  function prevMonth() {
    const [year, month] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonthStr);
  }

  function nextMonth() {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonthStr);
  }

  function resetToCurrentMonth() {
    setSelectedMonth(currentMonthStr);
  }

  const isCurrentMonth = selectedMonth === currentMonthStr;

  return (
    <MonthContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        prevMonth,
        nextMonth,
        resetToCurrentMonth,
        isCurrentMonth,
        currentMonth: currentMonthStr,
        historyList,
        loadingHistory,
        refreshHistory: fetchHistory,
      }}
    >
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error("useMonth must be used within a MonthProvider");
  }
  return context;
}
