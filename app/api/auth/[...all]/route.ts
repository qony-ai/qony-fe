import { toNextJsHandler } from "better-auth/next-js";

import { auth, ensureAuthReady } from "@/src/lib/auth/server";

const authHandler = toNextJsHandler(auth);

async function handleRequest(
  request: Request,
  action: (request: Request) => Promise<Response>,
) {
  await ensureAuthReady();
  return action(request);
}

export async function GET(request: Request) {
  return handleRequest(request, authHandler.GET);
}

export async function POST(request: Request) {
  return handleRequest(request, authHandler.POST);
}

export async function PATCH(request: Request) {
  return handleRequest(request, authHandler.PATCH);
}

export async function PUT(request: Request) {
  return handleRequest(request, authHandler.PUT);
}

export async function DELETE(request: Request) {
  return handleRequest(request, authHandler.DELETE);
}
