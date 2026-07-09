import { useState, useEffect, useCallback } from 'react';
import { AnalysisDashboard as DashboardType, analysisApi } from '../api';

type TimeRangeType = '7days' | '30days' | 'custom';

function AnalysisDashboard() {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const calculateDateRange = useCallback((type: TimeRangeType) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();
    
    switch (type) {
      case '7days':
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      case '30days':
        start.setDate(end.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
      case 'custom':
        const customStart = startDate 
          ? new Date(startDate + 'T00:00:00.000')
          : new Date(end.getTime());
        const customEnd = endDate 
          ? new Date(endDate + 'T23:59:59.999')
          : new Date(end.getTime());
        customStart.setHours(0, 0, 0, 0);
        customEnd.setHours(23, 59, 59, 999);
        return { start: customStart.toISOString(), end: customEnd.toISOString() };
    }
  }, [startDate, endDate]);

  const loadData = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const res = await analysisApi.getDashboard(start, end);
      setDashboard(res.data);
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { start, end } = calculateDateRange(timeRange);
    loadData(start, end);

    const interval = setInterval(() => {
      const { start: s, end: e } = calculateDateRange(timeRange);
      loadData(s, e);
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange, startDate, endDate, loadData, calculateDateRange]);

  const handleTimeRangeChange = (type: TimeRangeType) => {
    setTimeRange(type);
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return '#28a745';
    if (rate >= 50) return '#f39c12';
    return '#dc3545';
  };

  const getDeviationColor = (distance: number) => {
    if (distance > 1000) return '#dc3545';
    if (distance > 500) return '#f39c12';
    return '#28a745';
  };

  if (loading) {
    return (
      <div className="page-header">
        <h2>数据分析报表</h2>
        <p style={{ color: '#7f8c8d', marginTop: '5px' }}>数据加载中...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="page-header">
        <h2>数据分析报表</h2>
        <p style={{ color: '#7f8c8d', marginTop: '5px' }}>加载失败，请稍后重试</p>
      </div>
    );
  }

  const { summary, deviationStats, alertTrend } = dashboard;
  const currentDateRange = calculateDateRange(timeRange);

  return (
    <div>
      <div className="page-header">
        <h2>数据分析报表</h2>
        <p style={{ color: '#7f8c8d', marginTop: '5px' }}>
          航线执行分析与偏离统计，数据每30秒自动刷新
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <span style={{ color: '#7f8c8d' }}>时间范围：</span>
        <button
          className={`btn ${timeRange === '7days' ? 'btn-primary' : 'btn-default'}`}
          onClick={() => handleTimeRangeChange('7days')}
        >
          近7天
        </button>
        <button
          className={`btn ${timeRange === '30days' ? 'btn-primary' : 'btn-default'}`}
          onClick={() => handleTimeRangeChange('30days')}
        >
          近30天
        </button>
        <button
          className={`btn ${timeRange === 'custom' ? 'btn-primary' : 'btn-default'}`}
          onClick={() => handleTimeRangeChange('custom')}
        >
          自定义
        </button>
        {timeRange === 'custom' && (
          <>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '150px' }}
            />
            <span style={{ color: '#7f8c8d' }}>至</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '150px' }}
            />
          </>
        )}
        <span style={{ color: '#7f8c8d', marginLeft: '10px', fontSize: '12px' }}>
          当前筛选：{currentDateRange.start} ~ {currentDateRange.end}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>{summary.totalRoutes}</div>
          <div style={{ color: '#7f8c8d', marginTop: '5px' }}>总航线数</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>{summary.activeRoutes}</div>
          <div style={{ color: '#7f8c8d', marginTop: '5px' }}>活跃航线</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>{summary.completedRoutes}</div>
          <div style={{ color: '#7f8c8d', marginTop: '5px' }}>已完成</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f39c12' }}>{alertTrend.activeAlerts}</div>
          <div style={{ color: '#7f8c8d', marginTop: '5px' }}>活跃告警</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>平均完成率</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(${getCompletionRateColor(summary.avgCompletionRate)} ${summary.avgCompletionRate}%, #eee ${summary.avgCompletionRate}%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: getCompletionRateColor(summary.avgCompletionRate) }}>
                  {summary.avgCompletionRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <div style={{ color: '#7f8c8d' }}>进行中航线</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>{summary.inProgressRoutes} 条</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>偏离统计</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(${getDeviationColor(deviationStats.overallAvgDeviation)} ${Math.min(deviationStats.overallAvgDeviation / 10, 100)}%, #eee ${Math.min(deviationStats.overallAvgDeviation / 10, 100)}%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: getDeviationColor(deviationStats.overallAvgDeviation) }}>
                  {deviationStats.overallAvgDeviation.toFixed(0)}m
                </span>
              </div>
            </div>
            <div>
              <div style={{ color: '#7f8c8d' }}>最大偏离</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: getDeviationColor(deviationStats.maxDeviation) }}>
                {deviationStats.maxDeviation.toFixed(0)} 米
              </div>
              <div style={{ color: '#7f8c8d', marginTop: '5px' }}>活跃告警 {deviationStats.alertCount} 个</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>船舶偏离排行</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>船舶名称</th>
              <th>船舶编码</th>
              <th>当前偏离(米)</th>
              <th>平均偏离(米)</th>
              <th>最大偏离(米)</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {deviationStats.ships.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#7f8c8d' }}>暂无数据</td>
              </tr>
            ) : (
              deviationStats.ships
                .sort((a, b) => b.currentDeviation - a.currentDeviation)
                .map((ship) => (
                  <tr key={ship.shipId}>
                    <td style={{ fontWeight: 'bold' }}>{ship.shipName}</td>
                    <td>{ship.shipCode}</td>
                    <td style={{ color: getDeviationColor(ship.currentDeviation), fontWeight: 'bold' }}>
                      {ship.currentDeviation.toFixed(1)}
                    </td>
                    <td style={{ color: getDeviationColor(ship.avgDeviation) }}>
                      {ship.avgDeviation.toFixed(1)}
                    </td>
                    <td style={{ color: getDeviationColor(ship.maxDeviation) }}>
                      {ship.maxDeviation.toFixed(1)}
                    </td>
                    <td>
                      {ship.hasActiveAlert ? (
                        <span style={{ backgroundColor: '#dc3545', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          异常
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#28a745', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          正常
                        </span>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>告警趋势</h3>
        {alertTrend.dailyData.length === 0 ? (
          <p style={{ color: '#7f8c8d', textAlign: 'center' }}>暂无告警数据</p>
        ) : (
          <div style={{ height: '200px' }}>
            <svg style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3498db" />
                  <stop offset="100%" stopColor="#2980b9" />
                </linearGradient>
              </defs>
              <g transform="translate(50, 20)">
                {alertTrend.dailyData.map((item, index) => {
                  const maxCount = Math.max(...alertTrend.dailyData.map(d => d.count));
                  const barWidth = (100 / alertTrend.dailyData.length) * 0.6;
                  const barHeight = (item.count / maxCount) * 150;
                  const x = (100 / alertTrend.dailyData.length) * index;
                  return (
                    <g key={index}>
                      <rect
                        x={`${x}%`}
                        y={150 - barHeight}
                        width={`${barWidth}%`}
                        height={barHeight}
                        fill="url(#barGradient)"
                        rx="4"
                      />
                      <text
                        x={`${x + barWidth / 2}%`}
                        y={170}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#7f8c8d"
                      >
                        {new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </text>
                      <text
                        x={`${x + barWidth / 2}%`}
                        y={150 - barHeight - 5}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#2c3e50"
                      >
                        {item.count}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        )}
        <div style={{ display: 'flex', gap: '30px', marginTop: '20px', justifyContent: 'center' }}>
          <div>
            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>{alertTrend.activeAlerts}</span>
            <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>活跃告警</span>
          </div>
          <div>
            <span style={{ color: '#28a745', fontWeight: 'bold' }}>{alertTrend.resolvedAlerts}</span>
            <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>已解决</span>
          </div>
          <div>
            <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>{alertTrend.totalAlerts}</span>
            <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>总告警</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ color: '#95a5a6', fontSize: '12px' }}>
            统计口径：活跃告警 = 选定时间范围内新增且当前仍活跃的告警；已解决告警 = 选定时间范围内状态变更为已解决的告警
          </span>
        </div>
      </div>
    </div>
  );
}

export default AnalysisDashboard;