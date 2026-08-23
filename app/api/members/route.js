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
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    if (permanent) {
      // Hard delete from members and linked user account
      await db.collection("members").deleteOne({ _id: new ObjectId(id) });
      try {
        await db.collection("users").deleteMany({
          $or: [{ memberId: id }, { memberId: new ObjectId(id) }],
        });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "Member permanently deleted and access removed.",
      });
    }

    // Soft delete - mark as inactive in members and users collection
    await db
      .collection("members")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { active: false, deactivatedAt: new Date() } }
      );

    try {
      await db.collection("users").updateMany(
        { $or: [{ memberId: id }, { memberId: new ObjectId(id) }] },
        { $set: { active: false } }
      );
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: "Member deactivated successfully.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
