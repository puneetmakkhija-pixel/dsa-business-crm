"use client";

import { useEffect, useRef } from "react";
import { Chart, DoughnutController, ArcElement, Legend, Tooltip } from "chart.js";
import type { Lender } from "@/lib/dashboard-data";

Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

export default function DonutChart({ lenders }: { lenders: Lender[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = "#64748b";
    Chart.defaults.animation = false;

    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: lenders.map((l) => l.name),
        datasets: [
          {
            data: lenders.map((l) => l.disb),
            backgroundColor: lenders.map((l) => l.color),
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "64%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              padding: 8,
              color: "#8DA2BD",
              font: { size: 10 },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [lenders]);

  return <canvas ref={canvasRef} />;
}
