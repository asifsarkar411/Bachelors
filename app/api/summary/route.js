import { getDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    
    if (!month) {
      return NextResponse.json({ error: "Month parameter required" }, { status: 400 });
    }
    
    const [year, m] = month.split("-");
    const startDate = `${year}-${m}-01`;
    const endDay = new Date(year, m, 0).getDate();
    const endDate = `${year}-${m}-${String(endDay).padStart(2, "0")}`;
    
    // Get all active members
    const members = await db.collection("members").find({ active: true }).toArray();
    
    // Get all meals for the month
    const meals = await db.collection("meals").find({
      date: { $gte: startDate, $lte: endDate }
    }).toArray();
    
    // Get all bajar for the month
    const bajar = await db.collection("bajar").find({
      date: { $gte: startDate, $lte: endDate }
    }).toArray();
    
    // Get all cash collections for the month
    const cash = await db.collection("cash_collections").find({
      date: { $gte: startDate, $lte: endDate }
    }).toArray();
    
    // Calculate totals
    const totalCost = bajar.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const totalCollection = cash.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    
    // Calculate per-member stats
    const memberStats = members.map((member) => {
      const memberId = member._id.toString();
      
      // Total meals for this member
      const memberMeals = meals.filter((ml) => ml.memberId === memberId);
      const totalMeals = memberMeals.reduce(
        (sum, ml) => sum + (Number(ml.dayMeal) || 0) + (Number(ml.nightMeal) || 0),
        0
      );
      
      // Total cash paid by this member
      const totalPaid = cash
        .filter((c) => c.memberId === memberId)
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      
      // Total bajar done by this member
      const totalBajar = bajar
        .filter((b) => b.boughtBy === memberId)
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      
      return {
        memberId,
        name: member.name,
        totalMeals,
        totalPaid,
        totalBajar,
      };
    });
    
    const grandTotalMeals = memberStats.reduce((sum, m) => sum + m.totalMeals, 0);
    const mealRate = grandTotalMeals > 0 ? totalCost / grandTotalMeals : 0;
    
    // Calculate balance for each member
    const memberSummary = memberStats.map((m) => {
      const mealCost = m.totalMeals * mealRate;
      const balance = m.totalPaid - mealCost; // positive = overpaid, negative = owes
      return {
        ...m,
        mealCost: Math.round(mealCost * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      };
    });
    
    return NextResponse.json({
      month,
      totalCost,
      totalCollection,
      grandTotalMeals,
      mealRate: Math.round(mealRate * 100) / 100,
      cashBalance: totalCollection - totalCost,
      members: memberSummary,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
