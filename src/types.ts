/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SliceId = 'operations' | 'production' | 'energy' | 'security';

export type DeviceProcess = '拉丝' | '绞线' | '收放线' | '挤塑' | '成缆';

export interface DeviceThresholds {
  temperatureMax: number;
  tensionMin: number;
  tensionMax: number;
  speedMax: number;
  pressureMax: number;
  loadMax: number;
}

export interface Device {
  id: string;
  name: string;
  code: string;
  area: string;
  type: string;
  process: DeviceProcess;
  temperature: number; // °C
  tension: number; // N
  speed: number; // rpm
  pressure: number; // MPa
  load: number; // %
  frequency: number; // Hz 运行频率
  health: number; // 0-100
  status: 'success' | 'warning' | 'error' | 'idle' | 'bottleneck';
  model: string;
  lastMaintenance: string;
  cycleDays: number;
  moldCode?: string;
  moldWear?: number; // %
  faultCountWeek: number;
  runHours: number;
  thresholds: DeviceThresholds;
  focus3d: { offsetX: number; offsetY: number; scale: number };
}

export interface OperationStaff {
  id: string;
  name: string;
  role: string;
  status: '在线' | '巡检中' | '抢修中' | '离线';
  workYears: number;
  currentLocation: string;
  shift: '白班' | '夜班';
  phone: string;
  linkedDeviceCode?: string;
  pos3d: Pos3d;
  focus3d: { offsetX: number; offsetY: number; scale: number };
}

export interface WorkOrder {
  id: string;
  deviceCode: string;
  deviceName: string;
  title: string;
  type: '故障检修' | '预防维保' | '模具核查' | '紧急抢修';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  assignee: string;
  status: '待派发' | '处理中' | '已完成';
  createdAt: string;
  description: string;
}

export type CameraZone = '车间' | '大门' | '危化区' | '成缆区';

export interface Pos3d {
  left: number;
  top: number;
  z?: number;
}

export interface SecurityCamera {
  id: string;
  name: string;
  code: string;
  area: string;
  zone: CameraZone;
  status: 'online' | 'offline';
  streamUrl: string;
  heading: number;
  activeDetections: string[];
  pos3d: Pos3d;
  focus3d: { offsetX: number; offsetY: number; scale: number };
}

export interface AlertLog {
  id: string;
  level: 'P1严重' | 'P2高危' | 'P3一般' | 'P4提示';
  category: 'operations' | 'security' | 'production' | 'energy';
  title: string;
  description: string;
  location: string;
  time: string;
  status: 'pending' | 'resolved';
  deviceCode?: string;
  cameraId?: string;
  fenceId?: string;
  securityKind?: 'intrusion' | 'violation' | 'fire';
  focus3d?: { offsetX: number; offsetY: number; scale: number };
}

export interface FireEquipment {
  id: string;
  name: string;
  code: string;
  area: string;
  status: '正常' | '待巡检' | '中断' | '异常';
  lastChecked: string;
  cycleDays: number;
  type: 'fire_extinguisher' | 'hydrant' | 'smoke_sensor';
  pos3d?: Pos3d;
  lastMaintSummary?: string;
}

export interface DoorLog {
  id: string;
  name: string;
  avatar: string;
  role: '员工' | '访客' | '外协人员' | '主管';
  action: '进入' | '离开' | '登记';
  location: string;
  time: string;
  status: 'success' | 'warning';
}

export interface ElectronicFence {
  id: string;
  name: string;
  area: string;
  fenceType: '高温区' | '危化品仓库' | '机械作业区';
  status: 'active' | 'disabled';
  intrusionAlert: boolean;
  color: string;
  pos3d: { left: number; bottom: number; width: number; height: number };
  linkedCameraId?: string;
  focus3d: { offsetX: number; offsetY: number; scale: number };
}

export interface SafetyEvent {
  id: string;
  title: string;
  type: '区域闯入' | '违规作业' | '消防异常' | '其他';
  time: string;
  location: string;
  status: '处置中' | '已闭环';
  handler: string;
  process: string;
  rectification?: string;
}

export interface ProductionOrder {
  id: string;
  productType: string;
  batchNo: string;
  currentProcess: '拉丝' | '退火' | '绞线' | '绝缘' | '成缆' | '护套' | '成卷';
  completionRate: number; // %
  plannedQty: number; // km
  completedQty: number; // km
  status: 'normal' | 'bottleneck' | 'waiting';
  orderStatus: 'scheduled' | 'in_progress' | 'qc_pending' | 'completed' | 'exception';
  deliveryTime: string;
  oee: number;
  qualityRate: number;
}

export type ProcessStepId = 'drawing' | 'stranding' | 'insulation' | 'sheathing' | 'winding';

export type ProcessStepStatus = 'running' | 'idle' | 'blocked' | 'stopped';

export interface ProcessStep {
  id: ProcessStepId;
  label: string;
  deviceCode: string;
  deviceName: string;
  status: ProcessStepStatus;
  wipQty: number;
  wipUnit: string;
  orderId?: string;
  lineSpeed: number;
  defectRate: number;
  wireBreakCount: number;
  focus3d: { offsetX: number; offsetY: number; scale: number };
  bayRegion: { left: number; top: number; width: number; height: number };
}

