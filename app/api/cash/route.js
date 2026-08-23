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
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      query.date = { $gte: start.toISOString().split("T")[0], $lte: end.toISOString().split("T")[0] };
    }
    
    const cash = await db.collection("cash_collections").find(query).sort({ date: -1 }).toArray();
    return NextResponse.json(cash);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDB();
    const body = await request.json();
    const entry = {
      memberId: body.memberId,
      memberName: body.memberName || "",
      amount: Number(body.amount) || 0,
      date: body.date,
      note: body.note || "",
      createdAt: new Date(),
    };
    const result = await db.collection("cash_collections").insertOne(entry);
    return NextResponse.json(
      { ...entry, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await db.collection("cash_collections").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
