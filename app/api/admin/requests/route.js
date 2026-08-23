import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

function isSuperAdminOrAdmin(authHeader) {
  return (
    authHeader === "super_admin" ||
    authHeader === "asif" ||
    authHeader === "admin"
  );
}

// GET all pending join requests
export async function GET(request) {
  try {
    const roleHeader = request.headers.get("x-user-role");
    if (!isSuperAdminOrAdmin(roleHeader)) {
      return NextResponse.json(
        { error: "Access denied. Only Super Admin can view join requests." },
        { status: 403 }
      );
    }

    const db = await getDB();
    const requests = await db
      .collection("users")
      .find({ status: "pending" })
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST approve a pending member request
export async function POST(request) {
  try {
    const roleHeader = request.headers.get("x-user-role");
    if (!isSuperAdminOrAdmin(roleHeader)) {
      return NextResponse.json(
        { error: "Only Super Admin can approve membership requests." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const db = await getDB();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: "User request not found" }, { status: 404 });
    }

    if (action === "approve") {
      // 1. Create or reactivate member in members collection
      let memberId = user.memberId;
      if (memberId) {
        // If already had a linked memberId, reactivate it
        await db.collection("members").updateOne(
          { _id: new ObjectId(memberId) },
          {
            $set: {
              name: user.name,
              phone: user.phone || "",
              username: user.username,
              active: true,
              role: "member",
              hasLogin: true,
              updatedAt: new Date(),
            },
          }
        );
      } else {
        // Insert new member record
        const newMember = {
          name: user.name,
          phone: user.phone || "",
          username: user.username,
          userId: user._id.toString(),
          active: true,
          role: "member",
          hasLogin: true,
          createdAt: new Date(),
        };
        const memberResult = await db.collection("members").insertOne(newMember);
        memberId = memberResult.insertedId.toString();
      }

      // 2. Update user status in users collection
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            status: "approved",
            active: true,
            role: "member",
            memberId: memberId,
            approvedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Member "${user.name}" (@${user.username}) approved and flat access granted!`,
        memberId,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE reject/decline a pending member request
export async function DELETE(request) {
  try {
    const roleHeader = request.headers.get("x-user-role");
    if (!isSuperAdminOrAdmin(roleHeader)) {
      return NextResponse.json(
        { error: "Only Super Admin can reject membership requests." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const db = await getDB();
    await db.collection("users").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Membership request declined and removed.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
