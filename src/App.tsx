/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Factory,
  ChevronRight,
  AlertTriangle,
  Activity,
  Shield,
  Zap,
  Settings,
  Trash2,
  Camera,
  CheckCircle,
  Clock,
  User,
  PlusCircle,
  X,
  Search,
  AlertCircle,
  Eye,
  Flame,
  CornerDownRight,
  Sparkles,
  TrendingUp,
  Sliders,
  Plus,
  FileText,
  RefreshCw,
  PlayCircle,
  Compass,
  Lock,
  Unlock,
  Building,
  CheckSquare,
  Palette,
  Check,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import {
  SliceId,
  Device,
  WorkOrder,
  SecurityCamera,
  AlertLog,
  FireEquipment,
  DoorLog,
  ElectronicFence,
  ProductionOrder,
  ProcessStepId,
  EnergyPeriod,
  EnergyRankMode,
  EnergyTrendGranularity,
  EnergyAlertItem,
} from './types';

import {
  INITIAL_DEVICES,
  INITIAL_WORK_ORDERS,
  INITIAL_CAMERAS,
  INITIAL_ALERTS,
  INITIAL_FIRE_EQUIPMENT,
  INITIAL_DOOR_LOGS,
  INITIAL_FENCES,
  INITIAL_OPERATION_STAFF,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_MOLD_RECORDS,
  INITIAL_SAFETY_EVENTS,
  PRODUCTION_OVERVIEW,
  INITIAL_PROCESS_STEPS,
  INITIAL_LINE_METRICS,
  INITIAL_QUALITY_TRACES,
  INITIAL_WIP_ZONES,
  BOTTLENECK_HEATMAP,
  ENERGY_OVERVIEW,
  ENERGY_DEVICE_PROFILES,
  ENERGY_ZONE_PROFILES,
  ENERGY_ALERTS,
  ENERGY_CAPACITY_LINKS,
  ENERGY_SAVING_TIPS,
} from './data';

import { OperationsLeftPanel, OperationsRightPanel } from './components/OperationsPanels';
import { OperationsStaffDrawer } from './components/OperationsStaffDrawer';
import { SecurityLeftPanel, SecurityRightPanel } from './components/SecurityPanels';
import { ProductionLeftPanel, ProductionRightPanel } from './components/ProductionPanels';
import { EnergyLeftPanel, EnergyRightPanel } from './components/EnergyPanels';
import { QualityTraceExplorer } from './components/QualityTraceExplorer';
import { VideoWallFullscreen } from './components/VideoWallFullscreen';
import { AssistantChat, AssistantLauncher } from './components/AssistantChat';
import { resolveAssistantReply, applyAssistantAction } from './assistantEngine';
import { TwinDeviceNode } from './components/TwinDeviceNode';
import { TwinCameraNode, TwinFireNode } from './components/TwinSecurityNode';
import { TwinProductionLayer } from './components/TwinProductionLayer';
import { TwinEnergyLayer } from './components/TwinEnergyLayer';
import { getAlertLevelLabel } from './operationsUtils';
import { build3dTransform } from './securityUtils';
import { buildProduction3dTransform, filterLineMetrics, getProcessStepById } from './productionUtils';
import {
  buildEnergy3dTransform,
  getDeviceEnergyProfile,
  getZoneEnergyProfile,
} from './energyUtils';
import { feishuConfig } from './config/feishu';
import { pushFeishuAlertByLog, pushFeishuWorkOrder } from './feishu/sendMessage';
import {
  panelShell,
  panelHeader,
  panelBadge,
  panelKicker,
  panelHeading,
} from './themeStyles';

