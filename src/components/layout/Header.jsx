function Header({ role }) {
  return (
    <header className="app-header">
      <div>
        <h1>
          {role === "faculty" ? "Faculty Portal" : "Student Portal"}
        </h1>
      </div>

      <div className="header-user">
        <span>
          {role === "faculty" ? "Faculty" : "Student"}
        </span>
      </div>
    </header>
  );
}

export default Header;