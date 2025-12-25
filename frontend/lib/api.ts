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
  token_type: string; // "bearer"
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
  role?: "user" | "caregiver"; // nếu cho chọn role
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

  // tuỳ backend trả gì:
  // - Nếu bạn cho /auth/register trả luôn token + user → dùng AuthResponse
  // - Nếu chỉ trả user → sửa kiểu trả về cho phù hợp
  return res.json();
}

// Ví dụ: helper gọi API bảo vệ bằng JWT
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

