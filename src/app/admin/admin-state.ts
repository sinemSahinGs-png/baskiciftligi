export interface AdminActionState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const initialAdminActionState: AdminActionState = { status: "idle" };
