import {
  CircleUserRound,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

type Status = "In Progress" | "Stable" | "Review" | "Pending";

const statusStyles: Record<Status, string> = {
  "In Progress": "bg-[var(--lavender-bg)] text-[var(--purple-primary)]",
  Stable: "bg-[var(--green-bg)] text-[var(--green-text)]",
  Review: "bg-[var(--orange-bg)] text-[var(--orange-text)]",
  Pending: "bg-[var(--orange-bg)] text-[var(--orange-text)]",
};

const statColor: Record<string, string> = {
  Total: "text-[var(--purple-primary)]",
  Review: "text-[var(--orange-text)]",
  Stable: "text-[var(--green-text)]",
};

interface Patient {
  initials: string;
  name: string;
  age: number;
  concern: string;
  lastVisit: string;
  status: Status;
  variant: "purple" | "lavender";
}

const patients: Patient[] = [
  { initials: "JL", name: "Jordan Lee", age: 34, concern: "Chest pain, fatigue", lastVisit: "Mar 10, 2026", status: "In Progress", variant: "purple" },
  { initials: "AO", name: "Amara Osei", age: 28, concern: "Chronic migraines", lastVisit: "Mar 10, 2026", status: "Stable", variant: "lavender" },
  { initials: "DC", name: "David Chen", age: 52, concern: "Type 2 diabetes", lastVisit: "Mar 8, 2026", status: "Review", variant: "purple" },
  { initials: "MS", name: "Maria Santos", age: 45, concern: "Lower back pain", lastVisit: "Mar 7, 2026", status: "Stable", variant: "lavender" },
  { initials: "EB", name: "Elijah Brooks", age: 61, concern: "Hypertension", lastVisit: "Mar 5, 2026", status: "In Progress", variant: "purple" },
  { initials: "PS", name: "Priya Sharma", age: 39, concern: "Anxiety, insomnia", lastVisit: "Mar 3, 2026", status: "Pending", variant: "lavender" },
];

const activities = [
  { name: "Jordan Lee \u2014 Follow-up", time: "Today, 8:30 AM", active: true },
  { name: "David Chen \u2014 Lab Review", time: "Yesterday, 2:15 PM", active: false },
  { name: "Amara Osei \u2014 Notes updated", time: "Yesterday, 11:00 AM", active: false },
];

const stats = [
  { num: "12", label: "Total" },
  { num: "4", label: "Review" },
  { num: "6", label: "Stable" },
];

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[12px] px-3 py-1 text-[11px] font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default function PatientsPage() {
  return (
    <div className="flex h-full w-full flex-col bg-[var(--page-bg)] font-poppins">
      {/* ── Navigation Bar ── */}
      <nav className="flex h-16 shrink-0 items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <span className="gradient-logo text-[24px] font-medium tracking-[-0.1px]">
            diagnostic
          </span>

          <div className="flex gap-2">
            <button className="nav-pill-active flex items-center justify-center rounded-[20px] px-5 py-2">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--purple-primary)]">
                Patients
              </span>
            </button>
            <button className="flex items-center justify-center rounded-[20px] border border-[var(--border-nav-inactive)] bg-transparent px-5 py-2 transition-colors hover:bg-[var(--lavender-bg)]">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">
                Schedule
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CircleUserRound
            className="h-7 w-7 text-[var(--purple-primary)]"
            strokeWidth={1.5}
          />
          <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
            Dr. Patel
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--text-nav)]" />
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="flex min-h-0 flex-1 gap-6 p-7">
        {/* Left Column — Patient List */}
        <div className="flex min-h-0 flex-1 flex-col gap-5">
          {/* Welcome header */}
          <div className="flex items-center justify-between py-5">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">
                Welcome back,
              </span>
              <h1 className="text-[32px] font-medium tracking-[-0.3px] text-[var(--text-primary)]">
                Dr. Maya Patel
              </h1>
            </div>
            <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">
              Tuesday, March 10, 2026
            </span>
          </div>

          {/* Section header with search */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-[28px] font-medium tracking-[-0.3px] text-[var(--text-primary)]">
                Your Patients
              </h2>
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">
                12 active patients
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="glass-control flex h-10 w-[260px] items-center gap-2 rounded-[20px] px-4">
                <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <span className="text-[13px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">
                  Search patients...
                </span>
              </div>
              <button className="glass-control flex h-10 items-center gap-2 rounded-[20px] px-4 transition-opacity hover:opacity-80">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--text-nav)]" />
                <span className="text-[13px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">
                  Filters
                </span>
              </button>
            </div>
          </div>

          {/* Patient table card */}
          <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px]">
            {/* Column headers */}
            <div className="flex shrink-0 items-center px-6 py-3.5 [border-bottom:var(--table-border-header)]">
              <div className="flex-1 text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)]">
                Patient
              </div>
              <div className="w-[80px] text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)]">
                Age
              </div>
              <div className="w-[200px] text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)]">
                Primary Concern
              </div>
              <div className="w-[120px] text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)]">
                Last Visit
              </div>
              <div className="w-[110px] text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)]">
                Status
              </div>
            </div>

            {/* Patient rows */}
            <div className="flex-1 overflow-y-auto">
              {patients.map((patient, index) => (
                <div
                  key={patient.name}
                  className={`flex cursor-pointer items-center px-6 py-3.5 transition-colors hover:bg-[rgba(243,237,250,0.5)] ${
                    index < patients.length - 1
                      ? "[border-bottom:var(--table-border-row)]"
                      : ""
                  }`}
                >
                  <div className="flex flex-1 items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] text-[12px] font-medium ${
                        patient.variant === "purple"
                          ? "bg-[var(--avatar-purple-bg)] text-[var(--purple-primary)]"
                          : "bg-[var(--avatar-lavender-bg)] text-[var(--purple-dark)]"
                      }`}
                    >
                      {patient.initials}
                    </div>
                    <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
                      {patient.name}
                    </span>
                  </div>
                  <div className="w-[80px] text-[14px] font-medium text-[var(--text-secondary)]">
                    {patient.age}
                  </div>
                  <div className="w-[200px] text-[14px] font-medium tracking-[-0.1px] text-[var(--text-secondary)]">
                    {patient.concern}
                  </div>
                  <div className="w-[120px] text-[14px] font-medium tracking-[-0.1px] text-[var(--text-secondary)]">
                    {patient.lastVisit}
                  </div>
                  <div className="w-[110px]">
                    <StatusBadge status={patient.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex w-[320px] shrink-0 flex-col gap-5">
          {/* Overview card */}
          <div className="glass-card rounded-[24px] p-6">
            <h3 className="text-[16px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
              Overview
            </h3>
            <div className="mt-5 flex gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <span
                    className={`text-[28px] font-medium tracking-[-0.3px] ${statColor[s.label]}`}
                  >
                    {s.num}
                  </span>
                  <span className="text-[12px] font-medium text-[var(--text-muted)]">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity card */}
          <div className="glass-card flex flex-col gap-4 rounded-[24px] p-6">
            <h3 className="text-[16px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
              Recent Activity
            </h3>
            {activities.map((activity) => (
              <div key={activity.name} className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    activity.active
                      ? "bg-[var(--purple-primary)]"
                      : "bg-[var(--text-muted)]"
                  }`}
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[13px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
                    {activity.name}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Patient button */}
          <button className="glass-purple flex h-11 items-center justify-center gap-2 rounded-[22px] transition-all hover:brightness-110 hover:shadow-lg active:scale-[0.98]">
            <Plus className="h-[18px] w-[18px] text-white" />
            <span className="text-[14px] font-medium tracking-[-0.1px] text-white">
              Add Patient
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
