"use client";

import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import type { BiometricDelta, AcuteMetrics } from "@/lib/types";

const mapMetric = (metricArray: { date: string, value: number }[]) =>
    metricArray.map(d => {
        // Simple formatter: '2026-02-15' -> '02/15'
        const shortDate = d.date.split("-").slice(1).join("/");
        return { time: shortDate, value: d.value };
    });

const chartsConfig = [
    { title: "Walking Asymmetry", color: "var(--red-alert)", dataKey: "Walking Asymmetry", unit: "%", metricKey: "walkingAsymmetryPercentage" },
    { title: "Respiratory Rate", color: "var(--purple-accent)", dataKey: "Respiratory Rate", unit: " rpm", metricKey: "respiratoryRate" },
    { title: "Resting Heart Rate", color: "var(--purple-primary)", dataKey: "Resting Heart Rate", unit: " bpm", metricKey: "restingHeartRate" },
    { title: "Wrist Temp (Δ°C)", color: "var(--purple-accent)", dataKey: "Wrist Temp (Δ°C)", unit: "°", metricKey: "appleSleepingWristTemperature" },
];

/** Convert ISO date "2026-02-18" to chart x-axis format "02/18" */
function toChartDate(isoDate: string): string {
    return isoDate.split("-").slice(1).join("/");
}

interface ClientChartsProps {
    biometricDeltas?: BiometricDelta[];
    acuteData: AcuteMetrics;
}

export function ClientCharts({ biometricDeltas, acuteData }: ClientChartsProps) {
    const chartData = {
        "Walking Asymmetry": mapMetric(acuteData.walkingAsymmetryPercentage),
        "Respiratory Rate": mapMetric(acuteData.respiratoryRate),
        "Resting Heart Rate": mapMetric(acuteData.restingHeartRate),
        "Wrist Temp (Δ°C)": mapMetric(acuteData.appleSleepingWristTemperature),
    };

    return (
        <>
            {chartsConfig.map((c, i) => {
                const delta = biometricDeltas?.find(d => d.metric === c.metricKey);
                const changepointX = delta?.changepoint_detected && delta.changepoint_date
                    ? toChartDate(delta.changepoint_date)
                    : null;

                return (
                    <motion.div
                        key={c.title}
                        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                        className="glass-card flex flex-1 flex-col overflow-hidden rounded-[24px]"
                    >
                        <div className="flex items-center px-[18px] py-4">
                            <span className="text-[14px] font-medium tracking-[-0.1px] text-[var(--text-primary)]">{c.title}</span>
                        </div>
                        <div className="flex-1 px-3 pb-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData[c.dataKey as keyof typeof chartData]} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-muted)" }} dy={5} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                                        dx={-5}
                                        tickFormatter={(value) => `${value}${c.unit}`}
                                    />
                                    <Tooltip
                                        formatter={(value: number | string | undefined) => [`${value ?? ''}${c.unit}`, c.title]}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-nav-inactive)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                        itemStyle={{ color: c.color, fontSize: '12px', fontWeight: 500 }}
                                        labelStyle={{ color: 'var(--text-primary)', fontSize: '11px', fontWeight: 500, marginBottom: '4px' }}
                                    />
                                    {changepointX && (
                                        <ReferenceLine
                                            x={changepointX}
                                            stroke="#E25C5C"
                                            strokeDasharray="4 4"
                                            strokeWidth={1.5}
                                            label={{ value: "Shift detected", position: "top", fill: "#E25C5C", fontSize: 10, fontWeight: 500 }}
                                        />
                                    )}
                                    <Line type="monotone" dataKey="value" stroke={c.color} strokeWidth={3} dot={{ r: 3, fill: c.color, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                );
            })}
        </>
    );
}
