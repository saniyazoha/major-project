The contents of the file /lect-ai-frontend/src/components/common/Button.jsx will be:

import React from "react";

export default function Button({ children, className = "", ...props }) {
	return (
		<button className={`btn ${className}`} {...props}>
			{children}
		</button>
	);
}