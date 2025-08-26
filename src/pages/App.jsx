// src/pages/App.jsx
import React from "react";
import Layout from "@/layout";
import { Outlet } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      <Analytics />
      <SpeedInsights />
    </>
  );
}