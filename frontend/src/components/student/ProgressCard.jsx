The contents of the file /lect-ai-frontend/src/components/student/ProgressCard.jsx will be:

import React from "react";

export default function ProgressCard({ title, value }) {
	return (
		<div className="progress-card">
			<p className="progress-title">{title}</p>
			<h3>{value}</h3>
		</div>
	);
}