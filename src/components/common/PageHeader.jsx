import React from "react";

export default function PageHeader({ title, subtitle }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
    </header>
  <div className="page-header-actions">{children}</div>
  </header>
  );
}
  );
}
