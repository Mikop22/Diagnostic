"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock } from "lucide-react";

interface ScheduleModalProps {
    open: boolean;
    patientId: string;
    patientName: string;
    onClose: () => void;
    onScheduled: () => void;
}

export function ScheduleModal({ open, patientId, patientName, onClose, onScheduled }: ScheduleModalProps) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { createAppointment } = await import("@/lib/api");
            await createAppointment(patientId, date, time);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setDate("");
                setTime("");
                onScheduled();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to schedule appointment");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-md rounded-[24px] bg-white p-8 shadow-2xl"
                        style={{ fontFamily: "var(--font-poppins, 'Poppins', sans-serif)" }}
                    >
                        <button onClick={onClose} className="absolute right-5 top-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-[22px] font-medium tracking-[-0.3px] text-[var(--text-primary)] mb-1">
                            Schedule Appointment
                        </h2>
                        <p className="text-[13px] text-[var(--text-muted)] mb-8">
                            for <span className="font-medium text-[var(--text-primary)]">{patientName}</span>
                        </p>

                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="flex flex-col items-center gap-3 py-8"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green-bg)]">
                                    <span className="text-[var(--green-text)] text-2xl">✓</span>
                                </div>
                                <p className="text-[16px] font-medium text-[var(--text-primary)]">Appointment scheduled!</p>
                                <p className="text-[13px] text-[var(--text-muted)]">Patient will receive an email with the form link.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" /> Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="h-11 rounded-[14px] border border-[var(--border-nav-inactive)] bg-[var(--page-bg)] px-4 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--purple-primary)] transition-colors"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" /> Time
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="h-11 rounded-[14px] border border-[var(--border-nav-inactive)] bg-[var(--page-bg)] px-4 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--purple-primary)] transition-colors"
                                    />
                                </div>

                                {error && (
                                    <p className="text-[13px] text-red-500 bg-red-50 rounded-[10px] px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !date || !time}
                                    className="glass-purple flex h-11 items-center justify-center gap-2 rounded-[22px] transition-all hover:brightness-110 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    <span className="text-[14px] font-medium tracking-[-0.1px] text-white">
                                        {loading ? "Scheduling..." : "Schedule & Send Email"}
                                    </span>
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
