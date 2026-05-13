import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function gatewayBase(): string {
  return (process.env.GATEWAY_INTERNAL_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function forwardHeaders(req: NextRequest): Headers {
  const out = new Headers();
  req.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low === "host") return;
    if (HOP_BY_HOP.has(low)) return;
    out.set(key, value);
  });
  return out;
}

async function proxy(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const pathPart = segments.length ? segments.join("/") : "";
  const url = `${gatewayBase()}/${pathPart}${req.nextUrl.search}`;
  const headers = forwardHeaders(req);
  // Some Next.js setups drop Authorization before it reaches Route Handlers; client sends x-firebase-token too.
  const authHeader =
    req.headers.get("authorization") ??
    req.headers.get("Authorization");
  const xfToken = req.headers.get("x-firebase-token");
  if (!headers.get("authorization") && !headers.get("Authorization")) {
    if (authHeader) {
      headers.set("Authorization", authHeader);
    } else if (xfToken) {
      headers.set("Authorization", `Bearer ${xfToken}`);
    }
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;
  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody ? body : undefined,
  });
  const buf = await upstream.arrayBuffer();
  const res = new NextResponse(buf, { status: upstream.status });
  upstream.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low === "transfer-encoding") return;
    res.headers.set(key, value);
  });
  return res;
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}
