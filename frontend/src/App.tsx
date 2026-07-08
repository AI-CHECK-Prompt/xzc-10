import { Routes, Route, NavLink } from 'react-router-dom';
import ShipManagement from './pages/ShipManagement';
import RoutePlanning from './pages/RoutePlanning';
import MapDisplay from './pages/MapDisplay';
import AlertRuleConfig from './pages/AlertRuleConfig';
import AlertManagement from './pages/AlertManagement';
import AnalysisDashboard from './pages/AnalysisDashboard';

function App() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div className="sidebar">
        <h1>船舶航线管理系统</h1>
        <nav>
          <ul>
            <li>
              <NavLink to="/ships" className={({ isActive }) => isActive ? 'active' : ''}>
                船舶档案管理
              </NavLink>
            </li>
            <li>
              <NavLink to="/routes" className={({ isActive }) => isActive ? 'active' : ''}>
                航线规划
              </NavLink>
            </li>
            <li>
              <NavLink to="/map" className={({ isActive }) => isActive ? 'active' : ''}>
                地图监控
              </NavLink>
            </li>
            <li>
              <NavLink to="/alert-rules" className={({ isActive }) => isActive ? 'active' : ''}>
                预警规则配置
              </NavLink>
            </li>
            <li>
              <NavLink to="/alerts" className={({ isActive }) => isActive ? 'active' : ''}>
                告警管理
              </NavLink>
            </li>
            <li>
              <NavLink to="/analysis" className={({ isActive }) => isActive ? 'active' : ''}>
                数据分析报表
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="content">
        <Routes>
          <Route path="/ships" element={<ShipManagement />} />
          <Route path="/routes" element={<RoutePlanning />} />
          <Route path="/map" element={<MapDisplay />} />
          <Route path="/alert-rules" element={<AlertRuleConfig />} />
          <Route path="/alerts" element={<AlertManagement />} />
          <Route path="/analysis" element={<AnalysisDashboard />} />
          <Route path="/" element={<ShipManagement />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
