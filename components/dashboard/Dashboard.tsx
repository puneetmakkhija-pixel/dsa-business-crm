import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import KpiCards from "./KpiCards";
import Panel from "./Panel";
import TrendChart from "./TrendChart";
import DonutChart from "./DonutChart";
import VendorLeaderboard from "./VendorLeaderboard";
import AlertsPanel from "./AlertsPanel";
import type { DashboardData } from "@/lib/dashboard-data";

export default function Dashboard({ data }: { data: DashboardData }) {
  const { heroKpis, lenders, trend, vendorRows, alerts } = data;
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        background:
          "radial-gradient(1200px 600px at 18% -8%, #15315A 0%, #0B1D36 45%, #07111F 100%)",
      }}
    >
      <Sidebar />

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, padding: "26px 34px 40px" }}>
        <TopBar />
        <KpiCards heroKpis={heroKpis} />

        {/* Trend + donut row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.7fr 1fr",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <Panel>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-sora), sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#F4F8FE",
                  }}
                >
                  Disbursed Volume &amp; Payout
                </h3>
                <span style={{ fontSize: 11.5, color: "#7E93B0" }}>
                  Trailing 8 months · FY 26-27
                </span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: "#7E93B0" }}>PEAK · Mar</div>
                  <div
                    style={{
                      fontFamily: "var(--font-sora), sans-serif",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#7CA8FF",
                    }}
                  >
                    ₹23.88 Cr
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "#7E93B0" }}>FY DISBURSED</div>
                  <div
                    style={{
                      fontFamily: "var(--font-sora), sans-serif",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#E8B873",
                    }}
                  >
                    ₹124.8 Cr
                  </div>
                </div>
              </div>
            </div>
            <div style={{ height: 262, position: "relative" }}>
              <TrendChart trend={trend} />
            </div>
          </Panel>

          <Panel>
            <h3
              style={{
                margin: "0 0 2px",
                fontFamily: "var(--font-sora), sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#F4F8FE",
              }}
            >
              Lender Split
            </h3>
            <span style={{ fontSize: 11.5, color: "#7E93B0" }}>
              May disbursal · ₹ Lakh
            </span>
            <div style={{ height: 236, position: "relative", marginTop: 6 }}>
              <DonutChart lenders={lenders} />
            </div>
          </Panel>
        </div>

        {/* Leaderboard + alerts row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 18,
          }}
        >
          <VendorLeaderboard vendorRows={vendorRows} />
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
