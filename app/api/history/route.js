import { getDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDB();

    // Find all distinct dates from meals
    const mealDates = await db.collection("meals").distinct("date");
    // Find all distinct dates from bajar
    const bajarDates = await db.collection("bajar").distinct("date");
    // Find all distinct month-years from flat_expenses
    const flatExpenses = await db.collection("flat_expenses").find().toArray();

    const monthSet = new Set();

    mealDates.forEach((d) => {
      if (d && typeof d === "string" && d.length >= 7) {
        monthSet.add(d.substring(0, 7));
      }
    });

    bajarDates.forEach((d) => {
      if (d && typeof d === "string" && d.length >= 7) {
        monthSet.add(d.substring(0, 7));
      }
    });

    flatExpenses.forEach((fe) => {
      if (fe.year && fe.month) {
        const mStr = `${fe.year}-${String(fe.month).padStart(2, "0")}`;
        monthSet.add(mStr);
      }
    });

    // Always include current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    monthSet.add(currentMonth);

    // Sort descending (latest month first)
    const sortedMonths = Array.from(monthSet).sort().reverse();

    // Fetch summary statistics for each month in parallel
    const historyPromises = sortedMonths.map(async (month) => {
      const [year, m] = month.split("-");
      const startDate = `${year}-${m}-01`;
      const endDay = new Date(year, m, 0).getDate();
      const endDate = `${year}-${m}-${String(endDay).padStart(2, "0")}`;

      const [meals, bajar, flatExp] = await Promise.all([
        db.collection("meals").find({ date: { $gte: startDate, $lte: endDate } }).toArray(),
        db.collection("bajar").find({ date: { $gte: startDate, $lte: endDate } }).toArray(),
        db.collection("flat_expenses").find({ month: parseInt(m), year: parseInt(year) }).toArray(),
      ]);

      const totalBajar = bajar.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const totalMeals = meals.reduce(
        (sum, ml) => sum + (Number(ml.dayMeal) || 0) + (Number(ml.nightMeal) || 0),
        0
      );
      const totalFlatExpenses = flatExp.reduce((sum, fe) => sum + (Number(fe.amount) || 0), 0);
      const mealRate = totalMeals > 0 ? Math.round((totalBajar / totalMeals) * 100) / 100 : 0;

      const dateObj = new Date(parseInt(year), parseInt(m) - 1, 1);
      const monthName = dateObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      return {
        month,
        monthName,
        totalMeals,
        totalBajar,
        mealRate,
        totalFlatExpenses,
        mealRecordsCount: meals.length,
        bajarCount: bajar.length,
        isCurrent: month === currentMonth,
      };
    });

    const history = await Promise.all(historyPromises);

    return NextResponse.json({
      currentMonth,
      history,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
