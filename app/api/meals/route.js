import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // format: YYYY-MM
    
    let query = {};
    if (month) {
      const [year, m] = month.split("-");
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      query.date = { $gte: start.toISOString().split("T")[0], $lte: end.toISOString().split("T")[0] };
    }
    
    const meals = await db.collection("meals").find(query).sort({ date: 1 }).toArray();
    return NextResponse.json(meals);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDB();
    const body = await request.json();
    
    // Bulk upsert: body is { date, meals: [{ memberId, dayMeal, nightMeal }] }
    const { date, meals } = body;
    
    const ops = meals.map((m) => ({
      updateOne: {
        filter: { date, memberId: m.memberId },
        update: {
          $set: {
            date,
            memberId: m.memberId,
            dayMeal: Number(m.dayMeal) || 0,
            nightMeal: Number(m.nightMeal) || 0,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));
    
    if (ops.length > 0) {
      await db.collection("meals").bulkWrite(ops);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await db.collection("meals").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
