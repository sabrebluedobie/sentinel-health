// pages/_app.jsx
"use client";
import React from "react";
import "../styles/globals.css"; // keep if you have it
import { ThemeProvider } from "../src/components/ThemeContext";
import Header from "../src/components/Header";

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Header />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
