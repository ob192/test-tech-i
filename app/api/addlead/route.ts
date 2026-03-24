import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.CRM_API_BASE!;
const TOKEN = process.env.CRM_TOKEN!;

function getRealIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = getRealIp(req);
    const landingUrl =
      req.headers.get("origin") ??
      req.headers.get("referer")?.split("?")[0] ??
      "unknown";

    const payload = {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      email: body.email,
      clickId: body.clickId ?? "",
      custom1: body.custom1 ?? "",
      custom2: body.custom2 ?? "",
      custom3: body.custom3 ?? "",
      box_id: 28,
      offer_id: 5,
      countryCode: "GB",
      language: "en",
      password: "qwerty12",
      ip,
      landingUrl,
    };

    const response = await fetch(`${API_BASE}/addlead`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: TOKEN },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: false, error: "Internal server error" }, { status: 500 });
  }
}
