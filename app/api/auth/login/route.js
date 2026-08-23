import { getDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const SUPER_ADMIN = {
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

    // Check fixed Super Admin
    if (cleanUser === SUPER_ADMIN.username.toLowerCase() && password === SUPER_ADMIN.password) {
      return NextResponse.json({
        success: true,
        user: {
          username: SUPER_ADMIN.username,
          name: SUPER_ADMIN.name,
          role: SUPER_ADMIN.role,
          isSuperAdmin: true,
        },
      });
    }

    // Check custom assigned admins / sub-managers in database
    try {
      const db = await getDB();
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
