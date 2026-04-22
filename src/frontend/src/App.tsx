import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import type { Period } from "@/types";
import { useState } from "react";

export default function App() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <Layout period={period} onPeriodChange={setPeriod}>
      <Dashboard period={period} />
    </Layout>
  );
}
