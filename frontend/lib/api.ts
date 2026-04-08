import type { InvitePayload, InviteProfile, InviteProgress, InviteResponses } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
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

export function getInviteSession(): Promise<InvitePayload> {
  return request<InvitePayload>("/api/invites/session");
}

export function saveInviteDraft(
  inviteId: string,
  responses: InviteResponses,
  progress: InviteProgress,
  init?: Omit<RequestInit, "method" | "body">
): Promise<InvitePayload> {
  return request<InvitePayload>(`/api/invites/${inviteId}/draft`, {
    ...init,
    method: "PATCH",
    body: JSON.stringify({ responses, progress })
  });
}

export function submitInvite(inviteId: string, responses: InviteResponses, progress: InviteProgress): Promise<InvitePayload> {
  return request<InvitePayload>(`/api/invites/${inviteId}/submit`, {
    method: "POST",
    body: JSON.stringify({ responses, progress })
  });
}
