import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { DEFAULT_SUPER_ADMIN } from "@/app/api/auth/login/route";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      currentUsername,
      currentPassword,
      newUsername,
      newPassword,
      role = "sub_manager",
      userId,
    } = body;

    if (!currentPassword || !newPassword || !newUsername) {
      return NextResponse.json(
        { error: "Current password, new username, and new password are required" },
        { status: 400 }
      );
    }

    const cleanNewUser = newUsername.trim().toLowerCase();
    const db = await getDB();

    // CASE 1: SUPER ADMIN CREDENTIAL CHANGE
    if (role === "super_admin" || currentUsername?.toLowerCase() === "asif") {
      // Check current password against DB or default
      const superAdminSetting = await db
        .collection("settings")
        .findOne({ key: "super_admin_credentials" });

      let validCurrentPassword = false;
      let currentAdminName = DEFAULT_SUPER_ADMIN.name;

      if (superAdminSetting && superAdminSetting.value) {
        if (superAdminSetting.value.password === currentPassword) {
          validCurrentPassword = true;
          currentAdminName = superAdminSetting.value.name || DEFAULT_SUPER_ADMIN.name;
        }
      } else {
        if (currentPassword === DEFAULT_SUPER_ADMIN.password) {
          validCurrentPassword = true;
        }
      }

      if (!validCurrentPassword) {
        return NextResponse.json(
          { error: "Incorrect current password for Super Admin" },
          { status: 401 }
        );
      }

      // Update Super Admin credentials in settings
      const newAdminData = {
        username: cleanNewUser,
        password: newPassword,
        name: currentAdminName,
        updatedAt: new Date(),
      };

      await db.collection("settings").updateOne(
        { key: "super_admin_credentials" },
        { $set: { key: "super_admin_credentials", value: newAdminData } },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: "Super Admin credentials updated successfully!",
        user: {
          username: cleanNewUser,
          name: currentAdminName,
          role: "super_admin",
          isSuperAdmin: true,
        },
      });
    }

    // CASE 2: SUB-MANAGER / ADMIN CREDENTIAL CHANGE
    let query = {};
    if (userId) {
      query._id = new ObjectId(userId);
    } else if (currentUsername) {
      query.username = currentUsername.trim().toLowerCase();
    } else {
      return NextResponse.json(
        { error: "User identification missing" },
        { status: 400 }
      );
    }

    const existingUser = await db.collection("users").findOne(query);

    if (!existingUser) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    if (existingUser.password !== currentPassword) {
      return NextResponse.json(
        { error: "Incorrect current password" },
        { status: 401 }
      );
    }

    // If changing username, check if username is already taken by another account
    if (cleanNewUser !== existingUser.username) {
      const duplicate = await db.collection("users").findOne({
        username: cleanNewUser,
        _id: { $ne: existingUser._id },
      });
      if (duplicate || cleanNewUser === "asif") {
        return NextResponse.json(
          { error: "This username is already taken. Please choose another." },
          { status: 400 }
        );
      }
    }

    // Update user record
    await db.collection("users").updateOne(
      { _id: existingUser._id },
      {
        $set: {
          username: cleanNewUser,
          password: newPassword,
          updatedAt: new Date(),
        },
      }
    );

    // If linked to a member, update member username too
    if (existingUser.memberId) {
      try {
        await db.collection("members").updateOne(
          { _id: new ObjectId(existingUser.memberId) },
          { $set: { username: cleanNewUser } }
        );
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: "Credentials updated successfully!",
      user: {
        id: existingUser._id.toString(),
        username: cleanNewUser,
        name: existingUser.name,
        role: existingUser.role,
        isSuperAdmin: false,
        memberId: existingUser.memberId || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
