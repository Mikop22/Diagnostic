"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

type Question = {
  id: number;
  question: string;
  type: "options" | "scale";
  options: string[];
};

const questions: Question[] = [
  {
    id: 1,
    question: "Where are you in your menstrual cycle?",
    type: "options",
    options: ["Follicular", "Ovulation", "Luteal", "Menstruation", "Does not apply"],
  },
  {
    id: 2,
    question: "Do you consume caffeine regularly?",
    type: "options",
    options: ["Yes", "No"],
  },
  {
    id: 3,
    question: "What level of pain are you experiencing?",
    type: "scale",
    options: Array.from({ length: 10 }, (_, i) => (i + 1).toString()),
  },
];

/* ─── Liquid Glass Button ─── */
function LiquidButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [0, 1], ["6deg", "-6deg"]);
  const rotateY = useTransform(mouseXSpring, [0, 1], ["-6deg", "6deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width;
    const yPct = mouseY / rect.height;
    x.set(xPct);
    y.set(yPct);
    setGlowPos({ x: xPct * 100, y: yPct * 100 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setGlowPos({ x: 50, y: 0 });
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.button
      ref={btnRef}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative group overflow-hidden rounded-[26px] flex items-center justify-center cursor-pointer ${className}`}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        background: isHovered ? "rgba(200, 180, 240, 0.28)" : "rgba(200, 180, 240, 0.15)",
        backdropFilter: isHovered ? "blur(36px)" : "blur(24px)",
        border: isHovered ? "1px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.4)",
        boxShadow: isHovered
          ? "0 4px 24px rgba(93,46,168,0.18), 0 0 40px rgba(180,140,255,0.12), inset 0 1px 0 rgba(255,255,255,0.55)"
          : "0 4px 24px rgba(93,46,168,0.06), 0 0 40px rgba(180,140,255,0.0), inset 0 1px 0 rgba(255,255,255,0.35)",
        transition: "background 0.35s ease, backdrop-filter 0.4s ease, border 0.3s ease, box-shadow 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
    >
      <div
        className="absolute inset-0 rounded-[26px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,${isHovered ? 0.5 : 0.2}) 0%, transparent ${isHovered ? "70%" : "55%"})`,
          transition: isHovered ? "none" : "background 0.4s ease",
        }}
      />
      <div className="relative z-10 text-[#2F1C4E] font-medium font-poppins">{children}</div>
    </motion.button>
  );
}

