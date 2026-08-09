The file `/lect-ai-frontend/src/components/faculty/SubjectCard.jsx` has been created as an empty file. 

Here is the list of the folders and files that were created:

- lect-ai-frontend/
  - src/
    - components/
      - faculty/
        - SubjectCard.jsx

import React from "react";

export default function SubjectCard({ subject, onView }) {
  return (
    <article className="subject-card">
      <div className="subject-card-top">
        <div>
          <p className="subject-card-title">{subject?.name}</p>
          <p className="subject-card-meta">{subject?.lectures} lectures</p>
        </div>
        <span className="subject-card-badge">{subject?.progress ?? 0}%</span>
      </div>
      <div className="subject-card-footer">
        <button type="button" className="text-button" onClick={onView}>
          View
        </button>
      </div>
    </article>
  );
}