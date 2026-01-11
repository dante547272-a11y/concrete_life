/**
 * Production Control Page - 生产中控可视化编辑器
 * 可拖拽编辑的SCADA画布
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppLayout } from '../components/layout';
import { Button, message, Modal, Tooltip, Collapse, Table, Tag, Select } from 'antd';
import { 
  EditOutlined, 
  SaveOutlined, 
  DeleteOutlined,
  DragOutlined,
  PlusOutlined,
  RollbackOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ExperimentOutlined
} from '@ant-design/icons';

// ============ Types ============
interface CanvasComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  props: Record<string, unknown>;
}

interface ComponentTemplate {
  type: string;
  name: string;
  icon: React.ReactNode;
  defaultProps: Record<string, unknown>;
  width: number;
  height: number;
}

// ============ Component Templates ============
const componentTemplates: Record<string, ComponentTemplate[]> = {
  '料仓': [
    { type: 'aggregate-bin', name: '骨料仓', icon: '🏗️', defaultProps: { name: '砂仓', fillLevel: 75, material: 'sand' }, width: 90, height: 140 },
    { type: 'cement-silo', name: '水泥仓', icon: '🏭', defaultProps: { name: '水泥仓', fillLevel: 80 }, width: 70, height: 150 },
    { type: 'tank', name: '液体罐', icon: '🛢️', defaultProps: { name: '水箱', fillLevel: 70, isWater: true }, width: 55, height: 140 },
  ],
  '计量': [
    { type: 'scale', name: '秤', icon: '⚖️', defaultProps: { name: '骨料秤', weight: 0, targetWeight: 1000 }, width: 80, height: 90 },
  ],
  '输送': [
    { type: 'belt', name: '传送带', icon: '➡️', defaultProps: { running: false }, width: 240, height: 100 },
    { type: 'pipe-h', name: '水平管道', icon: '━', defaultProps: { length: 100 }, width: 100, height: 10 },
    { type: 'pipe-v', name: '垂直管道', icon: '┃', defaultProps: { length: 80 }, width: 10, height: 80 },
  ],
  '设备': [
    { type: 'mixer', name: '搅拌机', icon: '🔄', defaultProps: { running: false }, width: 100, height: 110 },
    { type: 'truck', name: '搅拌车', icon: '🚛', defaultProps: { present: true }, width: 170, height: 110 },
    { type: 'valve', name: '阀门', icon: '🔴', defaultProps: { open: false }, width: 20, height: 20 },
  ],
};

// ============ Initial Canvas Layout ============
const initialComponents: CanvasComponent[] = [
  { id: 'sand1', type: 'aggregate-bin', x: 50, y: 50, props: { name: '砂1', fillLevel: 75, material: 'sand' } },
  { id: 'rock1', type: 'aggregate-bin', x: 160, y: 50, props: { name: '石1', fillLevel: 60, material: 'rock' } },
  { id: 'cem1', type: 'cement-silo', x: 300, y: 60, props: { name: '水泥仓1', fillLevel: 85 } },
  { id: 'cem2', type: 'cement-silo', x: 390, y: 60, props: { name: '水泥仓2', fillLevel: 70 } },
  { id: 'water1', type: 'tank', x: 550, y: 60, props: { name: '水箱', fillLevel: 80, isWater: true } },
  { id: 'wrda1', type: 'tank', x: 620, y: 60, props: { name: '减水剂', fillLevel: 65, isWater: false } },
  { id: 'scale-agg', type: 'scale', x: 80, y: 220, props: { name: '骨料秤', weight: 0, targetWeight: 1400 } },
  { id: 'scale-cem', type: 'scale', x: 320, y: 220, props: { name: '粉料秤', weight: 0, targetWeight: 280 } },
  { id: 'scale-water', type: 'scale', x: 560, y: 220, props: { name: '水秤', weight: 0, targetWeight: 175 } },
  { id: 'belt1', type: 'belt', x: 50, y: 380, props: { running: false } },
  { id: 'mixer1', type: 'mixer', x: 420, y: 380, props: { running: false } },
  { id: 'truck1', type: 'truck', x: 380, y: 430, props: { present: true } },
];

// ============ 配方列表数据 ============
interface RecipeData {
  id: string;
  name: string;
  grade: string;
  slump: string;
  materials: { key: string; name: string; target: number; unit: string; tolerance: string }[];
}

const recipeList: RecipeData[] = [
  {
    id: '1',
    name: 'C30标准配方',
    grade: 'C30',
    slump: '180±20mm',
    materials: [
      { key: '1', name: '水泥 P.O 42.5', target: 280, unit: 'kg', tolerance: '±2%' },
      { key: '2', name: '砂 (中砂)', target: 800, unit: 'kg', tolerance: '±3%' },
      { key: '3', name: '石子 5-25mm', target: 1050, unit: 'kg', tolerance: '±3%' },
      { key: '4', name: '水', target: 175, unit: 'kg', tolerance: '±1%' },
      { key: '5', name: '减水剂', target: 5.6, unit: 'kg', tolerance: '±5%' },
      { key: '6', name: '粉煤灰', target: 70, unit: 'kg', tolerance: '±2%' },
    ],
  },
  {
    id: '2',
    name: 'C40高强配方',
    grade: 'C40',
    slump: '160±20mm',
    materials: [
      { key: '1', name: '水泥 P.O 42.5', target: 350, unit: 'kg', tolerance: '±2%' },
      { key: '2', name: '砂 (中砂)', target: 750, unit: 'kg', tolerance: '±3%' },
      { key: '3', name: '石子 5-25mm', target: 1100, unit: 'kg', tolerance: '±3%' },
      { key: '4', name: '水', target: 165, unit: 'kg', tolerance: '±1%' },
      { key: '5', name: '减水剂', target: 7.0, unit: 'kg', tolerance: '±5%' },
      { key: '6', name: '矿粉', target: 100, unit: 'kg', tolerance: '±2%' },
    ],
  },
  {
    id: '3',
    name: 'C25经济配方',
    grade: 'C25',
    slump: '180±20mm',
    materials: [
      { key: '1', name: '水泥 P.O 42.5', target: 250, unit: 'kg', tolerance: '±2%' },
      { key: '2', name: '砂 (中砂)', target: 850, unit: 'kg', tolerance: '±3%' },
      { key: '3', name: '石子 5-25mm', target: 1000, unit: 'kg', tolerance: '±3%' },
      { key: '4', name: '水', target: 180, unit: 'kg', tolerance: '±1%' },
      { key: '5', name: '减水剂', target: 4.5, unit: 'kg', tolerance: '±5%' },
    ],
  },
  {
    id: '4',
    name: 'C35抗渗配方',
    grade: 'C35',
    slump: '160±20mm',
    materials: [
      { key: '1', name: '水泥 P.O 42.5', target: 320, unit: 'kg', tolerance: '±2%' },
      { key: '2', name: '砂 (中砂)', target: 780, unit: 'kg', tolerance: '±3%' },
      { key: '3', name: '石子 5-25mm', target: 1080, unit: 'kg', tolerance: '±3%' },
      { key: '4', name: '水', target: 170, unit: 'kg', tolerance: '±1%' },
      { key: '5', name: '减水剂', target: 6.4, unit: 'kg', tolerance: '±5%' },
      { key: '6', name: '矿粉', target: 90, unit: 'kg', tolerance: '±2%' },
    ],
  },
];

const ProductionControl: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [components, setComponents] = useState<CanvasComponent[]>(initialComponents);
  const [savedComponents, setSavedComponents] = useState<CanvasComponent[]>(initialComponents); // 保存的状态用于恢复
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedTemplate, setDraggedTemplate] = useState<ComponentTemplate | null>(null);
  const [valveStates, setValveStates] = useState<Record<string, boolean>>({});
  const [beltRunning, setBeltRunning] = useState(false);
  const [beltTime, setBeltTime] = useState('00:00:00');
  const [beltSeconds, setBeltSeconds] = useState(0);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('1'); // 默认选择第一个配方
  const svgRef = useRef<SVGSVGElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // 获取当前选中的配方
  const currentRecipe = recipeList.find(r => r.id === selectedRecipeId) || recipeList[0];

  // 配料表列定义
  const recipeColumns = [
    { title: '原材料', dataIndex: 'name', key: 'name' },
    { title: '目标量', dataIndex: 'target', key: 'target', render: (v: number, r: { unit: string }) => `${v} ${r.unit}` },
    { title: '允许误差', dataIndex: 'tolerance', key: 'tolerance' },
  ];

  // 保存配方选择
  const handleSaveRecipe = () => {
    setRecipeModalOpen(false);
    message.success(`已选择配方: ${currentRecipe.name}`);
  };

  // 传送带计时器
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (beltRunning) {
      interval = setInterval(() => {
        setBeltSeconds(prev => {
          const newSeconds = prev + 1;
          const h = Math.floor(newSeconds / 3600).toString().padStart(2, '0');
          const m = Math.floor((newSeconds % 3600) / 60).toString().padStart(2, '0');
          const s = (newSeconds % 60).toString().padStart(2, '0');
          setBeltTime(`${h}:${m}:${s}`);
          return newSeconds;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [beltRunning]);

  // 进入编辑模式时保存当前状态
  const enterEditMode = () => {
    setSavedComponents([...components]);
    setIsEditMode(true);
  };

  // 保存并退出编辑模式
  const saveAndExit = () => {
    setSavedComponents([...components]);
    setIsEditMode(false);
    setSelectedId(null);
    message.success('布局已保存');
  };

  // 取消编辑，恢复到之前的状态
  const cancelEdit = () => {
    Modal.confirm({
      title: '放弃修改',
      content: '确定要放弃当前的修改吗？所有未保存的更改将丢失。',
      okText: '放弃修改',
      cancelText: '继续编辑',
      okButtonProps: { danger: true },
      onOk: () => {
        setComponents([...savedComponents]);
        setIsEditMode(false);
        setSelectedId(null);
        message.info('已恢复到修改前的状态');
      },
    });
  };

  // Get SVG coordinates from mouse event
  const getSvgCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  // Handle component drag start
  const handleDragStart = useCallback((e: React.MouseEvent, id: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const comp = components.find(c => c.id === id);
    if (!comp) return;
    const coords = getSvgCoords(e);
    dragOffset.current = { x: coords.x - comp.x, y: coords.y - comp.y };
    isDragging.current = true;
    setSelectedId(id);
  }, [isEditMode, components, getSvgCoords]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !selectedId) return;
    const coords = getSvgCoords(e);
    setComponents(prev => prev.map(c => 
      c.id === selectedId 
        ? { ...c, x: coords.x - dragOffset.current.x, y: coords.y - dragOffset.current.y }
        : c
    ));
  }, [selectedId, getSvgCoords]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Handle drop from component panel
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTemplate) return;
    const coords = getSvgCoords(e as unknown as React.MouseEvent);
    const newId = `${draggedTemplate.type}-${Date.now()}`;
    setComponents(prev => [...prev, {
      id: newId,
      type: draggedTemplate.type,
      x: coords.x - draggedTemplate.width / 2,
      y: coords.y - draggedTemplate.height / 2,
      props: { ...draggedTemplate.defaultProps },
    }]);
    setDraggedTemplate(null);
    message.success(`已添加 ${draggedTemplate.name}`);
  }, [draggedTemplate, getSvgCoords]);

  // Delete selected component
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    Modal.confirm({
      title: '确认删除',
      content: '是否确认删除该组件？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setComponents(prev => prev.filter(c => c.id !== selectedId));
        setSelectedId(null);
        message.success('组件已删除');
      },
    });
  }, [selectedId]);

  // Handle valve click
  const handleValveClick = (valveId: string, valveName: string) => {
    if (isEditMode) return;
    const isOpen = valveStates[valveId];
    Modal.confirm({
      title: isOpen ? '确认关闭阀门' : '确认打开阀门',
      content: `是否确认${isOpen ? '关闭' : '打开'}${valveName}的阀门？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setValveStates(prev => ({ ...prev, [valveId]: !prev[valveId] }));
        message.success(`${valveName}阀门已${isOpen ? '关闭' : '打开'}`);
      },
    });
  };

  const startBatch = () => {
    setBeltRunning(true);
    setBeltSeconds(0);
    setBeltTime('00:00:00');
    message.success('生产已启动');
  };

  const stopBatch = () => {
    setBeltRunning(false);
    message.warning('生产已停止');
  };

  // ============ Render Components ============
  const renderComponent = (comp: CanvasComponent) => {
    const isSelected = selectedId === comp.id && isEditMode;
    const selectionStyle = isSelected ? { filter: 'drop-shadow(0 0 4px #1890ff)' } : {};
    
    switch (comp.type) {
      case 'aggregate-bin':
        return renderAggregateBin(comp, selectionStyle);
      case 'cement-silo':
        return renderCementSilo(comp, selectionStyle);
      case 'tank':
        return renderTank(comp, selectionStyle);
      case 'scale':
        return renderScale(comp, selectionStyle);
      case 'belt':
        return renderBelt(comp, selectionStyle);
      case 'mixer':
        return renderMixer(comp, selectionStyle);
      case 'truck':
        return renderTruck(comp, selectionStyle);
      case 'valve':
        return renderValve(comp, selectionStyle);
      case 'pipe-h':
        return renderPipeH(comp, selectionStyle);
      case 'pipe-v':
        return renderPipeV(comp, selectionStyle);
      default:
        return null;
    }
  };

  // Aggregate Bin
  const renderAggregateBin = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
    >
      <rect x="0" y="0" width="90" height="22" fill="#ff9800" rx="2" />
      <text x="45" y="15" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{comp.props.name as string}</text>
      <path d="M0,24 L0,80 L20,110 L70,110 L90,80 L90,24 Z" fill="#546e7a" stroke="#37474f" strokeWidth="2" />
      {comp.props.material === 'sand' && (
        <path d={`M5,${80 - (comp.props.fillLevel as number) * 0.5} L5,75 L22,105 L68,105 L85,75 L85,${80 - (comp.props.fillLevel as number) * 0.5} Z`} fill="#e8d4a8" />
      )}
      {comp.props.material === 'rock' && (
        <path d={`M5,${80 - (comp.props.fillLevel as number) * 0.5} L5,75 L22,105 L68,105 L85,75 L85,${80 - (comp.props.fillLevel as number) * 0.5} Z`} fill="#5d4e37" />
      )}
      <rect x="10" y="35" width="70" height="16" fill="#1a1a1a" rx="2" />
      <text x="45" y="47" textAnchor="middle" fill="#ff9800" fontSize="10" fontFamily="monospace">0 kg</text>
      <rect x="10" y="55" width="70" height="16" fill="#1a1a1a" rx="2" />
      <text x="45" y="67" textAnchor="middle" fill="#ff9800" fontSize="10" fontFamily="monospace">800 kg</text>
      <g transform="translate(10, 115)" style={{ cursor: 'pointer' }} onClick={() => handleValveClick(`${comp.id}_left`, comp.props.name as string)}>
        <circle cx="8" cy="8" r="6" fill={valveStates[`${comp.id}_left`] ? '#4CAF50' : '#f44336'} stroke="#333" strokeWidth="1" />
      </g>
      <g transform="translate(62, 115)" style={{ cursor: 'pointer' }} onClick={() => handleValveClick(`${comp.id}_right`, comp.props.name as string)}>
        <circle cx="8" cy="8" r="6" fill={valveStates[`${comp.id}_right`] ? '#4CAF50' : '#f44336'} stroke="#333" strokeWidth="1" />
      </g>
    </g>
  );

  // Cement Silo
  const renderCementSilo = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
    >
      <rect x="0" y="0" width="70" height="18" fill="#607d8b" rx="2" />
      <text x="35" y="13" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{comp.props.name as string}</text>
      <rect x="5" y="20" width="60" height="70" fill="#546e7a" stroke="#37474f" strokeWidth="2" rx="3" />
      <rect x="8" y={20 + 70 - (comp.props.fillLevel as number) * 0.65} width="54" height={(comp.props.fillLevel as number) * 0.65} fill="#9e9e9e" rx="2" />
      <rect x="10" y="30" width="50" height="14" fill="#1a1a1a" rx="2" />
      <text x="35" y="40" textAnchor="middle" fill="#ff9800" fontSize="9" fontFamily="monospace">0 kg</text>
      <rect x="10" y="48" width="50" height="14" fill="#1a1a1a" rx="2" />
      <text x="35" y="58" textAnchor="middle" fill="#ff9800" fontSize="9" fontFamily="monospace">280 kg</text>
      <path d="M15,90 L55,90 L40,110 L30,110 Z" fill="#546e7a" stroke="#37474f" strokeWidth="2" />
      <g transform="translate(25, 112)" style={{ cursor: 'pointer' }} onClick={() => handleValveClick(comp.id, comp.props.name as string)}>
        <circle cx="8" cy="8" r="6" fill={valveStates[comp.id] ? '#4CAF50' : '#f44336'} stroke="#333" strokeWidth="1" />
      </g>
    </g>
  );

  // Tank
  const renderTank = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
    >
      <rect x="0" y="0" width="55" height="16" fill={comp.props.isWater ? '#2196f3' : '#607d8b'} rx="2" />
      <text x="27" y="12" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{comp.props.name as string}</text>
      <rect x="5" y="20" width="45" height="60" fill="#546e7a" stroke="#37474f" strokeWidth="2" rx="3" />
      <rect x="8" y={20 + 60 - (comp.props.fillLevel as number) * 0.55} width="39" height={(comp.props.fillLevel as number) * 0.55} fill={comp.props.isWater ? '#64b5f6' : '#90caf9'} rx="2" />
      <rect x="8" y="28" width="39" height="12" fill="#1a1a1a" rx="1" />
      <text x="27" y="37" textAnchor="middle" fill="#4CAF50" fontSize="8" fontFamily="monospace">0 L</text>
      <rect x="8" y="44" width="39" height="12" fill="#1a1a1a" rx="1" />
      <text x="27" y="53" textAnchor="middle" fill="#ff9800" fontSize="8" fontFamily="monospace">175 L</text>
      <rect x="22" y="80" width="11" height="15" fill="#ff9800" />
      <g transform="translate(17, 96)" style={{ cursor: 'pointer' }} onClick={() => handleValveClick(comp.id, comp.props.name as string)}>
        <circle cx="8" cy="8" r="6" fill={valveStates[comp.id] ? '#4CAF50' : '#f44336'} stroke="#333" strokeWidth="1" />
      </g>
    </g>
  );

  // Scale
  const renderScale = (comp: CanvasComponent, style: React.CSSProperties) => {
    const width = 80;
    return (
      <g 
        key={comp.id} 
        transform={`translate(${comp.x}, ${comp.y})`}
        style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
        onMouseDown={(e) => handleDragStart(e, comp.id)}
      >
        <rect x="0" y="0" width={width} height="16" fill="#607d8b" rx="2" />
        <text x={width/2} y="12" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{comp.props.name as string}</text>
        <path d={`M0,18 L${width},18 L${width*0.75},55 L${width*0.25},55 Z`} fill="#78909c" stroke="#546e7a" strokeWidth="2" />
        <rect x="5" y="22" width={width-10} height="12" fill="#1a1a1a" rx="1" />
        <text x={width/2} y="31" textAnchor="middle" fill="#ff9800" fontSize="9" fontFamily="monospace">{comp.props.weight as number} kg</text>
        <rect x="5" y="36" width={width-10} height="12" fill="#1a1a1a" rx="1" />
        <text x={width/2} y="45" textAnchor="middle" fill="#ff9800" fontSize="9" fontFamily="monospace">{comp.props.targetWeight as number} kg</text>
        <g transform={`translate(${width/2 - 8}, 58)`} style={{ cursor: 'pointer' }} onClick={() => handleValveClick(comp.id, comp.props.name as string)}>
          <circle cx="8" cy="8" r="6" fill={valveStates[comp.id] ? '#4CAF50' : '#f44336'} stroke="#333" strokeWidth="1" />
        </g>
      </g>
    );
  };

  // Belt
  const renderBelt = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
    >
      <rect x="0" y="0" width="240" height="35" fill="#78909c" stroke="#546e7a" strokeWidth="2" rx="5" />
      {Array.from({ length: 24 }).map((_, i) => (
        <rect key={i} x={5 + i * 10} y="2" width="6" height="31" fill="#90a4ae" rx="1" />
      ))}
      <rect x="0" y="38" width="240" height="25" fill="#546e7a" stroke="#455a64" strokeWidth="2" rx="3" />
      {[20, 60, 100, 140, 180, 220].map((pos, i) => (
        <g key={i} transform={`translate(${pos}, 50)`}>
          <circle cx="0" cy="0" r="12" fill="#ff9800" stroke="#e65100" strokeWidth="2" />
          <circle cx="0" cy="0" r="3" fill="#ffb74d" />
        </g>
      ))}
      <g transform="translate(20, 85)" style={{ cursor: 'pointer' }} onClick={() => { if (!isEditMode) { setBeltRunning(!beltRunning); } }}>
        <circle cx="0" cy="0" r="16" fill={beltRunning ? '#4CAF50' : '#555'} stroke={beltRunning ? '#2E7D32' : '#333'} strokeWidth="3" />
        <circle cx="0" cy="0" r="13" fill={beltRunning ? '#66BB6A' : '#666'} />
        <path d="M0,-7 L0,-2" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M-5,1 A6,6 0 1,0 5,1" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
      <rect x="50" y="75" width="80" height="22" fill={beltRunning ? '#f44336' : '#666'} rx="3" />
      <text x="90" y="90" textAnchor="middle" fill="white" fontSize="12" fontFamily="monospace" fontWeight="bold">{beltTime}</text>
    </g>
  );

  // Mixer
  const renderMixer = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
    >
      <path d="M0,0 L100,0 L90,50 L10,50 Z" fill="#78909c" stroke="#546e7a" strokeWidth="2" />
      <path d="M35,50 L65,50 L55,80 L45,80 Z" fill="#607d8b" stroke="#546e7a" strokeWidth="2" />
      <rect x="42" y="80" width="16" height="10" fill="#ff9800" />
      <g transform="translate(42, 95)" style={{ cursor: 'pointer' }} onClick={() => handleValveClick(comp.id, '搅拌机')}>
        <circle cx="8" cy="8" r="6" fill={valveStates[comp.id] ? '#4CAF50' : '#f44336'} stroke="#333" strokeWidth="1" />
      </g>
    </g>
  );

  // Truck
  const renderTruck = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
    >
      <line x1="-10" y1="75" x2="180" y2="75" stroke="#666" strokeWidth="2" />
      <g transform="translate(0, 20)">
        <path d="M0,55 L0,20 L10,10 L35,10 L40,0 L50,0 L50,55 Z" fill="#78909c" stroke="#546e7a" strokeWidth="2" />
        <path d="M12,15 L35,15 L38,5 L45,5 L45,35 L12,35 Z" fill="#90a4ae" stroke="#607d8b" strokeWidth="1" />
      </g>
      <rect x="45" y="55" width="115" height="20" fill="#607d8b" stroke="#455a64" strokeWidth="2" rx="2" />
      <g transform="translate(55, 10)">
        <path d="M0,45 L5,10 Q50,-15 95,10 L100,45 Q50,65 0,45 Z" fill="#e0e0e0" stroke="#9e9e9e" strokeWidth="2" />
        <g stroke="#424242" strokeWidth="3" fill="none">
          <path d="M20,35 Q35,15 50,35 Q65,55 80,35" />
          <path d="M25,25 Q40,5 55,25 Q70,45 85,25" />
        </g>
      </g>
      <g transform="translate(25, 75)"><circle cx="0" cy="0" r="14" fill="#37474f" stroke="#263238" strokeWidth="2" /><circle cx="0" cy="0" r="8" fill="#455a64" /></g>
      <g transform="translate(110, 75)"><circle cx="0" cy="0" r="14" fill="#37474f" stroke="#263238" strokeWidth="2" /><circle cx="0" cy="0" r="8" fill="#455a64" /></g>
      <g transform="translate(140, 75)"><circle cx="0" cy="0" r="14" fill="#37474f" stroke="#263238" strokeWidth="2" /><circle cx="0" cy="0" r="8" fill="#455a64" /></g>
    </g>
  );

  // Valve
  const renderValve = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'pointer' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
      onClick={() => handleValveClick(comp.id, '阀门')}
    >
      <circle cx="10" cy="10" r="8" fill={valveStates[comp.id] ? '#4CAF50' : '#f44336'} stroke="#333" strokeWidth="2" />
    </g>
  );

  // Horizontal Pipe
  const renderPipeH = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
    >
      <line x1="0" y1="5" x2={comp.props.length as number} y2="5" stroke="#546e7a" strokeWidth="3" />
    </g>
  );

  // Vertical Pipe
  const renderPipeV = (comp: CanvasComponent, style: React.CSSProperties) => (
    <g 
      key={comp.id} 
      transform={`translate(${comp.x}, ${comp.y})`}
      style={{ ...style, cursor: isEditMode ? 'move' : 'default' }}
      onMouseDown={(e) => handleDragStart(e, comp.id)}
    >
      <line x1="5" y1="0" x2="5" y2={comp.props.length as number} stroke="#546e7a" strokeWidth="3" />
    </g>
  );

  // Component Panel Item
  const ComponentPanelItem = ({ template }: { template: ComponentTemplate }) => (
    <div
      draggable
      onDragStart={() => setDraggedTemplate(template)}
      onDragEnd={() => setDraggedTemplate(null)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: '#3d4852',
        borderRadius: 4,
        cursor: 'grab',
        marginBottom: 4,
        border: '1px solid #4a5568',
      }}
    >
      <span style={{ fontSize: 18 }}>{template.icon}</span>
      <span style={{ color: '#e2e8f0', fontSize: 12 }}>{template.name}</span>
    </div>
  );

  return (
    <AppLayout selectedKey="production-control">
      {/* 配料表弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ExperimentOutlined style={{ color: '#ff9800', fontSize: 20 }} />
            <span>选择配方</span>
          </div>
        }
        open={recipeModalOpen}
        onCancel={() => setRecipeModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setRecipeModalOpen(false)}>取消</Button>,
          <Button key="save" type="primary" onClick={handleSaveRecipe}>
            保存
          </Button>,
        ]}
        width={550}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ marginRight: 12 }}><strong>选择配方:</strong></span>
            <Select
              value={selectedRecipeId}
              onChange={setSelectedRecipeId}
              style={{ width: 300 }}
              options={recipeList.map(r => ({ 
                value: r.id, 
                label: (
                  <span>
                    {r.name} <Tag color="blue" style={{ marginLeft: 8 }}>{r.grade}</Tag>
                  </span>
                )
              }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 24, padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span><strong>配方名称:</strong> {currentRecipe.name}</span>
            <span><strong>等级:</strong> <Tag color="blue">{currentRecipe.grade}</Tag></span>
            <span><strong>坍落度:</strong> {currentRecipe.slump}</span>
          </div>
        </div>
        <Table
          columns={recipeColumns}
          dataSource={currentRecipe.materials}
          pagination={false}
          size="small"
          bordered
        />
        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>总方量:</strong> 约 {(currentRecipe.materials.reduce((sum, m) => sum + m.target, 0) / 1000).toFixed(2)} m³
          </div>
        </div>
      </Modal>

      <div style={{ display: 'flex', height: '100%', gap: 12, padding: 8, background: '#4a5568' }}>
        {/* Left Control Panel */}
        <div style={{ width: 90, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isEditMode ? (
            <>
              {/* 编辑模式按钮 */}
              <Tooltip title="保存布局">
                <Button 
                  size="small"
                  icon={<SaveOutlined />}
                  style={{ 
                    background: '#4CAF50', 
                    borderColor: '#2E7D32', 
                    color: 'white', 
                    height: 40,
                    fontSize: 13,
                  }}
                  onClick={saveAndExit}
                >
                  保存
                </Button>
              </Tooltip>
              
              <Tooltip title="放弃修改">
                <Button 
                  size="small"
                  icon={<RollbackOutlined />}
                  style={{ height: 40, fontSize: 13 }}
                  onClick={cancelEdit}
                >
                  返回
                </Button>
              </Tooltip>
              
              {selectedId && (
                <Button 
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  style={{ height: 40, fontSize: 13 }}
                  onClick={handleDelete}
                >
                  删除
                </Button>
              )}
            </>
          ) : (
            <>
              {/* 运行模式按钮 */}
              <Tooltip title="编辑布局">
                <Button 
                  size="small"
                  icon={<EditOutlined />}
                  style={{ 
                    background: '#2196f3', 
                    borderColor: '#1976d2', 
                    color: 'white', 
                    height: 40,
                    fontSize: 13,
                  }}
                  onClick={enterEditMode}
                >
                  编辑
                </Button>
              </Tooltip>
              <Button 
                size="small" 
                style={{ background: '#4CAF50', borderColor: '#2E7D32', color: 'white', height: 40, fontSize: 13 }}
                onClick={startBatch}
              >
                ▶ 启动
              </Button>
              <Button size="small" danger icon={<PauseCircleOutlined />} style={{ height: 40, fontSize: 13 }} onClick={stopBatch}>暂停</Button>
              <Button size="small" danger icon={<StopOutlined />} style={{ height: 40, fontSize: 13, fontWeight: 'bold' }} onClick={stopBatch}>停止</Button>
              <Button size="small" icon={<ExperimentOutlined />} style={{ background: '#ff9800', borderColor: '#e65100', color: 'white', height: 40, fontSize: 13 }} onClick={() => setRecipeModalOpen(true)}>配料</Button>
            </>
          )}
        </div>

        {/* Main Canvas */}
        <div 
          style={{ flex: 1, background: '#4a5568', borderRadius: 4, overflow: 'hidden', border: isEditMode ? '2px dashed #1890ff' : 'none' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          <svg 
            ref={svgRef}
            width="100%" 
            height="100%" 
            viewBox="0 0 900 550" 
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => { if (isEditMode) setSelectedId(null); }}
          >
            {/* Grid in edit mode */}
            {isEditMode && (
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#5a6878" strokeWidth="0.5" />
                </pattern>
              </defs>
            )}
            {isEditMode && <rect width="100%" height="100%" fill="url(#grid)" />}
            
            {/* Render all components */}
            {components.map(comp => renderComponent(comp))}
          </svg>
        </div>

        {/* Right Component Panel - Only in edit mode */}
        {isEditMode && (
          <div style={{ 
            width: 180, 
            background: '#2d3748', 
            borderRadius: 4, 
            padding: 8,
            overflowY: 'auto',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              marginBottom: 12,
              padding: '8px 0',
              borderBottom: '1px solid #4a5568'
            }}>
              <DragOutlined style={{ color: '#90cdf4' }} />
              <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: 13 }}>组件库</span>
            </div>
            
            <Collapse 
              ghost 
              defaultActiveKey={['料仓', '计量', '输送', '设备']}
              style={{ background: 'transparent' }}
            >
              {Object.entries(componentTemplates).map(([category, templates]) => (
                <Collapse.Panel 
                  key={category} 
                  header={<span style={{ color: '#a0aec0', fontSize: 12 }}>{category}</span>}
                  style={{ border: 'none' }}
                >
                  {templates.map(template => (
                    <ComponentPanelItem key={template.type} template={template} />
                  ))}
                </Collapse.Panel>
              ))}
            </Collapse>
            
            <div style={{ marginTop: 16, padding: 8, background: '#3d4852', borderRadius: 4 }}>
              <div style={{ color: '#a0aec0', fontSize: 11, marginBottom: 4 }}>
                <PlusOutlined /> 拖拽组件到画布
              </div>
              <div style={{ color: '#718096', fontSize: 10 }}>
                点击组件可选中，拖动可移动位置
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ProductionControl;
