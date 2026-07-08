import { useState, useEffect } from 'react';
import { Alert, alertApi } from '../api';

function AlertManagement() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; acknowledged: number; resolved: number; byLevel: { level: string; count: number }[] } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [filterStatus, filterLevel]);

  const loadData = async () => {
    try {
      const statsRes = await alertApi.getStats();
      setStats(statsRes.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      let res;
      if (filterStatus) {
        res = await alertApi.getByStatus(filterStatus);
      } else if (filterLevel) {
        res = await alertApi.getByLevel(filterLevel);
      } else {
        res = await alertApi.getAll();
      }
      setAlerts(res.data);
    } catch (error) {
      console.error('加载告警数据失败:', error);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await alertApi.acknowledge(id, { acknowledgedBy: 'admin' });
      loadData();
      loadAlerts();
    } catch (error) {
      console.error('确认告警失败:', error);
    }
  };

  const handleResolve = async (id: string) => {
    const note = prompt('请输入处理备注:');
    try {
      await alertApi.resolve(id, { resolvedBy: 'admin', resolutionNote: note || undefined });
      loadData();
      loadAlerts();
    } catch (error) {
      console.error('解决告警失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条告警吗？')) {
      try {
        await alertApi.delete(id);
        loadData();
        loadAlerts();
      } catch (error) {
        console.error('删除告警失败:', error);
      }
    }
  };

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'critical': return { backgroundColor: '#dc3545', color: '#fff' };
      case 'high': return { backgroundColor: '#e67e22', color: '#fff' };
      case 'medium': return { backgroundColor: '#f39c12', color: '#fff' };
      case 'low': return { backgroundColor: '#17a2b8', color: '#fff' };
      default: return { backgroundColor: '#6c757d', color: '#fff' };
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { backgroundColor: '#dc3545', color: '#fff' };
      case 'acknowledged': return { backgroundColor: '#f39c12', color: '#fff' };
      case 'resolved': return { backgroundColor: '#28a745', color: '#fff' };
      default: return { backgroundColor: '#6c757d', color: '#fff' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'acknowledged': return '已确认';
      case 'resolved': return '已解决';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'deviation': return '航线偏离';
      case 'speed': return '速度异常';
      case 'course': return '航向异常';
      case 'eta': return 'ETA延误';
      case 'custom': return '自定义';
      default: return type;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>告警管理</h2>
        <p style={{ color: '#7f8c8d', marginTop: '5px' }}>
          实时监控船舶异常告警，数据每10秒自动刷新
        </p>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{stats.total}</div>
            <div style={{ color: '#7f8c8d' }}>总告警数</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.active}</div>
            <div style={{ color: '#7f8c8d' }}>活跃告警</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>{stats.acknowledged}</div>
            <div style={{ color: '#7f8c8d' }}>已确认</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.resolved}</div>
            <div style={{ color: '#7f8c8d' }}>已解决</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select
          className="form-control"
          style={{ width: '150px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="acknowledged">已确认</option>
          <option value="resolved">已解决</option>
        </select>
        <select
          className="form-control"
          style={{ width: '150px' }}
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="">全部级别</option>
          <option value="critical">严重</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>告警标题</th>
              <th>类型</th>
              <th>级别</th>
              <th>状态</th>
              <th>船舶</th>
              <th>航线</th>
              <th>偏离距离</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#7f8c8d' }}>
                  暂无告警
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} onClick={() => setSelectedAlert(alert)}>
                  <td style={{ cursor: 'pointer', fontWeight: 'bold' }}>{alert.title}</td>
                  <td>{getTypeText(alert.type)}</td>
                  <td>
                    <span style={{ ...getLevelStyle(alert.level), padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {getLevelText(alert.level)}
                    </span>
                  </td>
                  <td>
                    <span style={{ ...getStatusStyle(alert.status), padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {getStatusText(alert.status)}
                    </span>
                  </td>
                  <td>{alert.shipName || alert.shipId}</td>
                  <td>{alert.routeName || '-'}</td>
                  <td>{alert.deviationDistance ? `${alert.deviationDistance.toFixed(1)} 米` : '-'}</td>
                  <td>{new Date(alert.createdAt).toLocaleString()}</td>
                  <td>
                    {alert.status === 'active' && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
                      >
                        确认
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                        style={{ marginLeft: '5px' }}
                      >
                        解决
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={(e) => { e.stopPropagation(); handleDelete(alert.id); }}
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

      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>告警详情</h3>
              <button className="btn btn-close" onClick={() => setSelectedAlert(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <span style={{ ...getLevelStyle(selectedAlert.level), padding: '5px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
                  {getLevelText(selectedAlert.level)}
                </span>
                <span style={{ ...getStatusStyle(selectedAlert.status), padding: '5px 12px', borderRadius: '4px' }}>
                  {getStatusText(selectedAlert.status)}
                </span>
              </div>
              <h4 style={{ marginBottom: '10px' }}>{selectedAlert.title}</h4>
              {selectedAlert.message && (
                <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>{selectedAlert.message}</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <strong>类型:</strong> {getTypeText(selectedAlert.type)}
                </div>
                <div>
                  <strong>船舶:</strong> {selectedAlert.shipName || selectedAlert.shipId}
                </div>
                <div>
                  <strong>航线:</strong> {selectedAlert.routeName || '-'}
                </div>
                <div>
                  <strong>偏离距离:</strong> {selectedAlert.deviationDistance ? `${selectedAlert.deviationDistance.toFixed(1)} 米` : '-'}
                </div>
                <div>
                  <strong>阈值:</strong> {selectedAlert.threshold ? `${selectedAlert.threshold} 米` : '-'}
                </div>
                <div>
                  <strong>位置:</strong> {selectedAlert.latitude?.toFixed(4)}, {selectedAlert.longitude?.toFixed(4)}
                </div>
                <div>
                  <strong>创建时间:</strong> {new Date(selectedAlert.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>更新时间:</strong> {new Date(selectedAlert.updatedAt).toLocaleString()}
                </div>
              </div>
              {selectedAlert.acknowledgedAt && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <strong>确认时间:</strong> {new Date(selectedAlert.acknowledgedAt).toLocaleString()}
                  {selectedAlert.acknowledgedBy && ` (${selectedAlert.acknowledgedBy})`}
                </div>
              )}
              {selectedAlert.resolvedAt && (
                <div style={{ marginTop: '10px' }}>
                  <strong>解决时间:</strong> {new Date(selectedAlert.resolvedAt).toLocaleString()}
                  {selectedAlert.resolvedBy && ` (${selectedAlert.resolvedBy})`}
                </div>
              )}
              {selectedAlert.resolutionNote && (
                <div style={{ marginTop: '10px' }}>
                  <strong>处理备注:</strong> {selectedAlert.resolutionNote}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertManagement;
