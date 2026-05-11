const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL

export interface User {
  id: number;
  email: string;
  name: string;
  role: "user" | "caregiver" | "admin";
  preferred_language: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string; 
  user: User;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Login failed");
  }

  return res.json();
}

export async function apiRegister(data: {
  email: string;
  password: string;
  name: string;
  role?: "user" | "caregiver";
}): Promise<AuthResponse | User> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Register failed");
  }

  return res.json();
}

export async function apiGetMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
}

export interface GestureMappingEffective {
  model_label: string
  default_text: string
  custom_text: string | null
  effective_text: string
}

export async function apiGetMyGestureMapping(token: string): Promise<GestureMappingEffective[]> {
  const res = await fetch(`${API_BASE_URL}/gestures/my-mapping`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Không load được gesture mapping")
  }

  return res.json()
}

export async function apiUpsertMyGestureMapping(
  token: string,
  modelLabel: string,
  customText: string,
): Promise<GestureMappingEffective> {
  const res = await fetch(`${API_BASE_URL}/gestures/my-mapping/${modelLabel}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ custom_text: customText }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Không cập nhật được mapping")
  }

  return res.json()
}

export async function apiDeleteMyGestureMapping(token: string, modelLabel: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/gestures/my-mapping/${modelLabel}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Không xoá được mapping")
  }
}

export interface CaregiverPatientRelation {
  id: number
  caregiver_id: number
  patient_id: number
  relation_type?: string | null
  patient: {
    id: number
    email: string
    name: string
    role: string
    preferred_language: string
    is_active: boolean
  }
}

export interface CaregiverPredictionItem {
  id: number
  gesture_label: string
  predicted_text?: string | null
  confidence: number
  has_hand: boolean
  created_at: string
}

export async function apiCaregiverGetPatients(token: string): Promise<CaregiverPatientRelation[]> {
  const res = await fetch(`${API_BASE_URL}/caregiver/patients`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiCaregiverLinkPatient(token: string, patientEmail: string, relationType?: string) {
  const res = await fetch(`${API_BASE_URL}/caregiver/patients/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      patient_email: patientEmail,
      relation_type: relationType ?? null,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiCaregiverUnlinkPatient(token: string, patientId: number) {
  const res = await fetch(`${API_BASE_URL}/caregiver/patients/${patientId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function apiCaregiverGetPatientProfile(token: string, patientId: number) {
  const res = await fetch(`${API_BASE_URL}/caregiver/patients/${patientId}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiCaregiverGetPatientPredictions(token: string, patientId: number) {
  const res = await fetch(`${API_BASE_URL}/caregiver/patients/${patientId}/predictions`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiCaregiverGetPatientStats(token: string, patientId: number, days = 7) {
  const res = await fetch(`${API_BASE_URL}/caregiver/patients/${patientId}/stats?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiCaregiverGetPatientGestureMapping(token: string, patientId: number) {
  const res = await fetch(`${API_BASE_URL}/caregiver/patients/${patientId}/gesture-mapping`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiCaregiverUpdatePatientGestureMapping(
  token: string,
  patientId: number,
  modelLabel: string,
  customText: string
) {
  const res = await fetch(`${API_BASE_URL}/caregiver/patients/${patientId}/gesture-mapping/${modelLabel}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ custom_text: customText }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export type AdminCreateUserPayload = {
  name: string
  email: string
  password: string
  role: "user" | "caregiver" | "admin"
}

export async function apiAdminCreateUser(token: string, payload: AdminCreateUserPayload) {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(await res.text())
  return res.json()
}