"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CircleUserRound,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Plus,
  CalendarPlus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { fetchPatients } from "@/lib/api";
import type { PatientRecord } from "@/lib/types";
import { AddPatientModal } from "./_components/AddPatientModal";
import { ScheduleModal } from "./_components/ScheduleModal";

type Status = "In Progress" | "Stable" | "Review" | "Pending";

const statusStyles: Record<Status, string> = {
  "In Progress": "bg-[var(--lavender-bg)] text-[var(--purple-primary)] bg-opacity-80 font-semibold",
  Stable: "bg-[var(--green-bg)] text-[var(--green-text)] bg-opacity-80 font-semibold",
  Review: "bg-[var(--orange-bg)] text-[var(--orange-text)] bg-opacity-80 font-semibold",
  Pending: "bg-[var(--orange-bg)] text-[var(--orange-text)] bg-opacity-80 font-semibold",
};

const statColor: Record<string, string> = {
  Total: "text-[var(--purple-primary)]",
  Review: "text-[var(--orange-text)]",
  Stable: "text-[var(--green-text)]",
};

// Fallback hardcoded patients for when API is unreachable
const HARDCODED_PATIENTS: PatientRecord[] = [];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function truncateAddress(addr: string) {
  if (!addr || addr.length < 12) return addr || "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status as Status] || statusStyles.Pending;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[12px] px-3 py-1 text-[11px] font-medium ${style}`}
    >
      {status}
    </span>
  );
}

