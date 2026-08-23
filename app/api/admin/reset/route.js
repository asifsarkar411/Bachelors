import { getDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const roleHeader = request.headers.get("x-user-role");
    const isSuperAdmin = roleHeader === "super_admin" || roleHeader === "asif";

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Access denied. Only Super Admin can reset data." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, month } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Reset action parameter is required" },
        { status: 400 }
      );
    }

    const db = await getDB();
    let resultMessage = "";

    // Month date range helper
    let startDate = "";
    let endDate = "";
    let yearNum = 0;
    let monthNum = 0;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-");
      yearNum = parseInt(y);
      monthNum = parseInt(m);
      startDate = `${y}-${m}-01`;
      const endDay = new Date(yearNum, monthNum, 0).getDate();
      endDate = `${y}-${m}-${String(endDay).padStart(2, "0")}`;
    }

    switch (action) {
      // 1. Reset meals for a specific month
      case "reset_meals_month": {
        if (!month) {
          return NextResponse.json({ error: "Month is required for this action" }, { status: 400 });
        }
        const res = await db.collection("meals").deleteMany({
          date: { $gte: startDate, $lte: endDate },
        });
        resultMessage = `Successfully cleared ${res.deletedCount} meal records for ${month}.`;
        break;
      }

      // 2. Reset bajar list for a specific month
      case "reset_bajar_month": {
        if (!month) {
          return NextResponse.json({ error: "Month is required for this action" }, { status: 400 });
        }
        const res = await db.collection("bajar").deleteMany({
          date: { $gte: startDate, $lte: endDate },
        });
        resultMessage = `Successfully cleared ${res.deletedCount} bajar entries for ${month}.`;
        break;
      }

      // 3. Reset flat expenses for a specific month
      case "reset_flat_expenses_month": {
        if (!month) {
          return NextResponse.json({ error: "Month is required for this action" }, { status: 400 });
        }
        const res = await db.collection("flat_expenses").deleteMany({
          $or: [
            { month: monthNum, year: yearNum },
            { month: month },
          ],
        });
        resultMessage = `Successfully cleared ${res.deletedCount} flat expense records for ${month}.`;
        break;
      }

      // 4. Reset ALL data for a specific month (Meals + Bajar + Flat Expenses)
      case "reset_all_month": {
        if (!month) {
          return NextResponse.json({ error: "Month is required for this action" }, { status: 400 });
        }
        const [mealsRes, bajarRes, flatRes] = await Promise.all([
          db.collection("meals").deleteMany({ date: { $gte: startDate, $lte: endDate } }),
          db.collection("bajar").deleteMany({ date: { $gte: startDate, $lte: endDate } }),
          db.collection("flat_expenses").deleteMany({
            $or: [
              { month: monthNum, year: yearNum },
              { month: month },
            ],
          }),
        ]);
        resultMessage = `Successfully reset all data for ${month} (${mealsRes.deletedCount} meals, ${bajarRes.deletedCount} bajar items, ${flatRes.deletedCount} flat expenses).`;
        break;
      }

      // 5. Reset ALL meals across all history
      case "reset_all_meals": {
        const res = await db.collection("meals").deleteMany({});
        resultMessage = `Successfully cleared all ${res.deletedCount} historical meal records.`;
        break;
      }

      // 6. Reset ALL bajar across all history
      case "reset_all_bajar": {
        const res = await db.collection("bajar").deleteMany({});
        resultMessage = `Successfully cleared all ${res.deletedCount} historical bajar entries.`;
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid reset action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: resultMessage,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
