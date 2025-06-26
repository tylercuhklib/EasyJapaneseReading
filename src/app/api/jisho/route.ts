// src/app/api/jisho/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");
  if (!keyword) {
    return new Response(JSON.stringify({ error: "Missing keyword" }), { status: 400 });
  }
  const jishoRes = await fetch(
    `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`
  );
  const data = await jishoRes.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}