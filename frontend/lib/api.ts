import type { InvitePayload, InviteProfile, InviteResponses } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
}

export function loginInvite(profile: InviteProfile): Promise<InvitePayload> {
  return request<InvitePayload>("/api/invites/login", {
    method: "POST",
    body: JSON.stringify(profile)
  });
}

export function submitInvite(inviteId: string, responses: InviteResponses): Promise<InvitePayload> {
  return request<InvitePayload>(`/api/invites/${inviteId}/submit`, {
    method: "POST",
    body: JSON.stringify({ responses })
  });
}
