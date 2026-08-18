export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fields?: Record<string, string[] | undefined>;
}

export const initialAuthState: AuthActionState = { status: "idle" };
