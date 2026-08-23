import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    
    let query = {};
    if (month) {
      const [year, m] = month.split("-");
      query.month = parseInt(m);
      query.year = parseInt(year);
    }
    
    const expenses = await db.collection("flat_expenses").find(query).sort({ category: 1 }).toArray();
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDB();
    const body = await request.json();
    const { month: monthStr, category, amount } = body;
    const [year, m] = monthStr.split("-");
    
    // Upsert by category + month + year
    const result = await db.collection("flat_expenses").updateOne(
      { category, month: parseInt(m), year: parseInt(year) },
      {
        $set: {
          category,
          amount: Number(amount) || 0,
          month: parseInt(m),
          year: parseInt(year),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    
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
    await db.collection("flat_expenses").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
