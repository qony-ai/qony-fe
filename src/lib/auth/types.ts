export type UserPlan = "free" | "pro";

export interface AuthSession {
  id: string;
  username: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  plan: UserPlan;
  entitlements: string[];
}
