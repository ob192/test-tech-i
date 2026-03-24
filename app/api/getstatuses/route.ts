import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CRM_API_BASE!;
const TOKEN = process.env.CRM_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(`${API_BASE}/getstatuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: TOKEN },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.data && typeof data.data === "string") {
      try {
        data.data = JSON.parse(data.data);
      } catch {
        // leave as-is
      }
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: false, error: "Internal server error" }, { status: 500 });
  }
}
