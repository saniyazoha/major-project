import React from "react";

export default function SearchBar({ placeholder = "Search...", ...props }) {
  return (
    <input className="search-input" placeholder={placeholder} {...props} />
  );
}
