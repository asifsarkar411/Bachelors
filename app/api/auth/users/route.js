import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// Helper to verify if requester is super_admin
function isSuperAdmin(authHeader) {
  return authHeader === "super_admin" || authHeader === "asif";
}

// GET all assigned managers / admins
export async function GET(request) {
  try {
    const db = await getDB();
    const users = await db
      .collection("users")
      .find({ active: { $ne: false } })
      .project({ password: 0 }) // omit password for security
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create or assign a new sub-manager / admin
export async function POST(request) {
  try {
    const roleHeader = request.headers.get("x-user-role");
    if (!isSuperAdmin(roleHeader)) {
      return NextResponse.json(
        { error: "Only Super Admin can assign managers or admins" },
        { status: 403 }
      );
    }

    const db = await getDB();
    const body = await request.json();
    const { username, password, name, role = "sub_manager", memberId } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();

    // Prevent overriding fixed super admin
    if (cleanUser === "asif") {
      return NextResponse.json(
        { error: "'asif' is reserved for Super Admin" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.collection("users").findOne({ username: cleanUser });
    if (existing) {
      // Update existing
      await db.collection("users").updateOne(
        { _id: existing._id },
        {
          $set: {
            password,
            name: name || existing.name,
            role,
            memberId: memberId || existing.memberId || null,
            active: true,
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ success: true, message: "User updated successfully" });
    }

    // Insert new user
    const newUser = {
      username: cleanUser,
      password,
      name: name || cleanUser,
      role: role === "admin" ? "admin" : "sub_manager",
      memberId: memberId || null,
      active: true,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);

    // If linked to a member, update member's role flag too
    if (memberId) {
      try {
        await db.collection("members").updateOne(
          { _id: new ObjectId(memberId) },
          { $set: { role: newUser.role, hasLogin: true, username: cleanUser } }
        );
      } catch (err) {
        console.warn("Could not update member record:", err.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: { _id: result.insertedId, username: cleanUser, name: newUser.name, role: newUser.role },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE or unassign sub-manager / admin
export async function DELETE(request) {
  try {
    const roleHeader = request.headers.get("x-user-role");
    if (!isSuperAdmin(roleHeader)) {
      return NextResponse.json(
        { error: "Only Super Admin can unassign managers" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const memberId = searchParams.get("memberId");

    if (!id && !memberId) {
      return NextResponse.json({ error: "ID or memberId required" }, { status: 400 });
    }

    const db = await getDB();

    if (id) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
      if (user && user.memberId) {
        try {
          await db.collection("members").updateOne(
            { _id: new ObjectId(user.memberId) },
            { $unset: { role: "", hasLogin: "", username: "" } }
          );
        } catch (e) {}
      }
      await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    } else if (memberId) {
      await db.collection("users").deleteMany({ memberId });
      try {
        await db.collection("members").updateOne(
          { _id: new ObjectId(memberId) },
          { $unset: { role: "", hasLogin: "", username: "" } }
        );
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: "Unassigned successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
