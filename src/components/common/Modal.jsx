import React from "react";

export default function Modal({ children, className = "" }) {
  return <div className={`modal ${className}`}>{children}</div>;
}
