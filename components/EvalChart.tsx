"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EvalResults } from "@/eval/types";

export default function EvalChart({ results }: { results: EvalResults[] }) {
  const data = results.map((r) => ({
    version: r.promptVersion,
    "Final pass rate (%)": Math.round(r.metrics.finalPassRate * 100),
    "Cost per program (¢)": Math.round(r.metrics.costPerProgramUsd * 100),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2d6cf" />
          <XAxis dataKey="version" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Final pass rate (%)" fill="#2e73eb" />
          <Bar dataKey="Cost per program (¢)" fill="#00a9b3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
