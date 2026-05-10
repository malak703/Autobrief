export type UserRole = "admin" | "employee";

export type Company = {
  id: string;
  name: string;
  plan: string;
  employeesCount: number;
  clientsCount: number;
};

export type Employee = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Client = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  contactPerson: string;
  industry: string;
  activeBriefs: number;
  lastActivity: string;
};

export type BriefStatus =
  | "draft"
  | "ready"
  | "sent"
  | "needs_revision"
  | "confirmed"
  | "locked";

export type Brief = {
  id: string;
  companyId: string;
  clientId: string;
  title: string;
  status: BriefStatus;
  completion: number;
  missing: string[];
  version: number;
  updatedAt: string;
};

export type BriefSection = {
  id: string;
  title: string;
  content: string;
  status: "accepted" | "needs_edit" | "pending";
  clientComment?: string;
};