/* ─── Question Card ─── */
function QuestionCard({
  question,
  total,
  current,
  onAnswer,
}: {
  question: Question;
  total: number;
  current: number;
  onAnswer: (answer: string) => void;
}) {
  const isOddCount = question.type !== "scale" && question.options.length % 2 !== 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, scale: 0.97 }}
      transition={{ duration: 0.85, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative w-[540px] min-h-[340px] bg-white/8 border border-white/25 rounded-[34px] backdrop-blur-[28px] shadow-[0_8px_32px_rgba(93,46,168,0.15),inset_0_1px_0_rgba(255,255,255,0.35)] p-8 pt-12 flex flex-col items-center overflow-hidden justify-center"
    >
      <div className="absolute inset-0 rounded-[34px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.2)_0%,transparent_50%)] pointer-events-none" />
      <h2 className="relative z-10 text-[28px] font-medium leading-[1.25] text-[#1F1B2D] text-center mb-6 px-4 font-poppins mt-2">
        {question.question}
      </h2>
      <div className={`relative z-10 w-full grid gap-3 ${question.type === "scale" ? "grid-cols-5" : "grid-cols-2"}`}>
        {question.options.map((opt, index) => (
          <LiquidButton
            key={opt}
            onClick={() => onAnswer(opt)}
            className={`${question.type === "scale" ? "h-[48px] text-lg" : "h-[56px] text-xl"} ${isOddCount && index === question.options.length - 1 ? "col-span-2" : ""}`}
          >
            {opt}
          </LiquidButton>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Back Button ─── */
function GlassBackButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.1, filter: "brightness(1.2)" }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`w-[36px] h-[36px] rounded-full bg-white/10 border border-white/25 flex items-center justify-center cursor-pointer backdrop-blur-[16px] shadow-[0_2px_8px_rgba(93,46,168,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] transition-[filter] duration-200 ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A3270" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </motion.button>
  );
}

/* ─── Main Intake Page ─── */
export default function IntakePage() {
  const params = useParams();
  const token = params.token as string;

  const [showButton, setShowButton] = useState(false);
  const [view, setView] = useState<
    "welcome" | "intro" | "symptoms-intro" | "symptoms-explainer" | "symptoms-input" | "syncing-wearables" | "questions" | "submitting" | "finish"
  >("welcome");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [narrative, setNarrative] = useState("");
  const [useDemoData, setUseDemoData] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (view === "intro") {
      const timer = setTimeout(() => setView("questions"), 3000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  useEffect(() => {
    if (view === "symptoms-intro") {
      const timer = setTimeout(() => setView("symptoms-explainer"), 3000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  useEffect(() => {
    if (view === "symptoms-explainer") {
      const timer = setTimeout(() => setView("symptoms-input"), 6000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  useEffect(() => {
    if (view === "syncing-wearables") {
      const timer = setTimeout(() => setView("submitting"), 4000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  useEffect(() => {
    if (view === "submitting") {
      const timer = setTimeout(() => setView("finish"), 5000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setView("symptoms-intro");
    }
  };

  const handleBack = () => {
    if (view === "questions") {
      if (currentQuestionIndex > 0) setCurrentQuestionIndex((prev) => prev - 1);
    } else if (view === "symptoms-input" || view === "symptoms-intro" || view === "symptoms-explainer") {
      setCurrentQuestionIndex(questions.length - 1);
      setView("questions");
    }
  };

  const handleSubmit = async (forceDemoData = false) => {
    setView("submitting");
    setSubmitError(null);

    const shouldUseDemoData = forceDemoData || useDemoData;
    const payload = shouldUseDemoData
      ? {
        patient_id: token,
        sync_timestamp: new Date().toISOString(),
        hardware_source: "Apple Watch Series 9",
        patient_narrative: narrative || "Reporting general fatigue and mild discomfort.",
        data: {
          acute_7_day: {
            granularity: "daily_summary",
            metrics: {
              heartRateVariabilitySDNN: Array(7).fill({ date: "2026-03-10", value: 35, unit: "ms" }),
              restingHeartRate: Array(7).fill({ date: "2026-03-10", value: 65, unit: "bpm" }),
              appleSleepingWristTemperature: Array(7).fill({ date: "2026-03-10", value: 0.1, unit: "degC_deviation" }),
              respiratoryRate: Array(7).fill({ date: "2026-03-10", value: 14, unit: "breaths/min" }),
              walkingAsymmetryPercentage: Array(7).fill({ date: "2026-03-10", value: 1.2, unit: "%" }),
              stepCount: Array(7).fill({ date: "2026-03-10", value: 8000, unit: "count" }),
              sleepAnalysis_awakeSegments: Array(7).fill({ date: "2026-03-10", value: 1, unit: "count" }),
            },
          },
          longitudinal_6_month: {
            granularity: "weekly_average",
            metrics: {
              restingHeartRate: Array(26).fill({ week_start: "2025-08-24", value: 62, unit: "bpm" }),
              walkingAsymmetryPercentage: Array(26).fill({ week_start: "2025-08-24", value: 1.1, unit: "%" }),
            },
          },
        },
        risk_profile: { factors: [] }
      }
      : {
        patient_id: token,
        sync_timestamp: new Date().toISOString(),
        hardware_source: "Apple Watch Series 9",
        patient_narrative: narrative || "Reporting general fatigue and mild discomfort.",
        data: {
          acute_7_day: { granularity: "daily_summary", metrics: { heartRateVariabilitySDNN: [], restingHeartRate: [], appleSleepingWristTemperature: [], respiratoryRate: [], walkingAsymmetryPercentage: [], stepCount: [], sleepAnalysis_awakeSegments: [] } },
          longitudinal_6_month: { granularity: "weekly_average", metrics: { restingHeartRate: [], walkingAsymmetryPercentage: [] } }
        },
        risk_profile: { factors: [] }
      };

    try {
      const res = await fetch(`${API_BASE}/api/v1/intake/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Server error: ${res.status}`);
      }

      setView("finish");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
      setView("symptoms-input");
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-poppins text-[#2F1C4E] selection:bg-[#B58DE0]/30 transition-colors duration-1000">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#C9B8F0] opacity-30 mix-blend-multiply filter blur-[100px]"
          style={{ animation: "blob-drift-1 15s infinite alternate ease-in-out" }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, #A8D4F0 0%, transparent 70%)",
            top: "50%",
            right: "10%",
            filter: "blur(110px)",
            animation: "blob-drift-2 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[450px] h-[450px] rounded-full opacity-35"
          style={{
            background: "radial-gradient(circle, #F0C0D8 0%, transparent 70%)",
            bottom: "5%",
            left: "40%",
            filter: "blur(120px)",
            animation: "blob-drift-3 20s ease-in-out infinite",
          }}
        />
      </div>

      <div
        className={`w-full max-w-[920px] text-center relative flex flex-col items-center justify-center transition-[height] duration-500 z-10 ${view === "welcome" ? "h-[340px]" : "h-[500px]"}`}
      >
        <AnimatePresence mode="wait">
          {view === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
              className="w-full h-full relative mt-32"
            >
              <motion.h1
                layout
                initial={{ fontSize: "72px", y: 0, filter: "blur(24px)", opacity: 0 }}
                animate={{
                  fontSize: showButton ? "88px" : "92px",
                  y: showButton ? -18 : 0,
                  filter: "blur(0px)",
                  opacity: 1,
                }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-medium leading-[1.1] tracking-[-0.1px] bg-linear-to-r from-[#5D2EA8] to-[#F294B9] bg-clip-text text-transparent select-none pb-4 absolute top-0 w-full"
              >
                diagnostic
              </motion.h1>
              <div className="absolute top-[136px] w-full flex justify-center perspective-[1000px]">
                <AnimatePresence mode="wait">
                  {!showButton ? (
                    <motion.p
                      key="subtitle"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="text-[30px] font-medium leading-[38px] tracking-[-0.1px] text-[#6D6885]"
                    >
                      Let&apos;s get you ready for your appointment
                    </motion.p>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20, mass: 1, delay: 0.2 }}
                    >
                      <LiquidButton onClick={() => setView("intro")} className="w-[184px] h-[51px] text-[24px]">
                        Continue
                      </LiquidButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {view === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full flex flex-col items-center justify-center"
            >
              <h1 className="text-[58px] font-medium leading-[1.15] tracking-[-0.1px] text-[#1F1B2D]">Before we begin</h1>
              <h1 className="text-[58px] font-medium leading-[1.15] tracking-[-0.1px] bg-linear-to-r from-[#5D2EA8] to-[#F294B9] bg-clip-text text-transparent select-none pb-2 mt-3">
                A few questions
              </h1>
              <p className="text-[24px] font-medium leading-[32px] tracking-[-0.1px] text-[#6D6885] mt-6">This will take about 2 minutes</p>
            </motion.div>
          )}

          {view === "symptoms-intro" && (
            <motion.div
              key="symptoms-intro"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full flex flex-col items-center justify-center"
            >
              <h1 className="text-[52px] font-medium leading-[1.15] tracking-[-0.1px] text-[#1F1B2D]">Great,</h1>
              <h1 className="text-[46px] font-medium leading-[1.15] tracking-[-0.1px] bg-linear-to-r from-[#5D2EA8] to-[#F294B9] bg-clip-text text-transparent select-none pb-2 mt-3 text-center">
                Let&apos;s talk about symptoms
              </h1>
            </motion.div>
          )}

          {view === "symptoms-explainer" && (
            <motion.div
              key="symptoms-explainer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative w-[600px] bg-white/8 border border-white/25 rounded-[30px] backdrop-blur-[28px] shadow-[0_8px_32px_rgba(93,46,168,0.15),inset_0_1px_0_rgba(255,255,255,0.35)] flex flex-col items-center justify-center overflow-hidden py-14 px-10"
            >
              <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.2)_0%,transparent_50%)] pointer-events-none" />
              <p className="relative z-10 max-w-[420px] text-[18px] font-medium leading-[1.4] text-[#2F2646] text-center font-poppins">
                You tell us your symptoms in your own words, don&apos;t be afraid to be detailed, we don&apos;t share your exact words with your physician.
              </p>
            </motion.div>
          )}

          {view === "symptoms-input" && (
            <motion.div
              key="symptoms-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center justify-center p-8"
            >
              <div className="w-full max-w-[760px] mb-4">
                <GlassBackButton onClick={handleBack} />
              </div>
              <div className="w-full flex flex-col items-center justify-center gap-6">
                <div className="w-full max-w-[760px] h-[340px] bg-white/10 border border-white/25 rounded-[30px] backdrop-blur-[28px] shadow-[0_8px_32px_rgba(93,46,168,0.12),inset_0_1px_0_rgba(255,255,255,0.35)] overflow-hidden relative">
                  <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.15)_0%,transparent_50%)] pointer-events-none" />
                  <textarea
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    className="relative z-10 w-full h-full bg-transparent border-none outline-none p-8 text-[#2F1C4E] text-xl font-poppins resize-none placeholder-[#2F1C4E]/50"
                    placeholder="Type here..."
                  />
                </div>
                <div className="w-full max-w-[760px] flex justify-end">
                  <LiquidButton onClick={() => setView("syncing-wearables")} className="w-[140px] h-[48px] text-[20px]">
                    Submit
                  </LiquidButton>
                </div>
              </div>
            </motion.div>
          )}

          {view === "syncing-wearables" && (
            <motion.div
              key="syncing-wearables"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center justify-center gap-6"
            >
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E9E0F5] border-t-[#5D2EA8]" />
              <p className="text-[22px] font-medium text-[#1F1B2D] font-poppins">Syncing wearable data…</p>
              <p className="text-[16px] text-[#6D6885] font-poppins">Connecting to Apple Health</p>
            </motion.div>
          )}

          {view === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center justify-center gap-6"
            >
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E9E0F5] border-t-[#5D2EA8]" />
              <p className="text-[22px] font-medium text-[#1F1B2D] font-poppins">Processing your data…</p>
              <p className="text-[16px] text-[#6D6885] font-poppins">Running diagnostic analysis pipeline</p>
            </motion.div>
          )}

          {view === "questions" && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 right-0 text-[#6D6885] text-sm font-medium font-poppins">
                {currentQuestionIndex + 1} of {questions.length}
              </motion.div>
              {currentQuestionIndex > 0 && <GlassBackButton onClick={handleBack} className="absolute top-0 left-0" />}
              <AnimatePresence mode="wait">
                <QuestionCard
                  key={`q-${currentQuestionIndex}`}
                  question={questions[currentQuestionIndex]}
                  total={questions.length}
                  current={currentQuestionIndex + 1}
                  onAnswer={handleAnswer}
                />
              </AnimatePresence>
            </div>
          )}

          {view === "finish" && (
            <motion.div
              key="finish"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center justify-center gap-4"
            >
              <h2 className="text-[64px] font-medium leading-none text-[#1F1B2D] text-center font-poppins">thanks.</h2>
              <p className="max-w-[380px] text-[18px] font-medium leading-[1.35] text-[#5B4E7A] text-center font-poppins mt-2">
                This information will be used to give you a more accurate diagnosis
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