export interface ProductionOverview {
  shiftOutputKm: number;
  dailyOutputKm: number;
  orderCompletionRate: number;
  overallYield: number;
  avgOee: number;
  totalWireBreaks: number;
  dailyPlanProgress: number;
}

export interface ProductionLineMetrics {
  lineId: string;
  lineName: string;
  deviceCode: string;
  outputKm: number;
  lineSpeed: number;
  wireBreakCount: number;
  defectRate: number;
  oee: number;
  effectiveRunHours: number;
  idleRatio: number;
  downtimeRatio: number;
}

export type QualityTraceResult = 'pass' | 'warning' | 'fail';

export interface QualityTraceParam {
  label: string;
  value: string;
  standard: string;
  normal: boolean;
}

export interface QualityTrace {
  id: string;
  batchNo: string;
  orderId: string;
  productType: string;
  processStep: ProcessStepId;
  processLabel: string;
  deviceCode: string;
  deviceName: string;
  operator: string;
  shift: '白班' | '夜班';
  startTime: string;
  endTime: string;
  timeRange: string;
  params: QualityTraceParam[];
  result: QualityTraceResult;
  anomaly?: string;
  correctiveAction?: string;
  sampleNo?: string;
}

export interface QualityBatchSummary {
  batchNo: string;
  orderId: string;
  productType: string;
  spec: string;
  overallResult: QualityTraceResult;
  yieldRate: number;
  anomalyCount: number;
  nodeCount: number;
  productionDate: string;
}

export interface WipZone {
  id: string;
  label: string;
  pos3d: { left: number; top: number };
  wipQty: number;
  unit: string;
  orderId: string;
  orderLabel: string;
}

export interface BottleneckHeatCell {
  id: string;
  label: string;
  pos3d: { left: number; top: number; width: number; height: number };
  blockageCount: number;
  intensity: number;
}

export type EnergyPeriod = 'day' | 'week' | 'month';
export type EnergyTrendGranularity = 'hour' | 'shift' | 'day';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type EnergyRankMode = 'device' | 'line' | 'zone';

export interface EnergyOverviewSnapshot {
  totalKwh: number;
  totalCost: number;
  targetKwh: number;
  achievementRate: number;
  yoyChange: number;
  momChange: number;
  peakKw: number;
  avgPrice: number;
}

export interface EnergyDeviceProfile {
  deviceCode: string;
  deviceName: string;
  lineId: string;
  lineName: string;
  area: string;
  zone: string;
  powerKw: number;
  dailyKwh: number;
  loadPct: number;
  level: EnergyLevel;
  isIdleWaste: boolean;
  idleWasteKw?: number;
  kwhPerKm?: number;
  focus3d: { offsetX: number; offsetY: number; scale: number };
}

export interface EnergyZoneProfile {
  id: string;
  name: string;
  area: string;
  totalKwh: number;
  powerKw: number;
  level: EnergyLevel;
  pos3d: { left: number; top: number; width: number; height: number };
  focus3d: { offsetX: number; offsetY: number; scale: number };
}

export interface EnergyRankingItem {
  rank: number;
  id: string;
  name: string;
  sub?: string;
  valueKw: number;
  dailyKwh: number;
  pct: number;
  level: EnergyLevel;
  deviceCode?: string;
  zoneId?: string;
}

export interface EnergyTrendPoint {
  label: string;
  energyKwh: number;
  outputKm: number;
  isPeak?: boolean;
}

export interface EnergyAlertItem {
  id: string;
  title: string;
  description: string;
  deviceCode?: string;
  zoneId?: string;
  time: string;
  timeRange: string;
  spikeKw: number;
  level: 'P2高危' | 'P3一般';
  kind: 'spike' | 'idle_waste' | 'peak_over' | 'anomaly';
  status: 'pending' | 'resolved';
}

export interface EnergyCapacityLink {
  lineId: string;
  lineName: string;
  batchNo: string;
  outputKm: number;
  energyKwh: number;
  kwhPerKm: number;
  benchmark: number;
  status: 'good' | 'warn' | 'bad';
}

export interface EnergySavingTip {
  id: string;
  title: string;
  description: string;
  savingKwh: number;
  savingCost: number;
  priority: 'high' | 'medium';
  deviceCode?: string;
}

export const PRODUCTION_ORDER_STATUS_LABEL: Record<ProductionOrder['orderStatus'], string> = {
  scheduled: '待排产',
  in_progress: '生产中',
  qc_pending: '待质检',
  completed: '已完成',
  exception: '异常挂账',
};

export interface MaintenanceRecord {
  id: string;
  deviceCode: string;
  type: '故障检修' | '预防维保' | '模具更换';
  summary: string;
  time: string;
  operator: string;
}

export interface MoldChangeRecord {
  id: string;
  deviceCode: string;
  moldCode: string;
  wearBefore: number;
  time: string;
}
