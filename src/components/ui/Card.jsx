import React from "react";

export function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }) {
  return <div className={`card-head ${className}`}>{children}</div>;
}

export function CardBody({ children, className = "" }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}