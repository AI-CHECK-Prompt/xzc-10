import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { ShipPosition, Route, positionApi, routeApi, Ship, shipApi } from '../api';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapDisplay() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [positions, setPositions] = useState<ShipPosition[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [selectedShip, setSelectedShip] = useState<string | null>(null);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [120, 30],
        zoom: 5,
      });

      map.current.addControl(new mapboxgl.NavigationControl());
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (map.current) {
      renderRoutes();
      renderShips();
    }
  }, [routes, positions, map.current]);

  const loadData = async () => {
    try {
      const [posRes, routeRes, shipRes] = await Promise.all([
        positionApi.getAll(),
        routeApi.getAll(),
        shipApi.getAll(),
      ]);
      setPositions(posRes.data);
      setRoutes(routeRes.data);
      setShips(shipRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const renderRoutes = () => {
    if (!map.current) return;

    const layers = map.current.getStyle().layers || [];
    const routeLayerExists = layers.some((layer) => layer.id === 'route-line');

    if (!routeLayerExists && routes.length > 0) {
      map.current.addSource('routes', {
        type: 'geojson',
        data: JSON.parse(JSON.stringify(getRoutesGeoJson())),
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': '#3498db',
          'line-width': 3,
          'line-opacity': 0.8,
        },
      });
    } else if (routeLayerExists) {
      const source = map.current.getSource('routes') as mapboxgl.GeoJSONSource;
      source.setData(JSON.parse(JSON.stringify(getRoutesGeoJson())));
    }
  };

  const getRoutesGeoJson = () => {
    return {
      type: 'FeatureCollection',
      features: routes.map((route) => ({
        type: 'Feature',
        properties: {
          routeId: route.id,
          routeName: route.name,
          shipName: route.ship?.name || '未知',
        },
        geometry: {
          type: 'LineString',
          coordinates: route.waypoints
            .sort((a, b) => a.order - b.order)
            .map((wp) => [wp.longitude, wp.latitude]),
        },
      })),
    };
  };

  const renderShips = () => {
    if (!map.current) return;

    const markers = map.current.getLayer('ship-markers');
    if (!markers) {
      map.current.addSource('ships', {
        type: 'geojson',
        data: JSON.parse(JSON.stringify(getShipsGeoJson())),
      });

      map.current.addLayer({
        id: 'ship-markers',
        type: 'circle',
        source: 'ships',
        paint: {
          'circle-radius': 8,
          'circle-color': '#e74c3c',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.current.on('click', 'ship-markers', (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, {
          layers: ['ship-markers'],
        });
        if (features && features.length > 0) {
          const shipId = features[0].properties?.shipId as string;
          setSelectedShip(shipId);
        }
      });
    } else {
      const source = map.current.getSource('ships') as mapboxgl.GeoJSONSource;
      source.setData(JSON.parse(JSON.stringify(getShipsGeoJson())));
    }
  };

  const getShipsGeoJson = () => {
    return {
      type: 'FeatureCollection',
      features: positions.map((pos) => ({
        type: 'Feature',
        properties: {
          shipId: pos.shipId,
          shipName: pos.shipName || '未知',
          shipCode: pos.shipCode || '未知',
          speed: pos.speed || 0,
          course: pos.course || 0,
          status: pos.status || '未知',
          timestamp: pos.timestamp || new Date().toISOString(),
        },
        geometry: {
          type: 'Point',
          coordinates: [pos.longitude, pos.latitude],
        },
      })),
    };
  };

  const getShipById = (shipId: string) => {
    return ships.find((s) => s.id === shipId);
  };

  const getPositionById = (shipId: string) => {
    return positions.find((p) => p.shipId === shipId);
  };

  const handleSimulatePosition = async (shipId: string) => {
    const ship = getShipById(shipId);
    const currentPos = getPositionById(shipId);
    
    if (!ship) return;

    const newLat = (currentPos?.latitude || 30) + (Math.random() - 0.5) * 0.1;
    const newLng = (currentPos?.longitude || 120) + (Math.random() - 0.5) * 0.1;

    try {
      await positionApi.update({
        shipId,
        latitude: newLat,
        longitude: newLng,
        speed: Math.random() * 20,
        course: Math.random() * 360,
        status: 'active',
        heading: Math.random() * 360,
      });
      loadData();
    } catch (error) {
      console.error('模拟位置更新失败:', error);
    }
  };

  const selectedShipData = selectedShip ? getPositionById(selectedShip) : null;
  const selectedShipInfo = selectedShip ? getShipById(selectedShip) : null;

  return (
    <div>
      <div className="page-header">
        <h2>地图监控</h2>
        <p style={{ color: '#7f8c8d', marginTop: '5px' }}>
          实时显示船舶位置和航线轨迹，数据每5秒自动刷新
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
        <div className="map-container" ref={mapContainer} />
        
        <div style={{ width: '300px', backgroundColor: 'white', borderRadius: '8px', padding: '15px', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>船舶列表 ({positions.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {positions.length === 0 ? (
              <p style={{ color: '#7f8c8d' }}>暂无船舶位置数据</p>
            ) : (
              positions.map((pos) => (
                <div
                  key={pos.shipId}
                  style={{
                    padding: '10px',
                    border: selectedShip === pos.shipId ? '2px solid #3498db' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: selectedShip === pos.shipId ? '#f0f8ff' : 'white',
                  }}
                  onClick={() => setSelectedShip(pos.shipId)}
                >
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {pos.shipName || '未知船舶'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                    <div>编码: {pos.shipCode || '-'}</div>
                    <div>位置: {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}</div>
                    <div>速度: {pos.speed ? `${pos.speed.toFixed(1)} kn` : '-'}</div>
                    <div>状态: <span className={`status-${pos.status === 'active' ? 'active' : 'inactive'}`}>{pos.status || '未知'}</span></div>
                  </div>
                  <button
                    className="btn btn-success"
                    style={{ marginTop: '10px', width: '100%' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSimulatePosition(pos.shipId);
                    }}
                  >
                    模拟移动
                  </button>
                </div>
              ))
            )}
          </div>
          
          {selectedShipData && selectedShipInfo && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
              <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>船舶详情</h3>
              <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                <div><strong>船舶名称:</strong> {selectedShipInfo.name}</div>
                <div><strong>船舶编码:</strong> {selectedShipInfo.shipCode}</div>
                <div><strong>IMO编号:</strong> {selectedShipInfo.imoNumber || '-'}</div>
                <div><strong>MMSI:</strong> {selectedShipInfo.mmsi || '-'}</div>
                <div><strong>船旗:</strong> {selectedShipInfo.flag || '-'}</div>
                <div><strong>类型:</strong> {selectedShipInfo.type || '-'}</div>
                <div><strong>长度:</strong> {selectedShipInfo.length || '-'} 米</div>
                <div><strong>宽度:</strong> {selectedShipInfo.width || '-'} 米</div>
                <div><strong>吃水:</strong> {selectedShipInfo.draft || '-'} 米</div>
                <div><strong>吨位:</strong> {selectedShipInfo.tonnage || '-'}</div>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                  <div><strong>当前纬度:</strong> {selectedShipData.latitude.toFixed(6)}</div>
                  <div><strong>当前经度:</strong> {selectedShipData.longitude.toFixed(6)}</div>
                  <div><strong>航速:</strong> {selectedShipData.speed ? `${selectedShipData.speed.toFixed(1)} 节` : '-'}</div>
                  <div><strong>航向:</strong> {selectedShipData.course ? `${selectedShipData.course.toFixed(0)}°` : '-'}</div>
                  <div><strong>状态:</strong> <span className={`status-${selectedShipData.status === 'active' ? 'active' : 'inactive'}`}>{selectedShipData.status || '未知'}</span></div>
                  <div><strong>更新时间:</strong> {selectedShipData.timestamp ? new Date(selectedShipData.timestamp).toLocaleString() : '-'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapDisplay;
