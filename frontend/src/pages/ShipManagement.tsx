import { useState, useEffect } from 'react';
import { Ship, shipApi } from '../api';

function ShipManagement() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentShip, setCurrentShip] = useState<Ship | null>(null);
  const [formData, setFormData] = useState({
    shipCode: '',
    name: '',
    imoNumber: '',
    mmsi: '',
    callSign: '',
    flag: '',
    type: '',
    length: 0,
    width: 0,
    draft: 0,
    tonnage: 0,
    status: '',
    description: '',
  });

  useEffect(() => {
    loadShips();
  }, []);

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
    setCurrentShip(null);
    setFormData({
      shipCode: '',
      name: '',
      imoNumber: '',
      mmsi: '',
      callSign: '',
      flag: '',
      type: '',
      length: 0,
      width: 0,
      draft: 0,
      tonnage: 0,
      status: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleEdit = (ship: Ship) => {
    setIsEditing(true);
    setCurrentShip(ship);
    setFormData({
      shipCode: ship.shipCode,
      name: ship.name,
      imoNumber: ship.imoNumber || '',
      mmsi: ship.mmsi || '',
      callSign: ship.callSign || '',
      flag: ship.flag || '',
      type: ship.type || '',
      length: ship.length || 0,
      width: ship.width || 0,
      draft: ship.draft || 0,
      tonnage: ship.tonnage || 0,
      status: ship.status || '',
      description: ship.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该船舶吗？')) {
      try {
        await shipApi.delete(id);
        loadShips();
      } catch (error) {
        console.error('删除船舶失败:', error);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && currentShip) {
        await shipApi.update(currentShip.id, formData);
      } else {
        await shipApi.create(formData);
      }
      setShowModal(false);
      loadShips();
    } catch (error) {
      console.error('保存船舶失败:', error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>船舶档案管理</h2>
        <button className="btn btn-primary" onClick={handleAdd} style={{ marginTop: '10px' }}>
          添加船舶
        </button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>船舶编码</th>
              <th>船舶名称</th>
              <th>IMO编号</th>
              <th>MMSI</th>
              <th>船旗</th>
              <th>类型</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {ships.map((ship) => (
              <tr key={ship.id}>
                <td>{ship.shipCode}</td>
                <td>{ship.name}</td>
                <td>{ship.imoNumber || '-'}</td>
                <td>{ship.mmsi || '-'}</td>
                <td>{ship.flag || '-'}</td>
                <td>{ship.type || '-'}</td>
                <td>
                  <span className={`status-${ship.status === 'active' ? 'active' : ship.status === 'anchored' ? 'anchored' : 'inactive'}`}>
                    {ship.status || '未知'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(ship)}>
                    编辑
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(ship.id)}>
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
            <h3>{isEditing ? '编辑船舶' : '添加船舶'}</h3>
            <div className="form-container">
              <div className="form-group">
                <label>船舶编码 *</label>
                <input
                  type="text"
                  value={formData.shipCode}
                  onChange={(e) => setFormData({ ...formData, shipCode: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>船舶名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>IMO编号</label>
                <input
                  type="text"
                  value={formData.imoNumber}
                  onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>MMSI</label>
                <input
                  type="text"
                  value={formData.mmsi}
                  onChange={(e) => setFormData({ ...formData, mmsi: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>呼号</label>
                <input
                  type="text"
                  value={formData.callSign}
                  onChange={(e) => setFormData({ ...formData, callSign: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>船旗</label>
                <input
                  type="text"
                  value={formData.flag}
                  onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>船舶类型</label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>长度 (米)</label>
                <input
                  type="number"
                  value={formData.length || ''}
                  onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>宽度 (米)</label>
                <input
                  type="number"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>吃水 (米)</label>
                <input
                  type="number"
                  value={formData.draft || ''}
                  onChange={(e) => setFormData({ ...formData, draft: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>吨位</label>
                <input
                  type="number"
                  value={formData.tonnage || ''}
                  onChange={(e) => setFormData({ ...formData, tonnage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="">请选择</option>
                  <option value="active">在航</option>
                  <option value="anchored">锚泊</option>
                  <option value="inactive">停航</option>
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
                {isEditing ? '保存修改' : '添加'}
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

export default ShipManagement;