const activities = [
  { name: "Jordan Lee — Follow-up", time: "Today, 8:30 AM", active: true },
  { name: "David Chen — Lab Review", time: "Yesterday, 2:15 PM", active: false },
  { name: "Amara Osei — Notes updated", time: "Yesterday, 11:00 AM", active: false },
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<PatientRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadPatients = useCallback(async () => {
    try {
      const data = await fetchPatients();
      // Merge API patients with hardcoded fallback patients
      setPatients([...HARDCODED_PATIENTS as PatientRecord[], ...data]);
    } catch {
      // If API unreachable, show hardcoded patients
      setPatients(HARDCODED_PATIENTS as PatientRecord[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.concern.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = patients.length;
  const reviewCount = patients.filter((p) => p.status === "Review").length;
  const stableCount = patients.filter((p) => p.status === "Stable").length;

  return (
    <div className="flex h-full w-full flex-col bg-[var(--page-bg)] font-poppins">
      {/* ── Navigation Bar ── */}
      <nav className="glass-nav flex h-16 shrink-0 items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <Link href="/patients" className="gradient-logo text-[24px] font-medium tracking-[-0.1px]">
            diagnostic
          </Link>

          <div className="flex gap-2">
            <Link href="/patients" className="nav-pill-active flex items-center justify-center rounded-[20px] px-5 py-2">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--purple-primary)]">
                Patients
              </span>
            </Link>
            <Link href="/schedule" className="flex items-center justify-center rounded-[20px] border border-[var(--border-nav-inactive)] bg-transparent px-5 py-2 transition-colors hover:bg-[var(--lavender-bg)]">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">
                Schedule
              </span>
            </Link>
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
      <div className="flex min-h-0 flex-1 gap-8 p-8">
        {/* Left Column — Patient List */}
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          {/* Welcome header */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">
                Welcome back,
              </span>
              <h1 className="text-[32px] font-medium tracking-[-0.3px] text-[var(--text-primary)]">
                Dr. Maya Patel
              </h1>
            </div>
            <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          {/* Section header with search */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-[28px] font-medium tracking-[-0.3px] text-[var(--text-primary)]">
                Your Patients
              </h2>
              <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-muted)]">
                {totalCount} active patient{totalCount !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="glass-control shadow-sm border border-[var(--border-nav-inactive)] flex h-12 w-[380px] items-center gap-2.5 rounded-[24px] px-5">
                <Search className="h-[20px] w-[20px] shrink-0 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients..."
                  className="flex-1 bg-transparent text-[15px] font-medium tracking-[-0.1px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
              <button className="glass-control shadow-sm border border-[var(--border-nav-inactive)] flex h-12 items-center gap-2 rounded-[24px] px-6 transition-opacity hover:bg-[rgba(243,237,250,0.5)]">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--text-nav)]" />
                <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-nav)]">
                  Filters
                </span>
              </button>
            </div>
          </div>

          {/* Patient table card */}
          <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px]">
            {/* Column headers */}
            <div className="flex shrink-0 items-center px-6 py-5 [border-bottom:var(--table-border-header)] bg-[rgba(255,255,255,0.4)] backdrop-blur-md">
              <div className="w-[280px] text-[12px] font-semibold tracking-[1px] uppercase text-[var(--text-secondary)]">
                Patient
              </div>
              <div className="flex-1 text-[12px] font-semibold tracking-[1px] uppercase text-[var(--text-secondary)]">
                Primary Concern
              </div>
              <div className="w-[160px] text-[12px] font-semibold tracking-[1px] uppercase text-[var(--text-secondary)]">
                XRP Wallet
              </div>
              <div className="w-[120px] text-[12px] font-semibold tracking-[1px] uppercase text-[var(--text-secondary)]">
                Status
              </div>
              <div className="w-[120px] text-[12px] font-semibold tracking-[1px] uppercase text-[var(--text-secondary)]">
                Actions
              </div>
            </div>

            {/* Patient rows */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="text-[14px] text-[var(--text-muted)]">Loading patients...</span>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <span className="text-[14px] text-[var(--text-muted)]">No patients found</span>
                </div>
              ) : (
                filteredPatients.map((patient, index) => (
                  <Link
                    href={`/dashboard/${patient.id}`}
                    key={patient.id}
                    className={`flex items-center px-6 py-5 transition-colors hover:bg-[rgba(243,237,250,0.5)] ${index < filteredPatients.length - 1
                      ? "[border-bottom:var(--table-border-row)]"
                      : ""
                      }`}
                  >
                    <div className="flex w-[280px] items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] text-[13px] font-medium ${index % 2 === 0
                          ? "bg-[var(--avatar-purple-bg)] text-[var(--purple-primary)]"
                          : "bg-[var(--avatar-lavender-bg)] text-[var(--purple-dark)]"
                          }`}
                      >
                        {getInitials(patient.name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
                          {patient.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {patient.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 pr-6 text-[14px] font-medium tracking-[-0.1px] text-[var(--text-secondary)]">
                      {patient.concern || "—"}
                    </div>
                    <div className="w-[160px] flex items-center gap-1.5">
                      {patient.xrp_wallet_address ? (
                        <>
                          <Wallet className="h-[15px] w-[15px] text-[var(--purple-primary)]" />
                          <span className="text-[13px] font-mono text-[var(--text-secondary)]">
                            {truncateAddress(patient.xrp_wallet_address)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[13px] text-[var(--text-muted)]">—</span>
                      )}
                    </div>
                    <div className="w-[120px]">
                      <StatusBadge status={patient.status} />
                    </div>
                    <div className="w-[120px]">
                      <button
                        onClick={(e) => { e.preventDefault(); setScheduleTarget(patient); }}
                        className="flex items-center gap-2 rounded-[14px] border border-[var(--border-nav-inactive)] px-4 py-2 text-[13px] font-medium text-[var(--purple-primary)] transition-colors hover:bg-[var(--lavender-bg)]"
                      >
                        <CalendarPlus className="h-[16px] w-[16px]" />
                        Schedule
                      </button>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex w-[340px] shrink-0 flex-col gap-6">
          {/* Overview card */}
          <div className="glass-card rounded-[24px] p-7">
            <h3 className="text-[16px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
              Overview
            </h3>
            <div className="mt-6 flex flex-col gap-4">
              {[
                { num: String(totalCount), label: "Total Patients" },
                { num: String(reviewCount), label: "Needs Review" },
                { num: String(stableCount), label: "Stable Condition" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-[14px] font-medium text-[var(--text-primary)]">
                    {s.label}
                  </span>
                  <span
                    className={`text-[24px] font-medium tracking-[-0.3px] ${statColor[s.label.split(" ")[0]] || "text-[var(--purple-primary)]"}`}
                  >
                    {s.num}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity card */}
          <div className="glass-card flex flex-col gap-5 rounded-[24px] p-7">
            <h3 className="text-[16px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
              Recent Activity
            </h3>
            {activities.map((activity) => (
              <div key={activity.name} className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${activity.active
                    ? "bg-[var(--purple-primary)]"
                    : "bg-[var(--text-muted)]"
                    }`}
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[13px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">
                    {activity.name}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Patient button */}
          <div className="mt-auto pt-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="glass-purple flex h-[46px] w-full items-center justify-center gap-2 rounded-[24px] transition-all hover:brightness-110 hover:shadow-lg active:scale-[0.98]"
            >
              <Plus className="h-[20px] w-[20px] text-white" />
              <span className="text-[15px] font-medium tracking-[-0.1px] text-white">
                Add Patient
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={loadPatients}
      />

      {scheduleTarget && (
        <ScheduleModal
          open={!!scheduleTarget}
          patientId={scheduleTarget.id}
          patientName={scheduleTarget.name}
          onClose={() => setScheduleTarget(null)}
          onScheduled={loadPatients}
        />
      )}
    </div>
  );
}
