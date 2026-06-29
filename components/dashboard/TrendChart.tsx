"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  type ChartTypeRegistry,
} from "chart.js";
import type { Trend } from "@/lib/dashboard-data";

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip
);

export default function TrendChart({ trend }: { trend: Trend }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { months, disAmt, spentM } = trend;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = "#7E93B0";
    Chart.defaults.animation = false;

    const grid = { color: "rgba(255,255,255,0.06)" };

    const g = ctx.createLinearGradient(0, 0, 0, 262);
    g.addColorStop(0, "rgba(91,141,239,0.45)");
    g.addColorStop(1, "rgba(91,141,239,0.02)");

    const chart = new Chart(canvas, {
      type: "bar" as keyof ChartTypeRegistry,
      data: {
        labels: months,
        datasets: [
          {
            label: "Disbursed (₹Cr)",
            data: disAmt.map((x) => +(x / 100).toFixed(2)),
            backgroundColor: g,
            borderColor: "#5B8DEF",
            borderWidth: 1.5,
            borderRadius: 6,
            order: 2,
            barThickness: 22,
          },
          {
            label: "DSA Payout (₹L)",
            data: spentM,
            type: "line",
            borderColor: "#E8B873",
            backgroundColor: "#E8B873",
            borderWidth: 2.5,
            tension: 0.4,
            yAxisID: "y1",
            pointRadius: 0,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 9,
              boxHeight: 9,
              usePointStyle: true,
              padding: 16,
              color: "#8DA2BD",
            },
          },
        },
        scales: {
          y: { grid, beginAtZero: true, ticks: { color: "#6E84A3" } },
          y1: {
            position: "right",
            grid: { display: false },
            beginAtZero: true,
            ticks: { color: "#6E84A3" },
          },
          x: { grid: { display: false }, ticks: { color: "#8DA2BD" } },
        },
      },
    });

    return () => chart.destroy();
  }, [months, disAmt, spentM]);

  return <canvas ref={canvasRef} />;
}
