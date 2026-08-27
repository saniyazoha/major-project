The contents of the file /lect-ai-frontend/src/components/student/LectureCard.jsx will be as follows:

import React from "react";
import { useNavigate } from "react-router-dom";

export default function LectureCard({ lecture }) {
	const navigate = useNavigate();
	return (
		<div className="lecture-card" onClick={() => navigate("/student/lectures/" + lecture?.id)}>
			<h4>{lecture?.title}</h4>
			<p className="lecture-meta">{lecture?.subject} · {lecture?.duration}</p>
		</div>
	);
}