import { Outlet, Link } from "react-router";

const Dashboard = () => {
  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/dashboard">Home</Link></li>
          <li><Link to="/dashboard/profile">Profile</Link></li>
        </ul>
      </nav>

      {/* Outlet to render nested routes */}
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
