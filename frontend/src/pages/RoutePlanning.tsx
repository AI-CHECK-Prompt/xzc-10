import { useState, useEffect } from 'react';
import { Route, Ship, routeApi, shipApi, Waypoint } from '../api';

function RoutePlanning() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    routeCode: '',
    name: '',
    shipId: '',
    waypoints: [] as Waypoint[],
    startPort: '',
    endPort: '',
    totalDistance: 0,
    estimatedTime: '',
    status: '',
    description: '',
  });

  useEffect(() => {
    loadRoutes();
    loadShips();
  }, []);

  const loadRoutes = async () => {
    try {
      const response = await routeApi.getAll();
      setRoutes(response.data);
    } catch (error) {
      console.error('加载航线列表失败:', error);
    }
  };

  const loadShips = async () => {
    try {
      const response = await shipApi.getAll();
      setShips(response.data);
    } catch (error) {
      console.error('加载船舶列表失败:', error);
    }
  };

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentRoute(null);
    setFormData({
      routeCode: '',
      name: '',
      shipId: '',
      waypoints: [],
      startPort: '',
      endPort: '',
      totalDistance: 0,
      estimatedTime: '',
      status: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleEdit = (route: Route) => {
    setIsEditing(true);
    setCurrentRoute(route);
    setFormData({
      routeCode: route.routeCode,
      name: route.name,
      shipId: route.shipId,
      waypoints: [...route.waypoints],
      startPort: route.startPort || '',
      endPort: route.endPort || '',
      totalDistance: route.totalDistance || 0,
      estimatedTime: route.estimatedTime || '',
      status: route.status || '',
      description: route.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该航线吗？')) {
      try {
        await routeApi.delete(id);
        loadRoutes();
      } catch (error) {
        console.error('删除航线失败:', error);
      }
    }
  };

  const handleAddWaypoint = () => {
    const newWaypoint: Waypoint = {
      latitude: 0,
      longitude: 0,
      name: '',
      order: formData.waypoints.length,
    };
    setFormData({ ...formData, waypoints: [...formData.waypoints, newWaypoint] });
  };

  const handleUpdateWaypoint = (index: number, field: keyof Waypoint, value: number | string) => {
    const newWaypoints = [...formData.waypoints];
    newWaypoints[index] = { ...newWaypoints[index], [field]: value };
    setFormData({ ...formData, waypoints: newWaypoints });
  };

  const handleRemoveWaypoint = (index: number) => {
    const newWaypoints = formData.waypoints.filter((_, i) => i !== index);
    newWaypoints.forEach((wp, i) => { wp.order = i; });
    setFormData({ ...formData, waypoints: newWaypoints });
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && currentRoute) {
        await routeApi.update(currentRoute.id, formData);
      } else {
        await routeApi.create(formData);
      }
      setShowModal(false);
      loadRoutes();
    } catch (error) {
      console.error('保存航线失败:', error);
    }
  };

  const getShipName = (shipId: string) => {
    const ship = ships.find((s) => s.id === shipId);
    return ship ? ship.name : '未知';
  };

  return (
    <div>
      <div className="page-header">
        <h2>航线规划</h2>
        <button className="btn btn-primary" onClick={handleAdd} style={{ marginTop: '10px' }}>
          创建航线
        </button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>航线编码</th>
              <th>航线名称</th>
              <th>所属船舶</th>
              <th>起点港</th>
              <th>终点港</th>
              <th>航点数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id}>
                <td>{route.routeCode}</td>
                <td>{route.name}</td>
                <td>{getShipName(route.shipId)}</td>
                <td>{route.startPort || '-'}</td>
                <td>{route.endPort || '-'}</td>
                <td>{route.waypoints.length}</td>
                <td>
                  <span className={`status-${route.status === 'active' ? 'active' : 'inactive'}`}>
                    {route.status || '未知'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(route)}>
                    编辑
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(route.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{isEditing ? '编辑航线' : '创建航线'}</h3>
            <div className="form-container">
              <div className="form-group">
                <label>航线编码 *</label>
                <input
                  type="text"
                  value={formData.routeCode}
                  onChange={(e) => setFormData({ ...formData, routeCode: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>航线名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>所属船舶 *</label>
                <select
                  value={formData.shipId}
                  onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
                  required
                >
                  <option value="">请选择船舶</option>
                  {ships.map((ship) => (
                    <option key={ship.id} value={ship.id}>
                      {ship.name} ({ship.shipCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>航点列表</label>
                <div style={{ marginBottom: '10px' }}>
                  <button className="btn btn-success" onClick={handleAddWaypoint}>
                    添加航点
                  </button>
                </div>
                {formData.waypoints.map((waypoint, index) => (
                  <div key={index} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold' }}>航点 {index + 1}</span>
                      <button className="btn btn-danger" onClick={() => handleRemoveWaypoint(index)}>删除</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label>纬度</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={waypoint.latitude}
                          onChange={(e) => handleUpdateWaypoint(index, 'latitude', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label>经度</label>
                        <input
                          type="number"
                          step="0.000001"
                          value={waypoint.longitude}
                          onChange={(e) => handleUpdateWaypoint(index, 'longitude', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label>名称</label>
                        <input
                          type="text"
                          value={waypoint.name || ''}
                          onChange={(e) => handleUpdateWaypoint(index, 'name', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>起点港</label>
                <input
                  type="text"
                  value={formData.startPort}
                  onChange={(e) => setFormData({ ...formData, startPort: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>终点港</label>
                <input
                  type="text"
                  value={formData.endPort}
                  onChange={(e) => setFormData({ ...formData, endPort: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>总距离 (海里)</label>
                <input
                  type="number"
                  value={formData.totalDistance || ''}
                  onChange={(e) => setFormData({ ...formData, totalDistance: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>预计时间</label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                  placeholder="例如: 3天12小时"
                />
              </div>
              <div className="form-group">
                <label>状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="">请选择</option>
                  <option value="planned">规划中</option>
                  <option value="active">执行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSubmit}>
                {isEditing ? '保存修改' : '创建'}
              </button>
              <button className="btn" onClick={() => setShowModal(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoutePlanning;
