/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DoorLog, SliceId } from './types';
import {
  ENERGY_ALERTS,
  ENERGY_CAPACITY_LINKS,
  ENERGY_DEVICE_PROFILES,
  ENERGY_OVERVIEW,
  ENERGY_SAVING_TIPS,
  ENERGY_ZONE_PROFILES,
} from './data';
import { formatCost, formatKwh } from './energyUtils';

export interface AssistantContext {
  activeSlice: SliceId;
  doorLogs: DoorLog[];
  pendingAlertCount: number;
}

export interface AssistantAction {
  slice?: SliceId;
  deviceCode?: string;
  energyZoneId?: string;
  cameraId?: string;
  securityAlertId?: string;
  showEmergencyGuide?: boolean;
  triggerEcoSaving?: boolean;
}

export interface AssistantReply {
  text: string;
  action?: AssistantAction;
}

function match(text: string, ...keywords: string[]) {
  const t = text.toLowerCase();
  return keywords.some(k => t.includes(k.toLowerCase()));
}

export function resolveAssistantReply(prompt: string, ctx: AssistantContext): AssistantReply {
  const { doorLogs, pendingAlertCount } = ctx;
  const dayOverview = ENERGY_OVERVIEW.day;
  const thl = ENERGY_DEVICE_PROFILES.find(d => d.deviceCode === 'THL-002');
  const idleDevices = ENERGY_DEVICE_PROFILES.filter(d => d.isIdleWaste);
  const pendingEnergyAlerts = ENERGY_ALERTS.filter(a => a.status === 'pending');

  if (match(prompt, '3号', '成缆', 'clj', '超温', '故障', '张力', '模具', '工单', '运维')) {
    if (match(prompt, '工单', '创建', '抢修')) {
      return {
        text: '【操作指引】在运维切面选中故障设备后，点击右侧「告警建单」或告警中枢「一键建维修单」，填写担当人即可同步推送飞书。',
        action: { slice: 'operations', deviceCode: 'CLJ-003' },
      };
    }
    if (match(prompt, '模具', '磨损')) {
      return {
        text: '【模具预警】收线机 SXJ-002 模具 W12 磨损 85% 已触发预警；拉丝机 LSJ-001 模具 D-04 建议核查。可在左侧设备台账查看。',
        action: { slice: 'operations' },
      };
    }
    if (match(prompt, 'top', '故障次数', '一周')) {
      return {
        text: '【故障 TOP】近 7 日：1. 成缆机 #03（5次）2. 收线机 #02（2次）3. 挤塑机 #04（1次）。建议优先处置 CLJ-003。',
        action: { slice: 'operations', deviceCode: 'CLJ-003' },
      };
    }
    return {
      text: '【运维诊断】成缆机 #03 主轴温度 215.3°C 超限。3D 已聚焦设备，右侧可查看实时参数并创建抢修工单。',
      action: { slice: 'operations', deviceCode: 'CLJ-003' },
    };
  }

  if (match(prompt, '危化', '摄像头', 'cam', '安防', '围栏', '闯入', '安全帽', '违规', '疏散', '应急')) {
    if (match(prompt, '疏散', '应急', '路线')) {
      return {
        text: '【应急指引】沿 A 区主通道向东疏散；就近消防 FE-14（危化库）、FH-01（拉丝柱侧）。切安防切面可查看 3D 标注。',
        action: { slice: 'security', showEmergencyGuide: true },
      };
    }
    if (match(prompt, '消防', '巡检', '灭火器')) {
      return {
        text: '【消防台账】待巡检：FE-14（危化库）、TD-02（挤出高温区）。可在右侧消防台账完成巡检签归。',
        action: { slice: 'security' },
      };
    }
    if (match(prompt, '安全帽', '违规', '成缆区')) {
      return {
        text: '【违规作业】CAM-CABLE-03 检测到未佩戴安全帽，告警 AL-1005 待处置。',
        action: { slice: 'security', cameraId: 'cam-03', securityAlertId: 'AL-1005' },
      };
    }
    return {
      text: '【安防联动】已切入安防切面，聚焦 CAM-CHEM-02，围栏越界告警 AL-1002 待处置，右侧可查看实时画面。',
      action: {
        slice: 'security',
        cameraId: 'cam-02',
        securityAlertId: 'AL-1002',
        showEmergencyGuide: true,
      },
    };
  }

  if (match(prompt, '访客', '北门', '门禁', '进出')) {
    const visitors = doorLogs.filter(l => l.role === '访客' || l.role === '外协人员');
    return {
      text: `【门禁台账】今日进出约 ${doorLogs.length + 318} 人次。最近：${doorLogs.slice(0, 2).map(l => `${l.name}(${l.action})`).join('、') || '—'}。访客/外协：${visitors.slice(0, 2).map(l => l.name).join('、') || '无'}。`,
      action: { slice: 'security' },
    };
  }

  if (match(prompt, '产量', '订单', 'yjv', '瓶颈', 'oee', '交付', '生产') && !match(prompt, '能耗', '产量分析', '电耗')) {
    if (match(prompt, 'oee')) {
      return {
        text: '【OEE】SO-260609-18 当前 OEE 72%（未达标）；SO-260609-21 为 88%。成缆故障是主要拖累。',
        action: { slice: 'production' },
      };
    }
    if (match(prompt, '瓶颈')) {
      return {
        text: '【瓶颈】成缆机 #03 故障导致护套待料，SO-260609-18 交付滞后。建议优先恢复成缆或调整排产。',
        action: { slice: 'production' },
      };
    }
    return {
      text: '【生产进度】YJV-3x240 完成率 76%，成缆阻塞护套待料。今日当班 18.62 km，达日计划 82%。',
      action: { slice: 'production' },
    };
  }

  if (match(prompt, '能耗', '空转', '用电', '省电', '退火', '尖峰', '休眠', '5号', '节能', '电耗', '待机', '排行', '超标', '热力')) {
    if (match(prompt, '退火', 'thl') && match(prompt, '今日', '多少', '耗电', '用电')) {
      return {
        text: `【退火炉能耗】精密退火熔融炉 #02 今日累计 ${formatKwh(thl?.dailyKwh ?? 4200)}，实时功率 ${thl?.powerKw ?? 286} kW，负载 ${thl?.loadPct ?? 88}%。为全厂 TOP1 耗电设备，3D 已聚焦退火高温区。`,
        action: { slice: 'energy', deviceCode: 'THL-002', energyZoneId: 'zone-anneal' },
      };
    }
    if (match(prompt, '退火', '尖峰', '异常')) {
      const alert = pendingEnergyAlerts.find(a => a.deviceCode === 'THL-002') ?? pendingEnergyAlerts[0];
      return {
        text: `【尖峰告警】退火炉 #02 10:00–11:30 功率突增 ${alert?.spikeKw ?? 25} kW，超出尖峰基线。建议核查炉温设定与排产负荷，或错峰启动 4 号挤塑线。`,
        action: { slice: 'energy', deviceCode: 'THL-002', energyZoneId: 'zone-anneal' },
      };
    }
    if (match(prompt, '区域', '超标', '哪个', '热力', '高耗')) {
      const overZones = ENERGY_ZONE_PROFILES.filter(z => z.level === 'high');
      const zoneList = overZones.map(z => `${z.name}(${formatKwh(z.totalKwh)})`).join('、');
      return {
        text: `【区域超标】当前高耗区域：${zoneList}。挤出熔融区含 5 号护套空转，退火高温区尖峰功率 286 kW。3D 热力图已标红高耗区，点击左侧排行可联动定位。`,
        action: { slice: 'energy', energyZoneId: 'zone-extrude', deviceCode: 'JSX-005' },
      };
    }
    if (match(prompt, '待机', '空转', '清单', '空耗')) {
      const list = idleDevices.map(d => `${d.deviceName}(${d.idleWasteKw ?? d.powerKw} kW)`).join('、');
      return {
        text: `【待机空耗】检测到 ${idleDevices.length} 台设备无效通电：${list || '无'}。5 号护套挤出机因成缆停滞已空热 4h+，建议启动深度节能休眠，预计日省 ${formatCost(450)}。`,
        action: { slice: 'energy', deviceCode: 'JSX-005', energyZoneId: 'zone-extrude' },
      };
    }
    if (match(prompt, '今日', '总用电', '用电量', '多少', '工厂')) {
      return {
        text: `【能耗总览】今日总用电 ${formatKwh(dayOverview.totalKwh)}，成本 ${formatCost(dayOverview.totalCost)}，环比 ${dayOverview.momChange > 0 ? '+' : ''}${dayOverview.momChange}%（${dayOverview.momChange > 0 ? '超标' : '达标'}）。目标达成率 ${dayOverview.achievementRate}%，尖峰功率 ${dayOverview.peakKw} kW。`,
        action: { slice: 'energy', energyZoneId: 'zone-extrude' },
      };
    }
    if (match(prompt, '排行', 'top', '大户', '耗电最多')) {
      const top3 = [...ENERGY_DEVICE_PROFILES].sort((a, b) => b.powerKw - a.powerKw).slice(0, 3);
      const list = top3.map((d, i) => `${i + 1}.${d.deviceName} ${d.powerKw} kW`).join('；');
      return {
        text: `【耗电 TOP3】${list}。退火炉占全厂日耗电约 33%，建议优先管控尖峰段启停。`,
        action: { slice: 'energy', deviceCode: top3[0]?.deviceCode, energyZoneId: 'zone-anneal' },
      };
    }
    if (match(prompt, '单位', 'kwh', '产能', '产量分析', '联动', '批次')) {
      const worst = ENERGY_CAPACITY_LINKS.find(l => l.status === 'bad') ?? ENERGY_CAPACITY_LINKS[0];
      return {
        text: `【产能联动】${worst.lineName} 批次 ${worst.batchNo} 单位电耗 ${worst.kwhPerKm} kWh/km（基准 ${worst.benchmark}，${worst.status === 'bad' ? '偏高' : '正常'}）。产量 ${worst.outputKm} km / 耗电 ${formatKwh(worst.energyKwh)}，建议优化排班避开尖峰加热。`,
        action: { slice: 'energy', deviceCode: 'JSX-004', energyZoneId: 'zone-extrude' },
      };
    }
    if (match(prompt, '节能', '建议', '优化', '启停', '排班')) {
      const tips = ENERGY_SAVING_TIPS.slice(0, 2);
      const saving = ENERGY_SAVING_TIPS.reduce((s, t) => s + t.savingKwh, 0);
      return {
        text: `【节能建议】梳理 ${ENERGY_SAVING_TIPS.length} 项优化空间，合计可省 ${formatKwh(saving)}/日：${tips.map(t => t.title).join('；')}。可在右侧查看完整报告并一键启动 5 号机休眠。`,
        action: { slice: 'energy', deviceCode: 'JSX-005', energyZoneId: 'zone-extrude' },
      };
    }
    if (match(prompt, '休眠', '一键', '启动节能', '5号', '空转诊断')) {
      return {
        text: '【节能执行】5 号护套挤出机负载仅 4%，属无效空转。正在为您启动深度节能休眠策略，预计尖峰段降耗 13.2 kW。',
        action: { slice: 'energy', deviceCode: 'JSX-005', energyZoneId: 'zone-extrude', triggerEcoSaving: true },
      };
    }
    if (match(prompt, '告警', '异常')) {
      const list = pendingEnergyAlerts.slice(0, 3).map(a => a.title).join('；');
      return {
        text: `【能耗告警】待处理 ${pendingEnergyAlerts.length} 条：${list}。点击右侧告警条目可 3D 聚焦异常区域。`,
        action: { slice: 'energy', deviceCode: pendingEnergyAlerts[0]?.deviceCode, energyZoneId: pendingEnergyAlerts[0]?.zoneId ?? 'zone-extrude' },
      };
    }
    return {
      text: `【节能建议】5 号护套挤出机负载 4% 属无效空转，建议启动深度节能休眠。今日累计 ${formatKwh(dayOverview.totalKwh)}，环比 ${dayOverview.momChange > 0 ? '+' : ''}${dayOverview.momChange}%。`,
      action: { slice: 'energy', deviceCode: 'JSX-005', energyZoneId: 'zone-extrude' },
    };
  }

  if (match(prompt, '告警', '待处理')) {
    return {
      text: `【告警汇总】待处理 ${pendingAlertCount} 条：成缆超温、围栏越界、安全帽违规、订单瓶颈等。点击顶栏「统一告警中枢」集中处置。`,
    };
  }

  if (match(prompt, '切换', '切面', '怎么')) {
    return {
      text: '【导航】底部可切换运维/安防/生产/能耗切面；也可直接问我，我会帮您跳转并联动 3D 与 2D 面板。',
    };
  }

  if (match(prompt, '概况', '全厂', '运行')) {
    return {
      text: `【全厂概况】156 台设备联网，1 台故障、3 台预警，${pendingAlertCount} 条待处理告警。今日用电 ${formatKwh(dayOverview.totalKwh)}，5 号护套空转待节能。`,
    };
  }

  return {
    text: `关于「${prompt}」：可点击下方分类提示词，或切换到相关切面查看 2D/3D 联动。当前待处理告警 ${pendingAlertCount} 条。`,
  };
}

