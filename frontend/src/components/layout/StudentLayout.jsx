import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function StudentLayout() {
  return (
    <div className="app-layout">
      <Sidebar role="student" />

      <div className="main-content">
        <Header role="student" />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
