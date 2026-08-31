import React from "react";

export default function UploadLectureForm() {
  return (
    <form className="upload-lecture-form">
      <p>Upload lecture (demo)</p>
      <input type="file" />
      <button type="submit" className="primary-action-button">
        Upload
      </button>
    </form>
  );
}