export function applyAssistantAction(
  action: AssistantAction | undefined,
  handlers: {
    setActiveSlice: (s: SliceId) => void;
    handleDeviceSelect: (code: string) => void;
    handleEnergyDeviceSelect?: (code: string) => void;
    setSelectedEnergyZoneId?: (id: string | null) => void;
    setSelectedCameraId: (id: string | null) => void;
    setSelectedSecurityAlertId: (id: string | null) => void;
    setShowEmergencyGuide: (v: boolean) => void;
    triggerEcoSaving?: () => void;
  },
) {
  if (!action) return;
  if (action.slice) handlers.setActiveSlice(action.slice);
  if (action.energyZoneId && handlers.setSelectedEnergyZoneId) {
    handlers.setSelectedEnergyZoneId(action.energyZoneId);
  }
  if (action.deviceCode) {
    if (action.slice === 'energy' && handlers.handleEnergyDeviceSelect) {
      handlers.handleEnergyDeviceSelect(action.deviceCode);
    } else {
      handlers.handleDeviceSelect(action.deviceCode);
    }
  }
  if (action.cameraId) handlers.setSelectedCameraId(action.cameraId);
  if (action.securityAlertId) handlers.setSelectedSecurityAlertId(action.securityAlertId);
  if (action.showEmergencyGuide) handlers.setShowEmergencyGuide(true);
  if (action.triggerEcoSaving && handlers.triggerEcoSaving) handlers.triggerEcoSaving();
}