export default function App() {
  // State lists
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [cameras, setCameras] = useState<SecurityCamera[]>(INITIAL_CAMERAS);
  const [alerts, setAlerts] = useState<AlertLog[]>(INITIAL_ALERTS);
  const [fireEquipment, setFireEquipment] = useState<FireEquipment[]>(INITIAL_FIRE_EQUIPMENT);
  const [doorLogs, setDoorLogs] = useState<DoorLog[]>(INITIAL_DOOR_LOGS);
  const [fences, setFences] = useState<ElectronicFence[]>(INITIAL_FENCES);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(INITIAL_PRODUCTION_ORDERS);
  const [maintenanceRecords] = useState(INITIAL_MAINTENANCE_RECORDS);
  const [moldRecords] = useState(INITIAL_MOLD_RECORDS);
  const [safetyEvents] = useState(INITIAL_SAFETY_EVENTS);

  // Interaction State
  const [activeSlice, setActiveSlice] = useState<SliceId>('operations');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('CLJ-003');
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedSecurityAlertId, setSelectedSecurityAlertId] = useState<string | null>(null);
  const [selectedFireId, setSelectedFireId] = useState<string | null>(null);
  const [selectedOperationsStaffId, setSelectedOperationsStaffId] = useState<string | null>('ops-staff-01');
  const [isStaffDrawerOpen, setIsStaffDrawerOpen] = useState<boolean>(false);
  const [showEmergencyGuide, setShowEmergencyGuide] = useState<boolean>(false);
  const [isVideoWallFullscreen, setIsVideoWallFullscreen] = useState<boolean>(false);
  const [selectedProductionOrderId, setSelectedProductionOrderId] = useState<string>('SO-260609-18');
  const [selectedProcessStepId, setSelectedProcessStepId] = useState<ProcessStepId | null>('stranding');
  const [productionShiftFilter, setProductionShiftFilter] = useState<'day' | 'night' | 'all'>('day');
  const [productionBatchFilter, setProductionBatchFilter] = useState<string>('all');
  const [showProductionHeatmap, setShowProductionHeatmap] = useState<boolean>(false);
  const [isTraceExplorerOpen, setIsTraceExplorerOpen] = useState<boolean>(false);
  const [traceExplorerBatch, setTraceExplorerBatch] = useState<string | null>(null);
  const [traceExplorerTraceId, setTraceExplorerTraceId] = useState<string | null>(null);
  const [energyPeriod, setEnergyPeriod] = useState<EnergyPeriod>('day');
  const [energyRankMode, setEnergyRankMode] = useState<EnergyRankMode>('device');
  const [energyTrendGranularity, setEnergyTrendGranularity] = useState<EnergyTrendGranularity>('hour');
  const [energyShowOutputOverlay, setEnergyShowOutputOverlay] = useState<boolean>(true);
  const [selectedEnergyZoneId, setSelectedEnergyZoneId] = useState<string | null>('zone-extrude');
  const [searchGateQuery, setSearchGateQuery] = useState<string>('');
  
  // Dialog / Drawer States
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState<boolean>(false);
  
  // Work Order Form State
  const [woDeviceCode, setWoDeviceCode] = useState<string>('CLJ-003');
  const [woTitle, setWoTitle] = useState<string>('');
  const [woType, setWoType] = useState<'故障检修' | '预防维保' | '模具核查' | '紧急抢修'>('故障检修');
  const [woAssignee, setWoAssignee] = useState<string>('');
  const [woDesc, setWoDesc] = useState<string>('');

  // Theme and dialog UI states
  const [theme, setTheme] = useState<'cyberpunk' | 'minimalist'>('minimalist');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState<boolean>(false);
  const [sidePanelsOpen, setSidePanelsOpen] = useState<boolean>(true);
  const [feishuPushStatus, setFeishuPushStatus] = useState<Record<string, 'idle' | 'sending' | 'success' | 'error'>>({});

  // AI Assistant States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: '您好！我是“工厂智能助手”。我是您的孪生微脑智能体。根据实时数据，当前车间有数项异常挂账中。您可以提问，比如“3号成缆机有什么问题？”或者“查询5号机高耗空转待机”，我可以协助您快速调度和联动定位。',
      time: '09:39'
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAssistantTyping, setIsAssistantTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Focus effect state for machine selection/alerts animation
  const [focusAnimationPing, setFocusAnimationPing] = useState<string | null>(null);
  const [currentSystemTime, setCurrentSystemTime] = useState<string>('2026-06-09 09:39:48');

  // Multi-slice eco-saver active flag
  const [isEcoSavingsActive, setIsEcoSavingsActive] = useState<boolean>(false);

  // System status metrics computed state
  const criticalAlertCount = alerts.filter(a => a.status === 'pending' && a.level === 'P1严重').length;
  const activeAlertCount = alerts.filter(a => a.status === 'pending').length;

  // Track state telemetry fluctuations (live feeling)
  useEffect(() => {
    const timer = setInterval(() => {
      // Periodic noise on telemetry values
      setDevices(prev =>
        prev.map(d => {
          if (d.status === 'idle') return d;
          const deltaTemp = (Math.random() - 0.5) * 0.4;
          const deltaTension = (Math.random() - 0.5) * 0.3;
          const deltaSpeed = Math.random() > 0.7 ? (Math.random() - 0.5) * 2 : 0;
          return {
            ...d,
            temperature: parseFloat((d.temperature + (d.status === 'error' ? deltaTemp * 0.2 : deltaTemp)).toFixed(1)),
            tension: parseFloat((d.tension + deltaTension).toFixed(1)),
            speed: Math.max(0, Math.floor(d.speed + deltaSpeed))
          };
        })
      );
      // Keep system clock ticking
      const pad = (n: number) => n.toString().padStart(2, '0');
      const now = new Date();
      setCurrentSystemTime(`2026-06-09 ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Periodic gate access simulator (appends logs periodically to appear very live!)
  useEffect(() => {
    const names = ['何工', '李师傅', '王主管', '消防核查员李德', '外协材料派送员'];
    const roles = ['员工', '员工', '主管', '外协人员', '外协人员'] as const;
    const areas = ['拉丝一车间北闸', '二车间主通道', '危化品室前翼闸', '南一号成品中转库'];
    const avatars = ['👨‍🔧', '🧑‍🏭', '🧔', '👩‍🚒', '🚚'];

    const logTimer = setInterval(() => {
      const idx = Math.floor(Math.random() * names.length);
      const isEnter = Math.random() > 0.3 ? '进入' : '离开';
      const pad = (n: number) => n.toString().padStart(2, '0');
      const now = new Date();
      
      const newLog: DoorLog = {
        id: `log-sim-${Date.now()}`,
        name: names[idx],
        avatar: avatars[idx],
        role: roles[idx],
        action: isEnter as '进入' | '离开' | '登记',
        location: areas[Math.floor(Math.random() * areas.length)],
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
        status: 'success'
      };

      setDoorLogs(prev => [newLog, ...prev.slice(0, 9)]);
    }, 15000);

    return () => clearInterval(logTimer);
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAssistantTyping]);

  const activeDevice = devices.find(d => d.code === selectedDeviceId) || devices[0];
  const focusDevice = activeSlice === 'operations' ? activeDevice : null;
  const selectedOperationsStaff = INITIAL_OPERATION_STAFF.find(p => p.id === selectedOperationsStaffId) ?? null;
  const operationsFocus3d = activeSlice === 'operations'
    ? selectedOperationsStaff?.focus3d ?? focusDevice?.focus3d
    : undefined;

  const securityFocus3d = (() => {
    if (activeSlice !== 'security') return undefined;
    const alertFocus = selectedSecurityAlertId
      ? alerts.find(a => a.id === selectedSecurityAlertId)?.focus3d
      : undefined;
    if (alertFocus) return alertFocus;
    if (selectedCameraId) {
      return cameras.find(c => c.id === selectedCameraId)?.focus3d;
    }
    return undefined;
  })();

  const productionFocus3d = (() => {
    if (activeSlice !== 'production') return undefined;
    if (selectedProcessStepId) {
      return getProcessStepById(INITIAL_PROCESS_STEPS, selectedProcessStepId)?.focus3d;
    }
    return undefined;
  })();

  const filteredLineMetrics = filterLineMetrics(
    INITIAL_LINE_METRICS,
    productionShiftFilter,
    productionBatchFilter,
  );

  const energyFocus3d = (() => {
    if (activeSlice !== 'energy') return undefined;
    const devProfile = getDeviceEnergyProfile(selectedDeviceId);
    if (devProfile) return devProfile.focus3d;
    if (selectedEnergyZoneId) {
      return getZoneEnergyProfile(selectedEnergyZoneId)?.focus3d;
    }
    return undefined;
  })();

  const sceneTransform = activeSlice === 'operations' && operationsFocus3d
    ? `perspective(1400px) rotateX(42deg) rotateZ(-12deg) scale(${operationsFocus3d.scale * 0.9}) translate(${operationsFocus3d.offsetX}px, ${operationsFocus3d.offsetY}px)`
    : activeSlice === 'security'
      ? build3dTransform(securityFocus3d)
      : activeSlice === 'production'
        ? buildProduction3dTransform(productionFocus3d)
        : activeSlice === 'energy'
          ? buildEnergy3dTransform(energyFocus3d)
          : 'perspective(1400px) rotateX(42deg) rotateZ(-12deg) scale(0.9)';

  const handleCameraSelect = (camId: string) => {
    setSelectedCameraId(camId);
    setSelectedSecurityAlertId(null);
  };

  const handleSecurityAlertSelect = (alert: AlertLog) => {
    setSelectedSecurityAlertId(alert.id);
    if (alert.cameraId) setSelectedCameraId(alert.cameraId);
    if (alert.level.includes('P1') || alert.level.includes('P2')) {
      setShowEmergencyGuide(true);
    }
    if (alert.fenceId) {
      setFences(prev => prev.map(f => (f.id === alert.fenceId ? { ...f, intrusionAlert: true } : f)));
    }
  };

  const handleProcessStepSelect = (stepId: ProcessStepId) => {
    setSelectedProcessStepId(stepId);
    const step = getProcessStepById(INITIAL_PROCESS_STEPS, stepId);
    if (step) {
      setSelectedDeviceId(step.deviceCode);
      if (step.orderId) setSelectedProductionOrderId(step.orderId);
    }
  };

  const handleProductionOrderSelect = (orderId: string) => {
    setSelectedProductionOrderId(orderId);
    const order = productionOrders.find(o => o.id === orderId);
    if (order?.status === 'bottleneck') {
      setSelectedProcessStepId('stranding');
      setSelectedDeviceId('CLJ-003');
    }
  };

  const handleOpenTraceExplorer = (batchNo?: string, traceId?: string) => {
    setTraceExplorerBatch(batchNo ?? null);
    setTraceExplorerTraceId(traceId ?? null);
    setIsTraceExplorerOpen(true);
  };

  const handleTraceFocusDevice = (deviceCode: string, processStepId?: ProcessStepId) => {
    setActiveSlice('production');
    setSelectedDeviceId(deviceCode);
    if (processStepId) setSelectedProcessStepId(processStepId);
    setFocusAnimationPing(deviceCode);
    setTimeout(() => setFocusAnimationPing(null), 2000);
  };

  const handleEnergyDeviceSelect = (code: string) => {
    setSelectedDeviceId(code);
    const profile = getDeviceEnergyProfile(code);
    if (profile) {
      const zoneMap: Record<string, string> = {
        退火区: 'zone-anneal',
        挤出区: 'zone-extrude',
        成缆区: 'zone-cable',
        拉丝区: 'zone-draw',
        收线区: 'zone-draw',
      };
      const zoneId = zoneMap[profile.zone];
      if (zoneId) setSelectedEnergyZoneId(zoneId);
    }
    setFocusAnimationPing(code);
    setTimeout(() => setFocusAnimationPing(null), 2000);
  };

  const handleEnergyZoneSelect = (zoneId: string) => {
    setSelectedEnergyZoneId(zoneId);
    const zone = getZoneEnergyProfile(zoneId);
    if (!zone) return;
    const zoneNameMap: Record<string, string> = {
      'zone-anneal': '退火区',
      'zone-extrude': '挤出区',
      'zone-cable': '成缆区',
      'zone-draw': '拉丝区',
    };
    const zoneLabel = zoneNameMap[zoneId];
    const topDevice = [...ENERGY_DEVICE_PROFILES]
      .filter(d => d.zone === zoneLabel || (zoneId === 'zone-draw' && d.zone === '收线区'))
      .sort((a, b) => b.powerKw - a.powerKw)[0];
    if (topDevice) setSelectedDeviceId(topDevice.deviceCode);
  };

  const handleEnergyAlertSelect = (alert: EnergyAlertItem) => {
    if (alert.deviceCode) handleEnergyDeviceSelect(alert.deviceCode);
    else if (alert.zoneId) handleEnergyZoneSelect(alert.zoneId);
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `【能耗告警联动】${alert.title}。异常时段 ${alert.timeRange}，突增 ${alert.spikeKw} kW。3D 已聚焦相关区域，建议核查或启动节能策略。`,
        time: '刚刚',
      },
    ]);
  };

  const handleDeviceSelect = (code: string) => {
    setSelectedOperationsStaffId(null);
    setSelectedDeviceId(code);
    setFocusAnimationPing(code);
    setTimeout(() => {
      setFocusAnimationPing(null);
    }, 2000);
  };

  const handleOperationsStaffSelect = (staffId: string) => {
    const person = INITIAL_OPERATION_STAFF.find(p => p.id === staffId);
    setSelectedOperationsStaffId(staffId);
    if (person?.linkedDeviceCode) {
      setSelectedDeviceId(person.linkedDeviceCode);
    }
    setFocusAnimationPing(staffId);
    setTimeout(() => setFocusAnimationPing(null), 2000);
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!woTitle || !woAssignee) {
      alert('请填写完整的工单内容！');
      return;
    }

    const linkedDevice = devices.find(d => d.code === woDeviceCode);
    const assignee = woAssignee.trim();

    const newWO: WorkOrder = {
      id: `WO-${Date.now().toString().slice(-6)}`,
      deviceCode: woDeviceCode,
      deviceName: linkedDevice ? linkedDevice.name : woDeviceCode,
      title: woTitle,
      type: woType,
      priority: 'P2',
      assignee,
      status: '待派发',
      createdAt: '刚刚',
      description: woDesc || '快捷手动生成的维保工单。'
    };

    setWorkOrders(prev => [newWO, ...prev]);

    let feishuOk = false;
    if (linkedDevice) {
      try {
        await pushFeishuWorkOrder(newWO, linkedDevice, devices);
        feishuOk = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        alert(`工单已创建，但飞书推送失败：${msg}`);
      }
    }

    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: feishuOk
          ? `【系统联动说明】已为您成功下发对设备 [${linkedDevice?.name}] 的维修工单 ${newWO.id}，并已向飞书接收人「${assignee}」推送告警模板。`
          : `【系统联动说明】已为您成功下发对设备 [${linkedDevice?.name}] 的维修工单 ${newWO.id}。当前处理人：[${assignee}]。我们已经远程同步了3D位置，并标记了维保挂牌。`,
        time: '刚刚'
      }
    ]);

    setWoTitle('');
    setWoAssignee('');
    setWoDesc('');
    setIsWorkOrderModalOpen(false);
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, status: 'resolved' as const } : a))
    );
    // Add success chat report
    const alertItem = alerts.find(a => a.id === alertId);
    if (alertItem) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `【安防/运维联动成功】您确认了告警条目：「${alertItem.title}」。安全防线与系统已恢复高等级备战状态。`,
          time: '刚刚'
        }
      ]);
    }
  };

  const handlePushFeishu = async (alertItem: AlertLog) => {
    setFeishuPushStatus(prev => ({ ...prev, [alertItem.id]: 'sending' }));
    try {
      const result = await pushFeishuAlertByLog(alertItem, devices);
      if (!result.ok) {
        throw new Error(typeof result.body === 'object' && result.body && 'message' in result.body
          ? String((result.body as { message: string }).message)
          : `HTTP ${result.status}`);
      }
      setFeishuPushStatus(prev => ({ ...prev, [alertItem.id]: 'success' }));
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `【飞书推送成功】告警「${alertItem.title}」已按模板推送至 ${feishuConfig.targetName}，含设备参数、趋势图与处置建议。`,
          time: '刚刚',
        },
      ]);
    } catch (err) {
      setFeishuPushStatus(prev => ({ ...prev, [alertItem.id]: 'error' }));
      const msg = err instanceof Error ? err.message : '未知错误';
      alert(`飞书推送失败：${msg}`);
    }
  };

  const handleThemeSelect = (nextTheme: 'cyberpunk' | 'minimalist') => {
    setIsThemeDropdownOpen(false);
    if (nextTheme === theme) return;

    setTheme(nextTheme);
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `【主题已切换】已成功为您部署【${nextTheme === 'minimalist' ? '浅色简约' : '赛博朋克（科技深色系）'}】样式展示布局。2D面板与3D孪生视口已同步切换。`,
        time: '当前'
      }
    ]);
  };

  const themeOptions: { id: 'cyberpunk' | 'minimalist'; label: string; desc: string }[] = [
    { id: 'cyberpunk', label: '赛博朋克', desc: '科技深色系 · 霓虹孪生视口' },
    { id: 'minimalist', label: '浅色简约', desc: '明亮浅色系 · 清爽工控面板' },
  ];

  const fireInspect = (eqId: string) => {
    setFireEquipment(prev =>
      prev.map(eq =>
        eq.id === eqId
          ? {
              ...eq,
              status: '正常' as const,
              lastChecked: '2026-06-09'
            }
          : eq
      )
    );
    // Show feedback
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `【消防联动】消安检视完成！设备 [${fireEquipment.find(f => f.id === eqId)?.name}] 经安全员实地排查标记为 [正常]，全厂消安均值积分已向上更新。`,
        time: '刚刚'
      }
    ]);
  };

  const toggleFence = (fenceId: string) => {
    setFences(prev =>
      prev.map(f => {
        if (f.id === fenceId) {
          const nextStatus = f.status === 'active' ? 'disabled' : 'active';
          return {
            ...f,
            status: nextStatus as 'active' | 'disabled',
            intrusionAlert: nextStatus === 'active' ? f.intrusionAlert : false
          };
        }
        return f;
      })
    );
  };

  // Eco power saver script
  const triggerEcoSaving = () => {
    setIsEcoSavingsActive(true);
    // Change JSX-005 (which is idle and wasting power to low power state)
    setDevices(prev =>
      prev.map(d => {
        if (d.code === 'JSX-005') {
          return {
            ...d,
            load: 0,
            status: 'idle',
            name: '自动护套挤出机 #05 (已启用待机深度节能)',
            pressure: 0,
            temperature: 24.5
          };
        }
        return d;
      })
    );
    // Clear alarms related to energy if any
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: '【能耗大脑指令成效】🌿 深度节能策略已同步至挤压加热部。自动检测出5号挤塑机存在4h+无效怠速空转，系统已调谐其冷却负荷。今日用电预测曲线降低15kW，达成尖峰时刻能耗控本电费约 ¥450。',
        time: '刚刚'
      }
    ]);
  };

  const submitAssistantPrompt = (prompt: string) => {
    if (isAssistantTyping) return;
    setIsChatOpen(true);
    setChatMessages(prev => [...prev, { sender: 'user', text: prompt, time: '现在' }]);
    setIsAssistantTyping(true);

    setTimeout(() => {
      const reply = resolveAssistantReply(prompt, {
        activeSlice,
        doorLogs,
        pendingAlertCount: activeAlertCount,
      });
      applyAssistantAction(reply.action, {
        setActiveSlice,
        handleDeviceSelect,
        handleEnergyDeviceSelect,
        setSelectedEnergyZoneId,
        setSelectedCameraId,
        setSelectedSecurityAlertId,
        setShowEmergencyGuide,
        triggerEcoSaving,
      });
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply.text, time: '现在' }]);
      setIsAssistantTyping(false);
    }, 800);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAssistantTyping) return;
    const text = chatInput.trim();
    setChatInput('');
    submitAssistantPrompt(text);
  };

  // Filter gate logs — 已迁移至 SecurityLeftPanel

  return (
    <div className={`relative min-h-screen font-sans overflow-hidden select-none transition-all duration-300 ${
      theme === 'minimalist' 
        ? 'bg-slate-50 text-slate-800 theme-minimalist' 
        : 'bg-slate-950 text-slate-100 theme-cyberpunk'
    }`}>
      
      {/* HEADER SECTION */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-md flex items-center justify-between px-6 select-none border-b transition-colors duration-300 ${
        theme === 'minimalist'
          ? 'bg-white/90 border-slate-205 shadow-sm'
          : 'bg-slate-900/90 border-slate-800 cyber-header-bar'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${
            theme === 'minimalist'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-blue-900/40 border-blue-500/50'
          }`}>
            <Factory className={`h-5 w-5 animate-pulse ${theme === 'minimalist' ? 'text-blue-600' : 'text-blue-400'}`} />
            <h1 className={`text-base font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r ${
              theme === 'minimalist'
                ? 'from-blue-700 via-blue-600 to-slate-900'
                : 'from-blue-300 via-blue-100 to-white'
            }`}>
              电线电缆工厂智能车间
            </h1>
          </div>
          <span className={`hidden md:inline-block h-4 w-px ${theme === 'minimalist' ? 'bg-slate-200' : 'bg-slate-800'}`}></span>
          <div className={`hidden md:flex items-center gap-2 text-xs transition-colors ${
            theme === 'minimalist' ? 'text-slate-650' : 'text-slate-400'
          }`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            现场工业感知总线：<span className="text-emerald-500 font-bold">100% 互通正常</span>
          </div>
        </div>

        {/* Global Clock & Real-time Alerts Action */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidePanelsOpen(prev => !prev)}
            title={sidePanelsOpen ? '收起左右面板' : '展开左右面板'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition duration-150 select-none ${
              theme === 'minimalist'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-slate-800/60 hover:bg-slate-700/60 border-slate-700/60 text-slate-300 cyber-btn'
            }`}
          >
            {sidePanelsOpen ? (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="hidden sm:inline">收起面板</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="h-4 w-4" />
                <span className="hidden sm:inline">展开面板</span>
              </>
            )}
          </button>

          <div className={`text-xs font-mono px-3 py-1 rounded-lg border transition-all ${
            theme === 'minimalist'
              ? 'text-slate-700 bg-slate-100/80 border-slate-200'
              : 'text-slate-300 bg-slate-950/60 border-blue-500/30 cyber-btn'
          }`}>
            {currentSystemTime}
          </div>

          <button
            onClick={() => setIsAlertDrawerOpen(true)}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition duration-205 border ${
              activeAlertCount > 0
                ? theme === 'minimalist'
                  ? 'bg-red-50 border-red-200 text-red-650 hover:bg-red-105 shadow-sm'
                  : 'bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-500/20 cyber-alert-btn'
                : theme === 'minimalist'
                  ? 'bg-slate-100 border-slate-200 text-slate-705 hover:bg-slate-200/80'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cyber-btn'
            }`}
          >
            <AlertCircle className={`h-4 w-4 ${activeAlertCount > 0 ? 'animate-bounce text-red-500' : 'text-slate-450'}`} />
            统一告警中枢
            {activeAlertCount > 0 && (
              <span className="absolute -top-1.5 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white animate-pulse">
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setIsThemeDropdownOpen(!isThemeDropdownOpen);
                setIsUserDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition duration-150 select-none ${
                theme === 'minimalist'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  : 'bg-slate-800/60 hover:bg-slate-700/60 border-slate-700/60 text-slate-300'
              }`}
            >
              <Palette className={`h-4 w-4 ${theme === 'minimalist' ? 'text-violet-600' : 'text-violet-400'}`} />
              <span>{theme === 'minimalist' ? '浅色简约' : '赛博朋克'}</span>
              <span className="text-[10px] opacity-65">▼</span>
            </button>

            {isThemeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent cursor-pointer" onClick={() => setIsThemeDropdownOpen(false)} />
                <div className={`absolute right-0 mt-2 w-52 rounded-2xl border p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left ${
                  theme === 'minimalist'
                    ? 'bg-white border-slate-200 text-slate-800 shadow-slate-250/50'
                    : 'bg-slate-900 border-slate-800 text-slate-200 shadow-black/80'
                }`}>
                  <div className={`px-3 py-2 border-b border-dashed mb-1 pb-1.5 ${theme === 'minimalist' ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="text-xs font-black">界面主题</div>
                    <div className={`text-[10px] mt-0.5 ${theme === 'minimalist' ? 'text-slate-500' : 'text-slate-450'}`}>2D 面板与 3D 视口同步切换</div>
                  </div>

                  {themeOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleThemeSelect(option.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-start gap-2.5 ${
                        theme === option.id
                          ? theme === 'minimalist'
                            ? 'bg-violet-50 border border-violet-200'
                            : 'bg-violet-950/40 border border-violet-500/30'
                          : theme === 'minimalist'
                            ? 'hover:bg-slate-100 border border-transparent'
                            : 'hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        theme === option.id
                          ? theme === 'minimalist'
                            ? 'border-violet-500 bg-violet-500 text-white'
                            : 'border-violet-400 bg-violet-500 text-white'
                          : theme === 'minimalist'
                            ? 'border-slate-300'
                            : 'border-slate-600'
                      }`}>
                        {theme === option.id && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span>
                        <span className="font-bold block">{option.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${theme === 'minimalist' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {option.desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User Button with Interactive Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsThemeDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition duration-150 select-none ${
                theme === 'minimalist'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  : 'bg-slate-800/60 hover:bg-slate-700/60 border-slate-700/60 text-slate-300'
              }`}
            >
              <User className={`h-4 w-4 ${theme === 'minimalist' ? 'text-blue-600' : 'text-blue-400'}`} />
              <span>中控程主管</span>
              <span className="text-[10px] opacity-65">▼</span>
            </button>
            
            {isUserDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent cursor-pointer" onClick={() => setIsUserDropdownOpen(false)} />
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl border p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left ${
                  theme === 'minimalist'
                    ? 'bg-white border-slate-200 text-slate-800 shadow-slate-250/50'
                    : 'bg-slate-900 border-slate-800 text-slate-200 shadow-black/80'
                }`}>
                  <div className={`px-3 py-2 border-b border-dashed mb-1 pb-1.5 opacity-80 ${theme === 'minimalist' ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="text-xs font-black">工段调度长</div>
                    <div className="text-[10px] text-slate-450 mt-0.5 font-mono">ID: SEC-CHENG-09</div>
                  </div>

                  <button
                    onClick={() => {
                      alert('安全消安日志已核验完毕。');
                      setIsUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition ${
                      theme === 'minimalist' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                    }`}
                  >
                    <span>🛡️</span>
                    <span>班组核对打卡</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="relative h-screen w-full pt-14 overflow-hidden select-none">
        
        {/* Isotropic Simulated 3D Twins Canvas (The interactive visual model) */}
        <section className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-colors duration-500 ${
          theme === 'minimalist'
            ? 'bg-gradient-to-b from-slate-100 to-slate-200'
            : 'bg-gradient-to-b from-slate-900 to-slate-950'
        }`}>
          {activeSlice === 'production' && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto`}>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[9px] font-bold shadow-lg backdrop-blur-md ${
                theme === 'minimalist' ? 'bg-white/95 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />正常</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" />待机</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />堵塞</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />停机</span>
              </div>
              <button
                type="button"
                onClick={() => setShowProductionHeatmap(v => !v)}
                className={`rounded-xl border px-3 py-1.5 text-[9px] font-bold cursor-pointer transition shadow-lg backdrop-blur-md ${
                  showProductionHeatmap
                    ? 'bg-red-600 text-white border-red-500'
                    : theme === 'minimalist'
                      ? 'bg-white/95 border-slate-200 text-slate-700 hover:border-red-300'
                      : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-red-500/50'
                }`}
              >
                🔥 瓶颈热力图
              </button>
            </div>
          )}
          {activeSlice === 'energy' && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto`}>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[9px] font-bold shadow-lg backdrop-blur-md ${
                theme === 'minimalist' ? 'bg-white/95 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />高能耗</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />中能耗</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />低能耗</span>
              </div>
            </div>
          )}
          {/* Depth floor grid mesh */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{
              backgroundImage: theme === 'minimalist'
                ? 'radial-gradient(ellipse at center, rgba(148,163,184,0.3) 0%, rgba(255,255,255,0) 70%), linear-gradient(rgba(148,163,184,0.4) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(148,163,184,0.4) 1.5px, transparent 1.5px)'
                : 'radial-gradient(ellipse at center, rgba(30,58,138,0.2) 0%, rgba(15,23,42,0) 70%), linear-gradient(rgba(30,41,59,0.3) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(30,41,59,0.3) 1.5px, transparent 1.5px)',
              backgroundSize: '100% 100%, 40px 40px, 40px 40px'
            }}
          />

          {/* Isometric Transform wrapper to emulate standard Digital Twins 3D modeling */}
          <div 
            className="relative w-[1100px] h-[640px] pointer-events-auto flex items-center justify-center transition-all duration-700 ease-out"
            style={{
              transform: sceneTransform,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* The base floor boundary representing our Workshop Factory Bays */}
            <div className={`absolute w-[980px] h-[580px] border-2 rounded-[32px] flex flex-wrap p-6 pointer-events-auto overflow-hidden transition-all duration-500 ${
              theme === 'minimalist'
                ? 'border-slate-300 bg-white shadow-[0_15px_60px_rgba(100,116,139,0.15)] text-slate-800'
                : 'border-blue-500/40 bg-slate-900/60 shadow-[0_0_80px_rgba(30,58,138,0.25)] text-slate-100 cyber-3d-floor'
            }`}>
              
              {/* Outer security boundaries indicator */}
              <div className={`absolute inset-3 rounded-[24px] pointer-events-none border-dashed border ${
                theme === 'minimalist' ? 'border-slate-200' : 'border-slate-800/80'
              }`}></div>

              {/* Bay titles - Labeling actual production cells */}
              <div className={`absolute left-8 top-6 text-xs tracking-widest font-mono uppercase border px-2.5 py-1 rounded-md transition-colors ${
                theme === 'minimalist'
                  ? 'text-slate-700 bg-slate-100 border-slate-200'
                  : 'text-slate-500 bg-slate-950/70 border-slate-800/50'
              }`}>
                BAY 01 : COPPER SHAPING & DRAWING CELL (拉丝 A区)
              </div>
              <div className={`absolute left-[34%] top-6 text-xs tracking-widest font-mono uppercase border px-2.5 py-1 rounded-md transition-colors ${
                theme === 'minimalist'
                  ? 'text-slate-700 bg-slate-100 border-slate-200'
                  : 'text-slate-500 bg-slate-950/70 border-slate-800/50'
              }`}>
                BAY 02 : INTERLOCK STRANDING CELL (成缆绞合 B区)
              </div>
              <div className={`absolute right-8 top-6 text-xs tracking-widest font-mono uppercase border px-2.5 py-1 rounded-md transition-colors ${
                theme === 'minimalist'
                  ? 'text-slate-700 bg-slate-100 border-slate-200'
                  : 'text-slate-500 bg-slate-950/70 border-slate-800/50'
              }`}>
                BAY 03 : HIGH THERMO EXTRUSION CORE (挤塑及绝缘区)
              </div>

              {/* Laser Hazard Zone (Chemical Warehouse Fences Visualizer) */}
              {activeSlice === 'security' && fences.map(fence => (
                fence.status === 'active' && (
                  <div
                    key={fence.id}
                    className={`absolute rounded-xl transition-all duration-300 pointer-events-none flex items-center justify-center border-2 border-dashed ${
                      fence.intrusionAlert
                        ? theme === 'minimalist'
                          ? 'bg-red-100/50 border-red-500 animate-pulse shadow-[0_0_24px_rgba(239,68,68,0.15)]'
                          : 'bg-red-950/20 border-red-500 animate-pulse shadow-[0_0_24px_rgba(239,68,68,0.2)]'
                        : theme === 'minimalist'
                          ? 'bg-amber-100/30 border-amber-400/50'
                          : 'bg-amber-950/10 border-amber-500/40'
                    }`}
                    style={{
                      left: fence.pos3d.left,
                      bottom: fence.pos3d.bottom,
                      width: fence.pos3d.width,
                      height: fence.pos3d.height,
                      transform: 'translateZ(10px)',
                    }}
                  >
                    <div className={`text-[10px] tracking-wide px-2 py-0.5 rounded border select-none flex items-center gap-1 ${
                      theme === 'minimalist'
                        ? 'bg-white/95 text-slate-800 border-amber-400/50 shadow'
                        : 'bg-black/80 text-white/95 border-red-500/50'
                    }`}>
                      <Shield className={`h-3 w-3 ${fence.intrusionAlert ? 'text-red-500 animate-bounce' : 'text-amber-500 animate-pulse'}`} />
                      {fence.intrusionAlert ? '越线入侵' : fence.fenceType} · {fence.name}
                    </div>
                  </div>
                )
              ))}

              {activeSlice === 'security' && cameras.map(cam => (
                <React.Fragment key={cam.id}>
                  <TwinCameraNode
                    camera={cam}
                    theme={theme}
                    selected={selectedCameraId === cam.id}
                    alertLinked={alerts.some(a => a.cameraId === cam.id && a.status === 'pending')}
                    onSelect={handleCameraSelect}
                  />
                </React.Fragment>
              ))}

              {activeSlice === 'security' && fireEquipment.map(eq => (
                <React.Fragment key={eq.id}>
                  <TwinFireNode
                    equipment={eq}
                    theme={theme}
                    selected={selectedFireId === eq.id}
                    onSelect={setSelectedFireId}
                  />
                </React.Fragment>
              ))}

              {/* 3D Wire Path flow indicator — 非生产切面 */}
              {activeSlice !== 'production' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                <path 
                  d="M 120,290 L 320,290 L 480,290 L 680,310 L 880,310" 
                  stroke={theme === 'minimalist' ? '#60a5fa' : '#3b82f6'} 
                  strokeWidth="4" 
                  fill="none" 
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.5))'
                  }}
                />
              </svg>
              )}

              {activeSlice === 'production' && (
                <TwinProductionLayer
                  theme={theme}
                  processSteps={INITIAL_PROCESS_STEPS}
                  wipZones={INITIAL_WIP_ZONES}
                  heatmapCells={BOTTLENECK_HEATMAP}
                  selectedProcessStepId={selectedProcessStepId}
                  showHeatmap={showProductionHeatmap}
                  onSelectProcessStep={handleProcessStepSelect}
                />
              )}

              {activeSlice === 'energy' && (
                <TwinEnergyLayer
                  theme={theme}
                  zones={ENERGY_ZONE_PROFILES}
                  deviceProfiles={ENERGY_DEVICE_PROFILES}
                  selectedZoneId={selectedEnergyZoneId}
                  selectedDeviceCode={selectedDeviceId}
                  onSelectZone={handleEnergyZoneSelect}
                />
              )}

              {/* Operations fault density heatmap (P1) */}
              {activeSlice === 'operations' && (
                <>
                  <div className="absolute left-[60px] top-[200px] w-40 h-40 bg-red-500/15 rounded-full blur-[40px] pointer-events-none" />
                  <div className="absolute left-[38%] top-[170px] w-56 h-56 bg-red-500/30 rounded-full blur-[50px] pointer-events-none" />
                  <div className="absolute right-[18%] top-[130px] w-44 h-44 bg-amber-500/15 rounded-full blur-[35px] pointer-events-none" />
                  <div className={`absolute left-[38%] top-[150px] text-[9px] px-2 py-0.5 rounded border pointer-events-none ${
                    theme === 'minimalist' ? 'bg-white/90 border-red-200 text-red-600' : 'bg-red-950/80 border-red-500/40 text-red-300'
                  }`}>
                    🔥 运维热力：成缆区故障高发
                  </div>
                </>
              )}

              {activeSlice === 'operations' && INITIAL_OPERATION_STAFF.map(person => {
                const selected = selectedOperationsStaffId === person.id;
                const statusClass = person.status === '抢修中'
                  ? 'bg-red-500 border-red-300'
                  : person.status === '巡检中'
                    ? 'bg-amber-500 border-amber-300'
                    : person.status === '在线'
                      ? 'bg-emerald-500 border-emerald-300'
                      : 'bg-slate-400 border-slate-300';
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleOperationsStaffSelect(person.id)}
                    className={`absolute z-30 flex flex-col items-center gap-1 transition duration-300 cursor-pointer ${
                      selected ? 'scale-110' : 'hover:scale-105'
                    }`}
                    style={{
                      left: person.pos3d.left,
                      top: person.pos3d.top,
                      transform: `translateZ(${person.pos3d.z ?? 24}px)`,
                    }}
                    title={`${person.name} · ${person.currentLocation}`}
                  >
                    <span className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-white shadow-lg ${statusClass} ${
                      selected || focusAnimationPing === person.id ? 'animate-pulse ring-4 ring-indigo-400/35' : ''
                    }`}>
                      <User className="h-4 w-4" />
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white border border-slate-200" />
                    </span>
                    <span className={`whitespace-nowrap rounded-lg border px-2 py-0.5 text-[8px] font-bold shadow-sm ${
                      theme === 'minimalist'
                        ? selected ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white/95 border-slate-200 text-slate-700'
                        : selected ? 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200' : 'bg-slate-900/90 border-slate-700 text-slate-300'
                    }`}>
                      {person.name} · {person.status}
                    </span>
                    {selected && (
                      <span className={`w-44 rounded-xl border px-2 py-1 text-[8px] leading-snug shadow-lg ${
                        theme === 'minimalist' ? 'bg-white/95 border-indigo-200 text-slate-700' : 'bg-slate-950/90 border-indigo-500/40 text-slate-200'
                      }`}>
                        <b>已导航到人员位置</b><br />
                        {person.role} · 工龄 {person.workYears} 年<br />
                        {person.currentLocation}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* 3D Twin device nodes — status coloring & hover telemetry */}
              {devices.map(dev => (
                <TwinDeviceNode
                  key={dev.id}
                  device={dev}
                  theme={theme}
                  selected={selectedDeviceId === dev.code}
                  hovered={hoveredDeviceId === dev.code}
                  operationsMode={activeSlice === 'operations'}
                  productionMode={activeSlice === 'production'}
                  energyMode={activeSlice === 'energy'}
                  energyProfile={getDeviceEnergyProfile(dev.code)}
                  isEcoSavingsActive={dev.code === 'JSX-005' ? isEcoSavingsActive : undefined}
                  onSelect={(code) => activeSlice === 'energy' ? handleEnergyDeviceSelect(code) : handleDeviceSelect(code)}
                  onHover={setHoveredDeviceId}
                />
              ))}

              {activeSlice === 'operations' && selectedDeviceId === 'CLJ-003' && (
                <div className={`absolute left-[44%] top-[320px] z-30 w-48 p-2 rounded-xl border text-[9px] pointer-events-none ${
                  theme === 'minimalist' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-red-950/90 border-red-500/50 text-red-200'
                }`}>
                  <div className="font-bold animate-pulse">⚠ 紧急故障 · 超温 215.3°C</div>
                  <div className="opacity-80 mt-0.5">限值 200°C · 智能体已推送飞书/微信</div>
                </div>
              )}

              {/* Security Camera Field of View indicators */}
              {activeSlice === 'security' && (
                <>
                  {/* Camera 1 POV cone */}
                  <div className="absolute left-[90px] top-[140px] w-64 h-32 origin-top-left flex justify-center items-center pointer-events-none select-none"
                    style={{
                      transform: 'rotate(28deg)',
                      background: 'radial-gradient(circle at top left, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0) 70%)'
                    }}
                  />
                  {/* Camera 2 POV cone */}
                  <div className="absolute left-[240px] bottom-[160px] w-60 h-40 origin-bottom-left flex justify-center items-center pointer-events-none select-none"
                    style={{
                      transform: 'rotate(-45deg)',
                      background: 'radial-gradient(circle at bottom left, rgba(239, 68, 68, 0.22) 0%, rgba(239, 68, 68, 0) 75%)'
                    }}
                  />
                  {/* Camera 3 POV cone */}
                  <div className="absolute left-[540px] top-[180px] w-72 h-44 origin-top-right flex justify-center items-center pointer-events-none select-none"
                    style={{
                      transform: 'rotate(40deg)',
                      background: 'radial-gradient(circle at top right, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 80%)'
                    }}
                  />
                </>
              )}

              {/* 3D POI pins — 非运维/非安防模式 */}
              {activeSlice !== 'operations' && activeSlice !== 'security' && (
              <>
              <button 
                className="absolute left-[160px] top-[280px] z-30 flex flex-col items-center gap-1 group pointer-events-auto"
                onClick={() => handleDeviceSelect('LSJ-001')}
                style={{ transform: 'translateZ(40px)' }}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-xl border shadow-lg animate-bounce hover:scale-110 transition ${
                  theme === 'minimalist'
                    ? 'border-slate-300 bg-white text-slate-800'
                    : 'border-white/50 bg-slate-900/95 text-white'
                }`}>
                  ⛓️
                </div>
                <div className={`opacity-0 group-hover:opacity-100 transition duration-200 absolute -bottom-8 text-[10px] px-2 py-0.5 rounded whitespace-nowrap ${
                  theme === 'minimalist'
                    ? 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                    : 'bg-slate-900 border border-slate-700 text-white'
                }`}>
                  1号拉丝机 A区
                </div>
              </button>

              {/* Pin 2: Strander #3 */}
              <button 
                className="absolute left-[490px] top-[170px] z-30 flex flex-col items-center gap-1 group pointer-events-auto"
                onClick={() => handleDeviceSelect('CLJ-003')}
                style={{ transform: 'translateZ(60px)' }}
              >
                <div className="relative">
                  <span className="absolute -inset-2 rounded-full border border-red-500 animate-ping"></span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-650 text-white shadow-xl hover:scale-110 transition border-2 border-red-300">
                    🔴
                  </div>
                </div>
                <div className="bg-red-950/95 border border-red-500 text-[10px] px-2 py-0.5 rounded text-red-200 font-extrabold whitespace-nowrap mt-1">
                  异常点: 成缆温控超限!
                </div>
              </button>
              </>
              )}
            </div>
          </div>
        </section>


        {/* 2D PANEL LEFT: QUERY, AUDITING, LEDGER */}
        <aside className={`absolute top-14 bottom-0 left-0 z-30 w-[340px] overflow-hidden flex flex-col backdrop-blur-md transition-transform duration-300 ease-in-out ${panelShell(theme, 'left')} ${sidePanelsOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}>
          <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${panelHeader(theme)}`}>
            <div>
              <span className={`text-[10px] font-black tracking-widest uppercase ${panelKicker(theme)}`}>2D READ-OUT</span>
              <h2 className={`text-base font-extrabold ${panelHeading(theme)}`}>
                {activeSlice === 'operations' && '运维总览 · 台账 · 告警'}
                {activeSlice === 'security' && '安防总览 · 视频 · 告警 · 门禁'}
                {activeSlice === 'production' && '生产总览 · 工单 · 工序流程'}
                {activeSlice === 'energy' && '能耗总览 · 排行 · 趋势'}
              </h2>
            </div>
            <div className={`p-2 rounded-xl border ${panelBadge(theme)}`}>
              {activeSlice === 'operations' && <Sliders className="h-5 w-5" />}
              {activeSlice === 'security' && <Shield className="h-5 w-5" />}
              {activeSlice === 'production' && <Building className="h-5 w-5" />}
              {activeSlice === 'energy' && <Zap className="h-5 w-5" />}
            </div>
          </div>

          <div data-panel-scroll className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 flex flex-col gap-3 min-h-0">
          {/* DYNAMIC LEFT PANEL BASED ON SLICE VALUE (WITH OPERATIONS & SECURITY COMPLETED PRISTINELY) */}
          
          {activeSlice === 'operations' && (
            <OperationsLeftPanel
              theme={theme}
              devices={devices}
              alerts={alerts}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={handleDeviceSelect}
              onSelectAlert={(_id, deviceCode) => {
                if (deviceCode) handleDeviceSelect(deviceCode);
                setIsAlertDrawerOpen(true);
              }}
            />
          )}

          {activeSlice === 'security' && (
            <SecurityLeftPanel
              theme={theme}
              cameras={cameras}
              alerts={alerts}
              doorLogs={doorLogs}
              selectedCameraId={selectedCameraId}
              selectedSecurityAlertId={selectedSecurityAlertId}
              searchGateQuery={searchGateQuery}
              onSearchGateChange={setSearchGateQuery}
              onSelectCamera={handleCameraSelect}
              onSelectSecurityAlert={handleSecurityAlertSelect}
              onOpenVideoWall={() => setIsVideoWallFullscreen(true)}
            />
          )}

          {activeSlice === 'production' && (
            <ProductionLeftPanel
              theme={theme}
              overview={PRODUCTION_OVERVIEW}
              orders={productionOrders}
              processSteps={INITIAL_PROCESS_STEPS}
              selectedOrderId={selectedProductionOrderId}
              selectedProcessStepId={selectedProcessStepId}
              onSelectOrder={handleProductionOrderSelect}
              onSelectProcessStep={handleProcessStepSelect}
            />
          )}

          {activeSlice === 'energy' && (
            <EnergyLeftPanel
              theme={theme}
              overview={ENERGY_OVERVIEW[energyPeriod]}
              energyPeriod={energyPeriod}
              rankMode={energyRankMode}
              trendGranularity={energyTrendGranularity}
              showOutputOverlay={energyShowOutputOverlay}
              selectedDeviceCode={selectedDeviceId}
              selectedZoneId={selectedEnergyZoneId}
              onPeriodChange={setEnergyPeriod}
              onRankModeChange={setEnergyRankMode}
              onTrendGranularityChange={setEnergyTrendGranularity}
              onToggleOutputOverlay={() => setEnergyShowOutputOverlay(v => !v)}
              onSelectDevice={handleEnergyDeviceSelect}
              onSelectZone={handleEnergyZoneSelect}
            />
          )}

          </div>
        </aside>

        {/* 2D PANEL RIGHT: DISPATCH, ACTIONS, COMMAND CONTROL */}
        <aside className={`absolute top-14 bottom-0 right-0 z-30 w-[340px] overflow-hidden flex flex-col backdrop-blur-md transition-transform duration-300 ease-in-out ${panelShell(theme, 'right')} ${sidePanelsOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
          <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${panelHeader(theme)}`}>
            <div>
              <span className={`text-[10px] font-black tracking-widest uppercase ${panelKicker(theme)}`}>ACT / TELEMETRY</span>
              <h2 className={`text-base font-extrabold ${panelHeading(theme)}`}>
                {activeSlice === 'operations' && '实时参数 · 工单 · 追溯'}
                {activeSlice === 'security' && '实时画面 · 围栏 · 消防 · 事件'}
                {activeSlice === 'production' && '产线数据 · 追溯 · 效率分析'}
                {activeSlice === 'energy' && '告警 · 联动 · 节能'}
              </h2>
            </div>
            <div className={`p-2 rounded-xl border ${panelBadge(theme)}`}>
              <Sliders className="h-5 w-5 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
          </div>

          <div data-panel-scroll className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 flex flex-col gap-3 min-h-0">
          {/* DYNAMIC RIGHT PANEL BASED ON CHOSEN SLICE (PRISTINE WORK ORDER & CAMERA MODES) */}
          
          {/* OPERATIONS RIGHT SLICE */}
          {activeSlice === 'operations' && (
            <OperationsRightPanel
              theme={theme}
              devices={devices}
              activeDevice={activeDevice}
              workOrders={workOrders}
              maintenanceRecords={maintenanceRecords}
              moldRecords={moldRecords}
              onCreateWorkOrder={() => {
                setWoDeviceCode(activeDevice.code);
                setWoTitle(`[急报] 紧急检修设备 ${activeDevice.name}`);
                setIsWorkOrderModalOpen(true);
              }}
              onDispatchWorkOrder={(id) => {
                setWorkOrders(prev => prev.map(w => (w.id === id ? { ...w, status: '处理中' as const } : w)));
                setChatMessages(p => [...p, { sender: 'ai', text: `【工单推进】张工已经签收工单 ${id}，带工具包赶赴现场。`, time: '当前' }]);
              }}
              onCompleteWorkOrder={(id, deviceCode) => {
                setWorkOrders(prev => prev.map(w => (w.id === id ? { ...w, status: '已完成' as const } : w)));
                setDevices(prev => prev.map(d => d.code === deviceCode ? { ...d, status: 'success', temperature: 185.2, health: 91 } : d));
                setChatMessages(p => [...p, { sender: 'ai', text: `【结案】工单 ${id} 验收完成，设备已恢复运行。`, time: '当前' }]);
              }}
              onAskAI={submitAssistantPrompt}
            />
          )}

          {activeSlice === 'security' && (
            <SecurityRightPanel
              theme={theme}
              cameras={cameras}
              fences={fences}
              fireEquipment={fireEquipment}
              safetyEvents={safetyEvents}
              selectedCameraId={selectedCameraId}
              selectedFireId={selectedFireId}
              showEmergencyGuide={showEmergencyGuide}
              onToggleFence={toggleFence}
              onFireInspect={fireInspect}
              onSelectFire={setSelectedFireId}
              onClearEmergency={() => setShowEmergencyGuide(false)}
              onAskAI={submitAssistantPrompt}
            />
          )}

          {activeSlice === 'production' && (
            <ProductionRightPanel
              theme={theme}
              lineMetrics={filteredLineMetrics}
              qualityTraces={INITIAL_QUALITY_TRACES}
              selectedOrderId={selectedProductionOrderId}
              shiftFilter={productionShiftFilter}
              batchFilter={productionBatchFilter}
              orders={productionOrders}
              onShiftChange={setProductionShiftFilter}
              onBatchChange={setProductionBatchFilter}
              onOpenTraceExplorer={handleOpenTraceExplorer}
              onAskAI={submitAssistantPrompt}
            />
          )}

          {activeSlice === 'energy' && (
            <EnergyRightPanel
              theme={theme}
              alerts={ENERGY_ALERTS}
              capacityLinks={ENERGY_CAPACITY_LINKS}
              savingTips={ENERGY_SAVING_TIPS}
              isEcoSavingsActive={isEcoSavingsActive}
              selectedDeviceCode={selectedDeviceId}
              onSelectDevice={handleEnergyDeviceSelect}
              onSelectAlert={handleEnergyAlertSelect}
              onTriggerEcoSaving={triggerEcoSaving}
              onAskAI={submitAssistantPrompt}
            />
          )}

          </div>
        </aside>

        {/* BOTTOM NAVIGATOR SLICE BUTTONS */}
        <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-6 py-2.5 rounded-[28px] shadow-2xl backdrop-blur-md flex gap-4 select-none border transition-colors duration-300 ${
          theme === 'minimalist'
            ? 'bg-white/95 border-slate-200 shadow-slate-200/50'
            : 'bg-slate-900/90 border-blue-500/35 cyber-bottom-nav'
        }`}>
          <button
            onClick={() => {
              setActiveSlice('operations');
              setSelectedDeviceId('CLJ-003');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition select-none ${
              activeSlice === 'operations'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : theme === 'minimalist'
                  ? 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            运维切面
          </button>
          
          <button
            onClick={() => {
              setActiveSlice('security');
              setSelectedCameraId('cam-02');
              setSelectedSecurityAlertId('AL-1002');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition select-none ${
              activeSlice === 'security'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                : theme === 'minimalist'
                  ? 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="h-4 w-4" />
            安防切面
          </button>

          <button
            onClick={() => {
              setActiveSlice('production');
              setSelectedProcessStepId('stranding');
              setSelectedDeviceId('CLJ-003');
              setSelectedProductionOrderId('SO-260609-18');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition select-none ${
              activeSlice === 'production'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : theme === 'minimalist'
                  ? 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="h-4 w-4" />
            工序制程
          </button>

          <button
            onClick={() => {
              setActiveSlice('energy');
              setSelectedDeviceId('JSX-005');
              setSelectedEnergyZoneId('zone-extrude');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition select-none ${
              activeSlice === 'energy'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                : theme === 'minimalist'
                  ? 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="h-4 w-4" />
            节能能耗
          </button>
        </nav>

        {/* FLOATING CHAT INTELLIGENT BOT ASSISTANT */}
        {activeSlice === 'operations' && (
          <OperationsStaffDrawer
            theme={theme}
            sidePanelsOpen={sidePanelsOpen}
            staff={INITIAL_OPERATION_STAFF}
            selectedStaffId={selectedOperationsStaffId}
            isOpen={isStaffDrawerOpen}
            onToggleOpen={() => setIsStaffDrawerOpen(prev => !prev)}
            onSelectStaff={handleOperationsStaffSelect}
          />
        )}

        {!isChatOpen ? (
          <AssistantLauncher
            theme={theme}
            sidePanelsOpen={sidePanelsOpen}
            onOpen={() => setIsChatOpen(true)}
          />
        ) : (
          <AssistantChat
            theme={theme}
            sidePanelsOpen={sidePanelsOpen}
            activeSlice={activeSlice}
            messages={chatMessages}
            chatInput={chatInput}
            isTyping={isAssistantTyping}
            chatEndRef={chatEndRef}
            onClose={() => setIsChatOpen(false)}
            onInputChange={setChatInput}
            onSubmit={handleSendChat}
            onPromptSelect={submitAssistantPrompt}
          />
        )}

      </main>

      {/* DETAILED WORK ORDER CREATOR FRAME (THE DIAOG BOX MODAL) */}
      {isWorkOrderModalOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm select-none ${
          theme === 'minimalist' ? 'bg-slate-900/30' : 'bg-slate-950/80'
        }`}>
          <div className={`w-[450px] rounded-3xl border p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-left ${
            theme === 'minimalist' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-blue-500/35 text-slate-100 cyber-modal'
          }`}>
            <div className={`flex items-start justify-between border-b pb-3 mb-4 ${
              theme === 'minimalist' ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div>
                <span className={`text-[10px] font-black tracking-widest ${theme === 'minimalist' ? 'text-blue-600' : 'text-blue-500'}`}>WORK ORDER</span>
                <h2 className={`text-base font-black ${theme === 'minimalist' ? 'text-slate-900' : 'text-white'}`}>下发线缆车间设备抢修工单(2D-3D联动)</h2>
              </div>
              <button
                onClick={() => setIsWorkOrderModalOpen(false)}
                className={`rounded-xl p-1.5 transition ${
                  theme === 'minimalist'
                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="flex flex-col gap-3.5 text-xs">
              
              <div>
                <label className={`block font-bold mb-1 ${theme === 'minimalist' ? 'text-slate-600' : 'text-slate-400'}`}>故障联结设备</label>
                <select
                  value={woDeviceCode}
                  onChange={(e) => setWoDeviceCode(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none focus:border-blue-500 ${
                    theme === 'minimalist' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-850 text-white'
                  }`}
                >
                  {devices.map(dev => (
                    <option key={dev.id} value={dev.code}>
                      [{dev.code}] {dev.name} ({dev.area.split(' ')[1]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${theme === 'minimalist' ? 'text-slate-600' : 'text-slate-400'}`}>工单类型</label>
                <select
                  value={woType}
                  onChange={(e) => setWoType(e.target.value as typeof woType)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none focus:border-blue-500 ${
                    theme === 'minimalist' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-850 text-white'
                  }`}
                >
                  <option value="故障检修">故障现场检修</option>
                  <option value="预防维保">预防性定期维保</option>
                  <option value="模具核查">高精模具磨损核对</option>
                  <option value="紧急抢修">重大安全应急抢修</option>
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${theme === 'minimalist' ? 'text-slate-600' : 'text-slate-400'}`}>工单纲领主题 / 主题</label>
                <input
                  type="text"
                  value={woTitle}
                  onChange={(e) => setWoTitle(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none focus:border-blue-500 ${
                    theme === 'minimalist' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-850 text-white'
                  }`}
                  placeholder="请输入抢修标题，如: 轴承过温故障"
                  required
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${theme === 'minimalist' ? 'text-slate-600' : 'text-slate-400'}`}>
                  担当人 / 接手人
                  <span className={`font-normal ml-1 ${theme === 'minimalist' ? 'text-slate-400' : 'text-slate-500'}`}>（飞书推送接收人 target_name）</span>
                </label>
                <input
                  type="text"
                  value={woAssignee}
                  onChange={(e) => setWoAssignee(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none focus:border-blue-500 ${
                    theme === 'minimalist' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-850 text-white'
                  }`}
                  placeholder="填写飞书接收人姓名，如: 靳春野"
                  required
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${theme === 'minimalist' ? 'text-slate-600' : 'text-slate-400'}`}>故障及环境详细说明 (3D孪生标注提示) </label>
                <textarea
                  value={woDesc}
                  onChange={(e) => setWoDesc(e.target.value)}
                  rows={2}
                  className={`w-full rounded-xl border px-3 py-2 outline-none focus:border-blue-500 resize-none ${
                    theme === 'minimalist'
                      ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-850 text-white placeholder-slate-650'
                  }`}
                  placeholder="请详细描述工艺故障现场。提交后将向担当人飞书推送告警模板…"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsWorkOrderModalOpen(false)}
                  className={`rounded-xl font-bold px-4 py-2 transition duration-150 ${
                    theme === 'minimalist'
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 text-white font-bold px-5 py-2 hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition duration-150 active:scale-95"
                >
                  确定下发工单 (并推送飞书)
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* UNIFIED ALARM CENTER DRAWER MODAL */}
      {isAlertDrawerOpen && (
        <div className={`fixed inset-0 z-[100] backdrop-blur-sm flex justify-end select-none ${
          theme === 'minimalist' ? 'bg-slate-900/20' : 'bg-slate-950/60'
        }`}>
          <div className={`w-[440px] h-full border-l p-6 shadow-2xl animate-in slide-in-from-right duration-200 text-left flex flex-col justify-between ${
            theme === 'minimalist' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-blue-500/35 text-slate-100 cyber-drawer'
          }`}>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className={`flex items-start justify-between border-b pb-3 mb-4 ${
                theme === 'minimalist' ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">Unified Incident Center</span>
                  <h2 className={`text-base font-black ${theme === 'minimalist' ? 'text-slate-900' : 'text-white'}`}>线缆工厂统一现场告警中枢</h2>
                </div>
                <button
                  onClick={() => setIsAlertDrawerOpen(false)}
                  className={`rounded-xl p-1.5 transition ${
                    theme === 'minimalist'
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                      : 'bg-slate-805 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
                {alerts.map((alertItem) => {
                  const isPending = alertItem.status === 'pending';
                  return (
                    <div
                      key={alertItem.id}
                      className={`p-3.5 rounded-2xl border text-xs flex flex-col gap-2 transition ${
                        isPending
                          ? alertItem.level.includes('P1')
                            ? theme === 'minimalist' ? 'bg-red-50 border-red-300' : 'bg-red-950/10 border-red-500/40'
                            : theme === 'minimalist' ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/10 border-amber-500/40'
                          : theme === 'minimalist' ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-slate-950/40 border-slate-850 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-black text-xs px-2 py-0.2 rounded ${
                          alertItem.level.includes('P1')
                            ? theme === 'minimalist' ? 'bg-red-100 text-red-600' : 'bg-red-900/30 text-red-400'
                            : theme === 'minimalist' ? 'bg-amber-100 text-amber-700' : 'bg-amber-950 text-amber-500'
                        }`}>
                          {getAlertLevelLabel(alertItem.level)}
                        </span>
                        <div className={`text-[10px] font-mono ${theme === 'minimalist' ? 'text-slate-500' : 'text-slate-500'}`}>
                          {alertItem.time}
                        </div>
                      </div>

                      <div className="text-left">
                        <h4 className={`font-extrabold text-xs ${theme === 'minimalist' ? 'text-slate-900' : 'text-white'}`}>{alertItem.title}</h4>
                        <p className={`text-[10px] leading-relaxed mt-1 ${theme === 'minimalist' ? 'text-slate-600' : 'text-slate-400'}`}>{alertItem.description}</p>
                        <div className={`text-[9px] mt-1 flex justify-between items-center ${theme === 'minimalist' ? 'text-slate-500' : 'text-slate-500'}`}>
                          <span>位置: {alertItem.location}</span>
                          <span className={theme === 'minimalist' ? 'text-blue-600' : 'text-blue-400'}>微脑已派发联动</span>
                        </div>
                      </div>

                      {isPending && (
                        <div className={`flex gap-2 justify-end border-t pt-2 mt-1.5 flex-wrap ${
                          theme === 'minimalist' ? 'border-slate-200' : 'border-slate-800/60'
                        }`}>
                          <button
                            type="button"
                            onClick={() => handlePushFeishu(alertItem)}
                            disabled={feishuPushStatus[alertItem.id] === 'sending'}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition disabled:opacity-60 ${
                              feishuPushStatus[alertItem.id] === 'success'
                                ? 'bg-emerald-600 text-white'
                                : feishuPushStatus[alertItem.id] === 'error'
                                  ? 'bg-red-600 text-white'
                                  : theme === 'minimalist'
                                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                    : 'bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-700/50'
                            }`}
                          >
                            {feishuPushStatus[alertItem.id] === 'sending'
                              ? '推送中…'
                              : feishuPushStatus[alertItem.id] === 'success'
                                ? '已推飞书'
                                : feishuPushStatus[alertItem.id] === 'error'
                                  ? '重推飞书'
                                  : '推送飞书'}
                          </button>
                          {alertItem.category === 'operations' && (
                            <button
                              onClick={() => {
                                handleDeviceSelect('CLJ-003');
                                setIsAlertDrawerOpen(false);
                                setWoDeviceCode('CLJ-003');
                                setWoTitle('[急修] 3号成缆机超温');
                                setIsWorkOrderModalOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1 rounded text-[10px]"
                            >
                              一键建维修单
                            </button>
                          )}
                          <button
                            onClick={() => handleResolveAlert(alertItem.id)}
                            className={`px-2 py-1 rounded text-[10px] transition ${
                              theme === 'minimalist'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            双核确消
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`border-t pt-4 mt-4 text-[10px] flex justify-between items-center ${
              theme === 'minimalist' ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-500'
            }`}>
              <span>故障报警总控数: {alerts.length}条</span>
              <span>健康恢复度：正常</span>
            </div>

          </div>
        </div>
      )}

      {isVideoWallFullscreen && (
        <VideoWallFullscreen
          theme={theme}
          cameras={cameras}
          alerts={alerts}
          fences={fences}
          selectedCameraId={selectedCameraId}
          selectedSecurityAlertId={selectedSecurityAlertId}
          onClose={() => setIsVideoWallFullscreen(false)}
          onSelectCamera={handleCameraSelect}
          onSelectSecurityAlert={handleSecurityAlertSelect}
          onResolveAlert={handleResolveAlert}
        />
      )}

      {isTraceExplorerOpen && (
        <QualityTraceExplorer
          theme={theme}
          traces={INITIAL_QUALITY_TRACES}
          orders={productionOrders}
          initialBatchNo={traceExplorerBatch}
          initialTraceId={traceExplorerTraceId}
          currentOrderId={selectedProductionOrderId}
          onClose={() => setIsTraceExplorerOpen(false)}
          onFocusDevice={handleTraceFocusDevice}
          onAskAI={q => {
            setIsTraceExplorerOpen(false);
            submitAssistantPrompt(q);
          }}
        />
      )}

    </div>
  );
}
