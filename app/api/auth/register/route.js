import { getDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, username, phone = "", password, notes = "" } = body;

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Full Name, Username, and Password are required." },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();

    if (cleanUser.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters long." },
        { status: 400 }
      );
    }

    if (cleanUser === "asif") {
      return NextResponse.json(
        { error: "'asif' is reserved for Super Admin." },
        { status: 400 }
      );
    }

    const db = await getDB();

    // Check if user already exists
    const existing = await db.collection("users").findOne({ username: cleanUser });
    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json(
          {
            error:
              "A join request with this username is already pending Super Admin approval. Please wait for confirmation.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 400 }
      );
    }

    const newRequest = {
      name: name.trim(),
      username: cleanUser,
      phone: phone.trim(),
      password: password,
      role: "member",
      status: "pending",
      active: false,
      notes: notes.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newRequest);

    return NextResponse.json(
      {
        success: true,
        message:
          "Sign-up request submitted successfully! Your request has been sent to Super Admin for approval. Once accepted, you can log in and add to the Bajar List.",
        requestId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
