import React from "react";

export default function Flashcard({ card }) {
  return (
    <div className="flashcard">
      <h4>{card?.front}</h4>
      <p>{card?.back}</p>
    </div>
  );
}
