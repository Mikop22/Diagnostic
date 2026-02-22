"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AddPatientModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export function AddPatientModal({ open, onClose, onCreated }: AddPatientModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { createPatient } = await import("@/lib/api");
            await createPatient(name.trim(), email.trim());
            setName("");
            setEmail("");
            onCreated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create patient");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-[24px] bg-white p-8 shadow-2xl" style={{ fontFamily: "var(--font-poppins, 'Poppins', sans-serif)" }}>
                <button onClick={onClose} className="absolute right-5 top-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <X className="h-5 w-5" />
                </button>

                <h2 className="text-[22px] font-medium tracking-[-0.3px] text-[var(--text-primary)] mb-1">
                    New Patient
                </h2>
                <p className="text-[13px] text-[var(--text-muted)] mb-8">
                    Create a patient record with an XRP wallet
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)]">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Jordan Lee"
                            className="h-11 rounded-[14px] border border-[var(--border-nav-inactive)] bg-[var(--page-bg)] px-4 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--purple-primary)] transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium tracking-[0.5px] text-[var(--text-muted)]">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. patient@email.com"
                            className="h-11 rounded-[14px] border border-[var(--border-nav-inactive)] bg-[var(--page-bg)] px-4 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--purple-primary)] transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-[13px] text-red-500 bg-red-50 rounded-[10px] px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !name.trim() || !email.trim()}
                        className="glass-purple flex h-11 items-center justify-center gap-2 rounded-[22px] transition-all hover:brightness-110 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        <span className="text-[14px] font-medium tracking-[-0.1px] text-white">
                            {loading ? "Creating wallet..." : "Create Patient"}
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
}
