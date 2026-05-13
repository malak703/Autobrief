export type BusinessOwner = {
  id: string;
  user_id: string;
  company_name: string | null;
  full_name: string | null;
  logo_url: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  owner_id: string;
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
};

export type BriefStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "needs_revision";

export type Brief = {
  id: string;
  client_id: string;
  owner_id: string;
  token: string;
  version: number;
  parent_id: string | null;
  status: BriefStatus;
  raw_input: string | null;
  voice_url: string | null;
  image_urls: string[] | null;
  filtered_content: string | null;
  summary: string | null;
  goals: string | null;
  gaps: string | null;
  followup_questions: string | null;
  extracted_date: string | null;
  completion_score: number | null;
  created_at: string;
  confirmed_at: string | null;
  final_proposal: string | null;
};

export type Feedback = {
  id: string;
  brief_id: string;
  section: "summary" | "goals" | "gaps" | "followup";
  status: "accepted" | "needs_edit";
  text_comment: string | null;
  voice_url: string | null;
  voice_transcript: string | null;
  created_at: string;
};

/** UI shape for editable brief sections (dashboard). */
export type BriefSection = {
  id: "summary" | "goals" | "gaps" | "followup";
  title: string;
  content: string;
  status: "accepted" | "needs_edit" | "pending";
  clientComment?: string;
};
