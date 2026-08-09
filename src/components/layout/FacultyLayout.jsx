import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function FacultyLayout() {
  return (
    <div className="app-layout">
      <Sidebar role="faculty" />

      <div className="main-content">
        <Header role="faculty" />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default FacultyLayout;