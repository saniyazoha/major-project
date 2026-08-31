import React from "react";

export default function ResourceCard({ resource }) {
  return (
    <div className="resource-card">
      <h4>{resource?.title}</h4>
      <p>{resource?.type}</p>
    </div>
  );
}
