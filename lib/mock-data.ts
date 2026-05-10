import { Brief, BriefSection, Client, Company } from "./types";

export const companies: Company[] = [
  {
    id: "company-1",
    name: "Northline Studio",
    plan: "Agency Workspace",
    employeesCount: 8,
    clientsCount: 14,
  },
  {
    id: "company-2",
    name: "Luma Digital",
    plan: "Creative Team",
    employeesCount: 5,
    clientsCount: 9,
  },
];

export const clients: Client[] = [
  {
    id: "client-1",
    companyId: "company-1",
    name: "Client One",
    email: "client.one@example.com",
    contactPerson: "Project Lead",
    industry: "E-commerce",
    activeBriefs: 2,
    lastActivity: "Today",
  },
  {
    id: "client-2",
    companyId: "company-1",
    name: "Client Two",
    email: "client.two@example.com",
    contactPerson: "Marketing Manager",
    industry: "Mobile App",
    activeBriefs: 1,
    lastActivity: "Yesterday",
  },
  {
    id: "client-3",
    companyId: "company-1",
    name: "Client Three",
    email: "client.three@example.com",
    contactPerson: "Founder",
    industry: "Branding",
    activeBriefs: 3,
    lastActivity: "3 days ago",
  },
];

export const briefs: Brief[] = [
  {
    id: "brief-1",
    companyId: "company-1",
    clientId: "client-1",
    title: "Website Redesign Brief",
    status: "needs_revision",
    completion: 78,
    missing: ["Budget", "Launch date", "Target platform"],
    version: 2,
    updatedAt: "2 hours ago",
  },
  {
    id: "brief-2",
    companyId: "company-1",
    clientId: "client-2",
    title: "Mobile App Intake",
    status: "confirmed",
    completion: 100,
    missing: [],
    version: 3,
    updatedAt: "1 day ago",
  },
  {
    id: "brief-3",
    companyId: "company-1",
    clientId: "client-3",
    title: "Brand Identity Package",
    status: "sent",
    completion: 92,
    missing: ["Final logo direction"],
    version: 1,
    updatedAt: "3 hours ago",
  },
];

export const briefSections: BriefSection[] = [
  {
    id: "summary",
    title: "What the client wants",
    content:
      "The client wants a clean digital experience that explains the service clearly and makes it easier for users to request a quote.",
    status: "accepted",
  },
  {
    id: "goals",
    title: "Goals & success criteria",
    content:
      "The project should improve clarity, reduce repeated questions, and create a smoother intake flow for new leads.",
    status: "pending",
  },
  {
    id: "gaps",
    title: "Gaps & unclear points",
    content:
      "Budget, final launch date, and required integrations were not clearly mentioned in the uploaded material.",
    status: "needs_edit",
    clientComment: "We have a fixed launch date. Please add it to the brief.",
  },
  {
    id: "questions",
    title: "Suggested follow-up questions",
    content:
      "What is the target launch date? What budget range should the team plan around? Which platform should be prioritized first?",
    status: "pending",
  },
];