export interface AdminActionState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  nextPage?: number;
  hasMore?: boolean;
}

export const initialAdminActionState: AdminActionState = { status: "idle" };
