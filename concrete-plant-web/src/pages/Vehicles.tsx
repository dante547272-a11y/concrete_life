/**
 * Vehicles Management Page - 车辆设备管理
 */

import React, { useState } from 'react';
import { Table, Button, Space, Input, Tag, Tabs, Checkbox } from 'antd';
import { PlusOutlined, SearchOutlined, EnvironmentOutlined, CarOutlined } from '@ant-design/icons';
import { AppLayout } from '../components/layout';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

interface Vehicle {
  id: string; plateNumber: string; vehicleType: 'mixer' | 'pump' | 'transport'; capacity: number;
  status: 'available' | 'in_use' | 'maintenance' | 'offline'; driver?: string;
  location?: { lat: number; lng: number }; speed?: number; destination?: string; eta?: string;
}

const HANGZHOU_CENTER: [number, number] = [30.2741, 120.1551];
const mockVehicles: Vehicle[] = [
  { id: '1', plateNumber: '浙A12345', vehicleType: 'mixer', capacity: 8, status: 'in_use', driver: '张三', location: { lat: 30.2891, lng: 120.1621 }, speed: 35, destination: '西湖区工地A', eta: '15分钟' },
  { id: '2', plateNumber: '浙A23456', vehicleType: 'mixer', capacity: 10, status: 'in_use', driver: '李四', location: { lat: 30.2541, lng: 120.1851 }, speed: 42, destination: '滨江区工地B', eta: '22分钟' },
  { id: '3', plateNumber: '浙A34567', vehicleType: 'mixer', capacity: 8, status: 'available', driver: '王五', location: { lat: 30.2641, lng: 120.1451 }, speed: 0 },
  { id: '4', plateNumber: '浙A45678', vehicleType: 'pump', capacity: 0, status: 'in_use', driver: '赵六', location: { lat: 30.2341, lng: 120.2051 }, speed: 28, destination: '萧山区工地C', eta: '35分钟' },
  { id: '5', plateNumber: '浙A56789', vehicleType: 'mixer', capacity: 12, status: 'maintenance', driver: '钱七' },
  { id: '6', plateNumber: '浙A67890', vehicleType: 'mixer', capacity: 8, status: 'in_use', driver: '孙八', location: { lat: 30.3041, lng: 120.1251 }, speed: 38, destination: '拱墅区工地D', eta: '18分钟' },
  { id: '7', plateNumber: '浙A78901', vehicleType: 'transport', capacity: 20, status: 'offline' },
  { id: '8', plateNumber: '浙A89012', vehicleType: 'mixer', capacity: 10, status: 'in_use', driver: '周九', location: { lat: 30.2441, lng: 120.1351 }, speed: 45, destination: '上城区工地E', eta: '12分钟' },
];

const statusColors: Record<string, string> = { available: 'green', in_use: 'blue', maintenance: 'orange', offline: 'default' };
const statusLabels: Record<string, string> = { available: '空闲', in_use: '运输中', maintenance: '维护中', offline: '离线' };
const typeLabels: Record<string, string> = { mixer: '搅拌车', pump: '泵车', transport: '运输车' };

