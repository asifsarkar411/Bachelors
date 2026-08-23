import { getDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const DEFAULT_SUPER_ADMIN = {
  username: "asif",
  password: "Asif@123",
  name: "SM FERDOUS AHMMED (ASIF)",
  role: "super_admin",
};

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();
    const db = await getDB();

    // 1. Check custom Super Admin credentials in settings
    try {
      const superAdminSetting = await db
        .collection("settings")
        .findOne({ key: "super_admin_credentials" });

      if (superAdminSetting && superAdminSetting.value) {
        const storedAdmin = superAdminSetting.value;
        if (
          cleanUser === storedAdmin.username.toLowerCase() &&
          password === storedAdmin.password
        ) {
          return NextResponse.json({
            success: true,
            user: {
              username: storedAdmin.username,
              name: storedAdmin.name || DEFAULT_SUPER_ADMIN.name,
              role: "super_admin",
              isSuperAdmin: true,
            },
          });
        }
      } else {
        // Fallback to default super admin
        if (
          cleanUser === DEFAULT_SUPER_ADMIN.username.toLowerCase() &&
          password === DEFAULT_SUPER_ADMIN.password
        ) {
          return NextResponse.json({
            success: true,
            user: {
              username: DEFAULT_SUPER_ADMIN.username,
              name: DEFAULT_SUPER_ADMIN.name,
              role: DEFAULT_SUPER_ADMIN.role,
              isSuperAdmin: true,
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn("DB settings query warning:", dbErr.message);
      // In case of DB query error, allow default super admin login
      if (
        cleanUser === DEFAULT_SUPER_ADMIN.username.toLowerCase() &&
        password === DEFAULT_SUPER_ADMIN.password
      ) {
        return NextResponse.json({
          success: true,
          user: {
            username: DEFAULT_SUPER_ADMIN.username,
            name: DEFAULT_SUPER_ADMIN.name,
            role: DEFAULT_SUPER_ADMIN.role,
            isSuperAdmin: true,
          },
        });
      }
    }

    // 2. Check custom assigned admins / sub-managers in users collection
    try {
      const user = await db.collection("users").findOne({
        username: cleanUser,
        password: password,
        active: true,
      });

      if (user) {
        return NextResponse.json({
          success: true,
          user: {
            id: user._id.toString(),
            username: user.username,
            name: user.name || user.username,
            role: user.role || "sub_manager",
            isSuperAdmin: false,
            memberId: user.memberId || null,
          },
        });
      }
    } catch (dbErr) {
      console.warn("DB user query warning:", dbErr.message);
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
