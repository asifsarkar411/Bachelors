import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDB();
    const members = await db
      .collection("members")
      .find({ active: true })
      .sort({ createdAt: 1 })
      .toArray();
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDB();
    const body = await request.json();
    const member = {
      name: body.name,
      phone: body.phone || "",
      active: true,
      createdAt: new Date(),
    };
    const result = await db.collection("members").insertOne(member);
    return NextResponse.json(
      { ...member, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const db = await getDB();
    const body = await request.json();
    const { _id, ...update } = body;
    await db
      .collection("members")
      .updateOne({ _id: new ObjectId(_id) }, { $set: update });
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
    // Soft delete - mark as inactive
    await db
      .collection("members")
      .updateOne({ _id: new ObjectId(id) }, { $set: { active: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