const createTruckIcon = (status: string) => {
  const color = status === 'in_use' ? '#1890ff' : status === 'available' ? '#52c41a' : '#faad14';
  return L.divIcon({ className: 'custom-truck-icon', html: `<div style="width:32px;height:32px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">🚛</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
};

const Vehicles: React.FC = () => {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(mockVehicles.map(v => v.id));
  const [searchText, setSearchText] = useState('');
  const vehiclesWithLocation = mockVehicles.filter(v => v.location);
  const filteredVehicles = mockVehicles.filter(v => v.plateNumber.includes(searchText) || (v.driver && v.driver.includes(searchText)));

  const columns = [
    { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber' },
    { title: '车辆类型', dataIndex: 'vehicleType', key: 'vehicleType', render: (type: string) => typeLabels[type] },
    { title: '容量 (m³)', dataIndex: 'capacity', key: 'capacity' },
    { title: '司机', dataIndex: 'driver', key: 'driver', render: (d: string) => d || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag> },
    { title: '操作', key: 'actions', render: () => <Space><Button type="link" size="small">编辑</Button><Button type="link" size="small">定位</Button><Button type="link" size="small" danger>删除</Button></Space> },
  ];

  const VehicleListPanel = () => (
    <div style={{ width: 280, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>车辆分组</div>
        <Checkbox checked>全部</Checkbox>
        <div style={{ marginLeft: 20, marginTop: 4 }}><Checkbox checked>默认分组</Checkbox></div>
      </div>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border-color)' }}><Input placeholder="请输入车牌号" prefix={<SearchOutlined />} size="small" value={searchText} onChange={e => setSearchText(e.target.value)} /></div>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 8 }}><Tag color="blue">全部({mockVehicles.length})</Tag><Tag color="green">在线({vehiclesWithLocation.length})</Tag><Tag>离线({mockVehicles.length - vehiclesWithLocation.length})</Tag></div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', fontSize: 12 }}>
          <thead><tr style={{ background: 'var(--bg-tertiary)' }}><th style={{ padding: '8px 4px', textAlign: 'left' }}></th><th style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--text-secondary)' }}>车牌</th><th style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--text-secondary)' }}>当前状态</th></tr></thead>
          <tbody>{filteredVehicles.map(v => (<tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '6px 4px' }}><Checkbox checked={selectedVehicles.includes(v.id)} onChange={e => { if (e.target.checked) setSelectedVehicles([...selectedVehicles, v.id]); else setSelectedVehicles(selectedVehicles.filter(id => id !== v.id)); }} /></td><td style={{ padding: '6px 4px', color: 'var(--text-primary)' }}>{v.plateNumber}</td><td style={{ padding: '6px 4px' }}>{v.status === 'in_use' && v.eta ? <Tag color="green" style={{ fontSize: 10 }}>距离{v.eta}</Tag> : v.status === 'available' ? <Tag color="cyan" style={{ fontSize: 10 }}>静止中</Tag> : v.status === 'maintenance' ? <Tag color="orange" style={{ fontSize: 10 }}>维护中</Tag> : <Tag style={{ fontSize: 10 }}>离线</Tag>}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const MapOverview = () => (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <VehicleListPanel />
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={HANGZHOU_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {vehiclesWithLocation.filter(v => selectedVehicles.includes(v.id)).map(vehicle => (
            <Marker key={vehicle.id} position={[vehicle.location!.lat, vehicle.location!.lng]} icon={createTruckIcon(vehicle.status)}>
              <Tooltip permanent direction="top" offset={[0, -20]}><div style={{ fontSize: 11, fontWeight: 600 }}>{vehicle.plateNumber}</div></Tooltip>
              <Popup><div style={{ minWidth: 180 }}><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 8 }}>{vehicle.plateNumber}</div><div style={{ fontSize: 12, lineHeight: 1.8 }}><div><strong>司机:</strong> {vehicle.driver}</div><div><strong>类型:</strong> {typeLabels[vehicle.vehicleType]}</div><div><strong>状态:</strong> <Tag color={statusColors[vehicle.status]} style={{ marginLeft: 4 }}>{statusLabels[vehicle.status]}</Tag></div>{vehicle.speed !== undefined && <div><strong>速度:</strong> {vehicle.speed} km/h</div>}{vehicle.destination && <div><strong>目的地:</strong> {vehicle.destination}</div>}{vehicle.eta && <div><strong>预计到达:</strong> {vehicle.eta}</div>}</div></div></Popup>
            </Marker>
          ))}
        </MapContainer>
        <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: 12, color: '#333' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>图例</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><div style={{ width: 16, height: 16, background: '#1890ff', borderRadius: '50%' }}></div><span>运输中</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><div style={{ width: 16, height: 16, background: '#52c41a', borderRadius: '50%' }}></div><span>空闲</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 16, height: 16, background: '#faad14', borderRadius: '50%' }}></div><span>维护中</span></div>
        </div>
      </div>
    </div>
  );

  const VehicleList = () => (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}><Input placeholder="搜索车牌号" prefix={<SearchOutlined />} style={{ width: 200 }} value={searchText} onChange={e => setSearchText(e.target.value)} /><Button type="primary" icon={<PlusOutlined />}>新增车辆</Button></div>
      <Table columns={columns} dataSource={filteredVehicles} rowKey="id" pagination={{ pageSize: 10 }} />
    </div>
  );

  return (
    <AppLayout selectedKey="vehicles">
      <Tabs defaultActiveKey="map" items={[{ key: 'map', label: <span><EnvironmentOutlined /> 车辆定位</span>, children: <MapOverview /> }, { key: 'list', label: <span><CarOutlined /> 车辆列表</span>, children: <VehicleList /> }]} style={{ height: '100%' }} tabBarStyle={{ margin: 0, paddingLeft: 16, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }} />
    </AppLayout>
  );
};

export default Vehicles;
