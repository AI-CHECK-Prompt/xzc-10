import { useState, useEffect } from 'react';
import { AlertRule, alertRuleApi, shipApi, routeApi, Ship, Route } from '../api';

function AlertRuleConfig() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deviationThreshold: 1000,
    level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    enabled: true,
    notifyOnCreation: false,
    notifyOnUpdate: false,
    shipId: '',
    routeId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesRes, shipsRes, routesRes] = await Promise.all([
        alertRuleApi.getAll(),
        shipApi.getAll(),
        routeApi.getAll(),
      ]);
      setRules(rulesRes.data);
      setShips(shipsRes.data);
      setRoutes(routesRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleOpenModal = (rule?: AlertRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        deviationThreshold: rule.deviationThreshold,
        level: rule.level,
        enabled: rule.enabled,
        notifyOnCreation: rule.notifyOnCreation,
        notifyOnUpdate: rule.notifyOnUpdate,
        shipId: rule.shipId || '',
        routeId: rule.routeId || '',
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        deviationThreshold: 1000,
        level: 'medium',
        enabled: true,
        notifyOnCreation: false,
        notifyOnUpdate: false,
        shipId: '',
        routeId: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await alertRuleApi.update(editingRule.id, formData);
      } else {
        await alertRuleApi.create(formData);
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条规则吗？')) {
      try {
        await alertRuleApi.delete(id);
        loadData();
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await alertRuleApi.toggleStatus(id);
      loadData();
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return { color: '#dc3545' };
      case 'high': return { color: '#e67e22' };
      case 'medium': return { color: '#f39c12' };
      case 'low': return { color: '#17a2b8' };
      default: return { color: '#6c757d' };
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'critical': return '严重';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return level;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>预警规则配置</h2>
        <p style={{ color: '#7f8c8d', marginTop: '5px' }}>
          管理航线偏离预警规则，设定偏离阈值和告警级别
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          添加规则
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>规则名称</th>
              <th>偏离阈值(米)</th>
              <th>告警级别</th>
              <th>状态</th>
              <th>关联船舶</th>
              <th>关联航线</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#7f8c8d' }}>
                  暂无规则
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td>{rule.deviationThreshold}</td>
                  <td style={getLevelColor(rule.level)}>
                    <strong>{getLevelText(rule.level)}</strong>
                  </td>
                  <td>
                    <span className={`status-${rule.enabled ? 'active' : 'inactive'}`}>
                      {rule.enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>{ships.find((s) => s.id === rule.shipId)?.name || '全部'}</td>
                  <td>{routes.find((r) => r.id === rule.routeId)?.name || '全部'}</td>
                  <td>{new Date(rule.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenModal(rule)}
                    >
                      编辑
                    </button>
                    <button
                      className={`btn btn-sm ${rule.enabled ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleToggleStatus(rule.id)}
                      style={{ marginLeft: '5px' }}
                    >
                      {rule.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(rule.id)}
                      style={{ marginLeft: '5px' }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRule ? '编辑规则' : '添加规则'}</h3>
              <button className="btn btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>规则名称 *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>偏离阈值(米) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.deviationThreshold}
                    onChange={(e) => setFormData({ ...formData, deviationThreshold: parseInt(e.target.value) || 0 })}
                    required
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label>告警级别 *</label>
                  <select
                    className="form-control"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    required
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="critical">严重</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>关联船舶</label>
                  <select
                    className="form-control"
                    value={formData.shipId}
                    onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
                  >
                    <option value="">全部船舶</option>
                    {ships.map((ship) => (
                      <option key={ship.id} value={ship.id}>{ship.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>关联航线</label>
                  <select
                    className="form-control"
                    value={formData.routeId}
                    onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  >
                    <option value="">全部航线</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                    启用规则
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifyOnCreation}
                      onChange={(e) => setFormData({ ...formData, notifyOnCreation: e.target.checked })}
                    />
                    创建时通知
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifyOnUpdate}
                      onChange={(e) => setFormData({ ...formData, notifyOnUpdate: e.target.checked })}
                    />
                    更新时通知
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRule ? '保存修改' : '创建规则'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertRuleConfig;
