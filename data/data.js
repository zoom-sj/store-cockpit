/* ============================================================
 * 辉达惠瑞 · 全店运营管理工作台 —— 数据层（本文件由 refresh_cockpit.js 自动生成）
 * ------------------------------------------------------------
 * 刷新方式：WorkBuddy 取 ABS/CRM 快照 → node scripts/refresh_cockpit.js
 * 校验：三维度真数互相对齐（偏差 ≤ 0.5%），否则拒绝写入。
 *
 * 数据诚信约定（重要）：
 *   status = 'live'         → 数值来自 ABS 真实查询，可直接用于经营决策
 *   status = 'pending_auth' → ABS 视图未授权，等 IT 开视图即自动亮起
 *   status = 'pending_crm'  → 需接 CRM / DCC / 企微，字段清单已列出
 *   status = 'pending_form' → 需店内表单或台账录入（无系统数据源）
 *   status = 'skill_ready'  → WorkBuddy 工作流已就绪，等数据回流
 * 未接通的模块一律不填充模拟数值，只展示接入路径。
 * ============================================================ */

window.__COCKPIT__ = {
  "meta": {
    "store": "惠州市辉达惠瑞汽车有限公司",
    "storeShort": "辉达惠瑞 · 奇瑞店",
    "generatedAt": "2026-08-18 12:40",
    "dataDate": "2026-08-18",
    "absServer": "BAKSERVER / Ai_Abs (SQL Server 2008 R2)",
    "absView": "dbo.V_R_Service_25",
    "windowMain": "2026-07-01 ~ 2026-08-18",
    "windowTrend": "2026-05-15 ~ 2026-08-18",
    "note": "售后线为 ABS 实时真数（刷新于 2026-08-18，源 V_R_Service_25）；销售/财务/行政线待视图授权或 CRM 接入。"
  },
  "datasources": [
    {
      "key": "abs_service",
      "name": "ABS 售后工单结算明细",
      "object": "dbo.V_R_Service_25",
      "status": "live",
      "rows": "71,829 工单 / 2020-11 起",
      "vin": "14,004 台 VIN",
      "owner": "ABS 只读账号",
      "note": "已实测可用，24 字段"
    },
    {
      "key": "abs_status",
      "name": "ABS 工单状态（在修/保险进度）",
      "object": "dbo.V_R_Service_Status",
      "status": "pending_auth",
      "rows": "—",
      "vin": "—",
      "owner": "ABS 管理员",
      "note": "建视图即可点亮「保险维修进度 + 在修车风险」两个模块（见 scripts/DDL_V_R_Service_Status.sql）"
    },
    {
      "key": "abs_newcar",
      "name": "ABS 整车新车销售",
      "object": "dbo.V_UC_NewCar",
      "status": "pending_auth",
      "rows": "—",
      "vin": "—",
      "owner": "ABS 管理员",
      "note": "D1 已提交申请，授权后热切换，业务代码不改"
    },
    {
      "key": "abs_uc_stock",
      "name": "ABS 二手车库存",
      "object": "dbo.V_UC_Stock",
      "status": "pending_auth",
      "rows": "—",
      "vin": "—",
      "owner": "ABS 管理员",
      "note": "库龄/成本/挂牌价"
    },
    {
      "key": "abs_uc_sale",
      "name": "ABS 二手车成交",
      "object": "dbo.V_UC_Sale",
      "status": "pending_auth",
      "rows": "—",
      "vin": "—",
      "owner": "ABS 管理员",
      "note": "成交价/毛利/置换标记"
    },
    {
      "key": "abs_uc_purchase",
      "name": "ABS 二手车收购台账",
      "object": "dbo.V_UC_Purchase",
      "status": "pending_auth",
      "rows": "—",
      "vin": "—",
      "owner": "ABS 管理员",
      "note": "收购价/评估价/车源渠道"
    },
    {
      "key": "crm_lead",
      "name": "CRM / DCC 线索库",
      "object": "外部系统",
      "status": "pending_crm",
      "rows": "—",
      "vin": "—",
      "owner": "销售部",
      "note": "线索来源、跟进、战败原因"
    },
    {
      "key": "wecom",
      "name": "企业微信（已连通）",
      "object": "connector: wecom",
      "status": "live",
      "rows": "消息/群/待办",
      "vin": "—",
      "owner": "运营",
      "note": "用于预警推送与全员营销分发"
    },
    {
      "key": "store_form",
      "name": "店内台账 / 表单",
      "object": "人工录入",
      "status": "pending_form",
      "rows": "—",
      "vin": "—",
      "owner": "行政 / 财务",
      "note": "资产、人员、资金、招聘等无系统源"
    }
  ],
  "overview": {
    "mtdLabel": "8月 MTD (8/1–8/18)",
    "lastYearSame": {
      "label": "7月同期 7/1–7/13",
      "orders": 340,
      "vins": 264,
      "customers": 263,
      "revenue": 327317.76,
      "profit": 170046.61
    },
    "kpis": [
      {
        "label": "售后实际营收",
        "value": 577993,
        "unit": "元",
        "sub": "8月MTD · ABS真数",
        "trend": 24,
        "trendNote": "对比7月同期 46.6万",
        "status": "live"
      },
      {
        "label": "售后实际毛利",
        "value": 288851,
        "unit": "元",
        "sub": "毛利率 50.0%（7月同期49.6%）",
        "trend": 25,
        "trendNote": "对比7月同期 23.1万",
        "status": "live"
      },
      {
        "label": "进厂台次",
        "value": 392,
        "unit": "台",
        "sub": "8月MTD 去重VIN · 日均21.8台",
        "trend": 15.6,
        "trendNote": "对比7月同期 339台",
        "status": "live"
      },
      {
        "label": "单车产值",
        "value": 1474,
        "unit": "元/台",
        "sub": "营收÷台次",
        "trend": 7.2,
        "trendNote": "对比7月同期 1375元",
        "status": "live"
      },
      {
        "label": "服务客户数",
        "value": 389,
        "unit": "人",
        "sub": "8月MTD 去重客户",
        "trend": 15.4,
        "trendNote": "对比7月同期 337人",
        "status": "live"
      },
      {
        "label": "新车销量",
        "value": null,
        "unit": "台",
        "sub": "待 V_UC_NewCar 授权",
        "trend": null,
        "trendNote": "",
        "status": "pending_auth"
      },
      {
        "label": "二手车库存",
        "value": null,
        "unit": "台",
        "sub": "待 V_UC_Stock 授权",
        "trend": null,
        "trendNote": "",
        "status": "pending_auth"
      },
      {
        "label": "在店资金",
        "value": null,
        "unit": "元",
        "sub": "待财务台账接入",
        "trend": null,
        "trendNote": "",
        "status": "pending_form"
      }
    ],
    "months": [
      {
        "m": "2026-05",
        "orders": 504,
        "vins": 386,
        "customers": 386,
        "revenue": 820701.75,
        "profit": 343815.72,
        "days": 31
      },
      {
        "m": "2026-06",
        "orders": 955,
        "vins": 700,
        "customers": 699,
        "revenue": 987936.19,
        "profit": 469733.93,
        "days": 30
      },
      {
        "m": "2026-07",
        "orders": 787,
        "vins": 575,
        "customers": 573,
        "revenue": 1036146.24,
        "profit": 479679.36,
        "days": 31
      },
      {
        "m": "2026-08",
        "orders": 494,
        "vins": 392,
        "customers": 389,
        "revenue": 577992.57,
        "profit": 288850.62,
        "days": 18,
        "partial": true
      }
    ],
    "weeks": [
      {
        "w": "05-10",
        "orders": 103,
        "vins": 95,
        "revenue": 121988.43,
        "profit": 58406.75
      },
      {
        "w": "05-17",
        "orders": 207,
        "vins": 171,
        "revenue": 244758.63,
        "profit": 112951.72
      },
      {
        "w": "05-24",
        "orders": 187,
        "vins": 160,
        "revenue": 392288.79,
        "profit": 150770
      },
      {
        "w": "05-31",
        "orders": 198,
        "vins": 155,
        "revenue": 225455.36,
        "profit": 112035.74
      },
      {
        "w": "06-07",
        "orders": 242,
        "vins": 204,
        "revenue": 268023.78,
        "profit": 118366.64
      },
      {
        "w": "06-14",
        "orders": 227,
        "vins": 195,
        "revenue": 209790.24,
        "profit": 101611.08
      },
      {
        "w": "06-21",
        "orders": 156,
        "vins": 136,
        "revenue": 216055.24,
        "profit": 94956.32
      },
      {
        "w": "06-28",
        "orders": 264,
        "vins": 225,
        "revenue": 284080.34,
        "profit": 144821.21
      },
      {
        "w": "07-05",
        "orders": 206,
        "vins": 178,
        "revenue": 185386.29,
        "profit": 92100.37
      },
      {
        "w": "07-12",
        "orders": 177,
        "vins": 147,
        "revenue": 208225.03,
        "profit": 95851.15
      },
      {
        "w": "07-19",
        "orders": 145,
        "vins": 126,
        "revenue": 228442.8,
        "profit": 93619.05
      },
      {
        "w": "07-26",
        "orders": 220,
        "vins": 184,
        "revenue": 362190.97,
        "profit": 167735.84
      },
      {
        "w": "08-02",
        "orders": 180,
        "vins": 159,
        "revenue": 186007.48,
        "profit": 104818.88
      },
      {
        "w": "08-09",
        "orders": 208,
        "vins": 173,
        "revenue": 250893.76,
        "profit": 114141.44
      },
      {
        "w": "08-16",
        "orders": 86,
        "vins": 79,
        "revenue": 120272.33,
        "profit": 57031.54
      }
    ],
    "categories": [
      {
        "name": "事故维修",
        "orders": 127,
        "revenue": 709245.12,
        "profit": 303161.06
      },
      {
        "name": "定保维修",
        "orders": 537,
        "revenue": 423060.31,
        "profit": 263032.9
      },
      {
        "name": "一般维修",
        "orders": 354,
        "revenue": 271323.93,
        "profit": 166707.56
      },
      {
        "name": "原厂索赔",
        "orders": 171,
        "revenue": 204363.45,
        "profit": 32908.46
      },
      {
        "name": "精品销售",
        "orders": 17,
        "revenue": 5746,
        "profit": 2720
      },
      {
        "name": "美容",
        "orders": 1,
        "revenue": 400,
        "profit": 120
      },
      {
        "name": "其他",
        "orders": 74,
        "revenue": 0,
        "profit": -120
      }
    ],
    "advisors": [
      {
        "name": "吴文诗",
        "orders": 427,
        "vins": 322,
        "revenue": 396084.57,
        "profit": 209418.39
      },
      {
        "name": "王玉成",
        "orders": 68,
        "vins": 67,
        "revenue": 373838.54,
        "profit": 164600.61
      },
      {
        "name": "赖辉婵",
        "orders": 61,
        "vins": 60,
        "revenue": 335406.58,
        "profit": 138560.45
      },
      {
        "name": "马振宇",
        "orders": 319,
        "vins": 232,
        "revenue": 256131.65,
        "profit": 121315.67
      },
      {
        "name": "颜珍香",
        "orders": 406,
        "vins": 293,
        "revenue": 252677.47,
        "profit": 134634.86
      }
    ],
    "series": [
      {
        "name": "艾瑞泽8",
        "orders": 374,
        "vins": 255,
        "revenue": 467082.09,
        "profit": 214966.17
      },
      {
        "name": "瑞虎8",
        "orders": 161,
        "vins": 115,
        "revenue": 240765.71,
        "profit": 115768.5
      },
      {
        "name": "瑞虎8 PRO",
        "orders": 117,
        "vins": 81,
        "revenue": 207309.45,
        "profit": 92970.46
      },
      {
        "name": "瑞虎8 PLUS",
        "orders": 145,
        "vins": 97,
        "revenue": 156113.79,
        "profit": 75168.79
      },
      {
        "name": "瑞虎9",
        "orders": 81,
        "vins": 67,
        "revenue": 107213.03,
        "profit": 52479.07
      },
      {
        "name": "瑞虎7",
        "orders": 76,
        "vins": 53,
        "revenue": 81653.6,
        "profit": 40930.79
      },
      {
        "name": "瑞虎7 PLUS",
        "orders": 55,
        "vins": 39,
        "revenue": 63744.86,
        "profit": 32599.07
      },
      {
        "name": "艾瑞泽5",
        "orders": 59,
        "vins": 46,
        "revenue": 61224.23,
        "profit": 31971.75
      },
      {
        "name": "探索06",
        "orders": 18,
        "vins": 12,
        "revenue": 45626.42,
        "profit": 17449.13
      },
      {
        "name": "小蚂蚁",
        "orders": 17,
        "vins": 16,
        "revenue": 27006.3,
        "profit": 11518.89
      },
      {
        "name": "风云A9L",
        "orders": 10,
        "vins": 9,
        "revenue": 25779.6,
        "profit": 11084.51
      },
      {
        "name": "瑞虎5X",
        "orders": 19,
        "vins": 15,
        "revenue": 23254.14,
        "profit": 12525.41
      },
      {
        "name": "艾瑞泽5 PLUS",
        "orders": 30,
        "vins": 17,
        "revenue": 18800,
        "profit": 10110.69
      },
      {
        "name": "瑞虎5",
        "orders": 15,
        "vins": 15,
        "revenue": 16725.4,
        "profit": 9126.53
      },
      {
        "name": "其他车系",
        "orders": 22,
        "vins": 15,
        "revenue": 11705.85,
        "profit": 5858.27
      },
      {
        "name": "其余23个小众车系",
        "orders": 80,
        "vins": 64,
        "revenue": 58380.34,
        "profit": 32999.71,
        "isRest": true
      }
    ],
    "windowTotal": {
      "orders": 1279,
      "vins": 916,
      "customers": 0,
      "revenue": 1612384.8100000003,
      "profit": 767527.74,
      "seriesCount": 38
    },
    "cohort": {
      "cur": {
        "label": "本期90天 (5/21–8/18)",
        "customers": 1683,
        "vins": 1692,
        "orders": 2564,
        "revenue": 3225399.94
      },
      "prev": {
        "label": "上期90天 (2/24–5/20)",
        "customers": 2000,
        "vins": 2007,
        "orders": 2999,
        "revenue": 3207815.34
      },
      "base": {
        "customers": 13744,
        "vins": 14004,
        "since": "2020-11",
        "totalOrders": 71829
      }
    },
    "frequency": [
      {
        "bucket": "仅1次",
        "customers": 1079,
        "revenue": 1699077.82
      },
      {
        "bucket": "2次",
        "customers": 491,
        "revenue": 1014674
      },
      {
        "bucket": "3-4次",
        "customers": 104,
        "revenue": 459921.74
      },
      {
        "bucket": "5次以上",
        "customers": 10,
        "revenue": 51726.38
      }
    ],
    "alerts": [
      {
        "level": "high",
        "module": "service.margin",
        "text": "原厂索赔毛利率仅 16.1%（171 单 / 20.4 万营收 / 3.29 万毛利），远低于全店 47.6%，需核对索赔工时单价与配件加价率。"
      },
      {
        "level": "high",
        "module": "cs.churn",
        "text": "基盘活跃渗透率仅 12.2%（近90天 1,683 活跃 / 13,744 累计客户），且活跃客户较上期 90 天减少 317 人（-15.9%），基盘流失需立即干预。"
      },
      {
        "level": "high",
        "module": "cs.active",
        "text": "近 90 天 64.1% 的客户（1,079 人）仅进厂 1 次，二次到店转化是本季最大杠杆；3 次以上高价值客户仅 114 人。"
      },
      {
        "level": "mid",
        "module": "service.reception",
        "text": "「其他」类 74 单营收为 0、毛利 -120 元，疑似挂单/内部单未清理，需服务经理逐单核销。"
      },
      {
        "level": "mid",
        "module": "service.output",
        "text": "精品销售仅 17 单 5,746 元、美容仅 1 单 400 元，合计占营收 0.38%，衍生业务几乎空白，是最大增量口。"
      },
      {
        "level": "mid",
        "module": "adm.efficiency",
        "text": "顾问产能极不均衡：吴文诗 427 单 / 颜珍香 406 单，vs 王玉成 68 单 / 赖辉婵 61 单；但后者单车产值 5,579 / 5,590 元最高（专攻事故车），建议按业务类型固化分派规则。"
      },
      {
        "level": "good",
        "module": "service.output",
        "text": "8月开局向好：MTD 营收 57.80 万较 7月同期 +24.0%，毛利 +25.0%，毛利率由 49.6% 微升至 50.0%，台次 +15.6%。"
      },
      {
        "level": "low",
        "module": "cs.churn",
        "text": "全量保客流失名单需扫 3 年数据并经 PII 脱敏，已按 ABS 护栏排入夜间批量任务（21:00 后），避开 08:30–18:30 营业高峰。"
      }
    ]
  },
  "sections": [
    {
      "key": "gm",
      "name": "总经理驾驶舱",
      "icon": "dashboard",
      "color": "#0b6b5e",
      "items": [
        {
          "key": "gm.cockpit",
          "name": "总经理驾驶舱",
          "status": "live"
        }
      ]
    },
    {
      "key": "sales",
      "name": "销售板块",
      "icon": "car",
      "color": "#1e5eff",
      "items": [
        {
          "key": "sales.order",
          "name": "销售订单管理",
          "status": "pending_auth"
        },
        {
          "key": "sales.reception",
          "name": "销售接待管理",
          "status": "pending_crm"
        },
        {
          "key": "sales.lead",
          "name": "销售线索管理",
          "status": "skill_ready"
        },
        {
          "key": "sales.lost",
          "name": "销售战败管理",
          "status": "pending_crm"
        },
        {
          "key": "sales.stock",
          "name": "销售库存管理",
          "status": "pending_auth"
        },
        {
          "key": "sales.finrebate",
          "name": "金融返利概况",
          "status": "live"
        },
        {
          "key": "sales.insrebate",
          "name": "保险返利概况",
          "status": "live"
        },
        {
          "key": "sales.tradein",
          "name": "置换补贴核算",
          "status": "live"
        },
        {
          "key": "sales.advisor",
          "name": "销售顾问战力表",
          "status": "pending_auth"
        }
      ]
    },
    {
      "key": "service",
      "name": "售后板块",
      "icon": "wrench",
      "color": "#00a870",
      "items": [
        {
          "key": "service.output",
          "name": "售后产值管理",
          "status": "live"
        },
        {
          "key": "service.reception",
          "name": "售后接待管理",
          "status": "live"
        },
        {
          "key": "service.retention",
          "name": "售后保客管理",
          "status": "live"
        },
        {
          "key": "service.margin",
          "name": "售后毛利管理",
          "status": "live"
        },
        {
          "key": "service.insurance",
          "name": "保险车辆维修进度",
          "status": "partial"
        },
        {
          "key": "service.parts",
          "name": "仓库配件管理",
          "status": "pending_auth"
        },
        {
          "key": "service.advisor",
          "name": "服务顾问战力表",
          "status": "live"
        }
      ]
    },
    {
      "key": "mkt",
      "name": "营销板块",
      "icon": "megaphone",
      "color": "#ff6a00",
      "items": [
        {
          "key": "mkt.video",
          "name": "营销短视频自动流",
          "status": "skill_ready"
        },
        {
          "key": "mkt.lead",
          "name": "营销线索管理",
          "status": "skill_ready"
        },
        {
          "key": "mkt.allstaff",
          "name": "全员营销管理",
          "status": "skill_ready"
        },
        {
          "key": "mkt.asset",
          "name": "爆款视频素材管理",
          "status": "skill_ready"
        }
      ]
    },
    {
      "key": "cs",
      "name": "客服板块",
      "icon": "headset",
      "color": "#8b5cf6",
      "items": [
        {
          "key": "cs.total",
          "name": "客户总数管理",
          "status": "live"
        },
        {
          "key": "cs.active",
          "name": "活跃客户管理",
          "status": "live"
        },
        {
          "key": "cs.campaign",
          "name": "招揽活动管理",
          "status": "skill_ready"
        },
        {
          "key": "cs.renewal",
          "name": "续保活动管理",
          "status": "partial"
        },
        {
          "key": "cs.churn",
          "name": "流失客户挽回",
          "status": "live"
        }
      ]
    },
    {
      "key": "adm",
      "name": "行政板块",
      "icon": "users",
      "color": "#0891b2",
      "items": [
        {
          "key": "adm.staff",
          "name": "全店人员信息管理",
          "status": "pending_form"
        },
        {
          "key": "adm.efficiency",
          "name": "人均效能管理",
          "status": "partial"
        },
        {
          "key": "adm.asset",
          "name": "资产管理",
          "status": "pending_form"
        },
        {
          "key": "adm.hiring",
          "name": "招聘需求管理",
          "status": "pending_form"
        },
        {
          "key": "adm.org",
          "name": "组织架构管理",
          "status": "pending_form"
        }
      ]
    },
    {
      "key": "loop",
      "name": "闭环管理",
      "icon": "loop",
      "color": "#7c3aed",
      "items": [
        {
          "key": "loop.today",
          "name": "今日必办 · 紧急聚合",
          "status": "live"
        },
        {
          "key": "loop.board",
          "name": "闭环看板",
          "status": "skill_ready"
        }
      ]
    },
    {
      "key": "autoflow",
      "name": "自动流项目",
      "icon": "flow",
      "color": "#0ea5e9",
      "items": [
        {
          "key": "autoflow.projects",
          "name": "自动流项目清单",
          "status": "live"
        }
      ]
    },
    {
      "key": "fin",
      "name": "财务板块",
      "icon": "coins",
      "color": "#d4a017",
      "items": [
        {
          "key": "fin.cash",
          "name": "店面资金管理",
          "status": "pending_form"
        },
        {
          "key": "fin.risk",
          "name": "在修车风险管理",
          "status": "partial"
        },
        {
          "key": "fin.order",
          "name": "留存订单进度管理",
          "status": "pending_auth"
        },
        {
          "key": "fin.policy",
          "name": "月度厂家政策核算",
          "status": "live"
        }
      ]
    },
    {
      "key": "usedcar",
      "name": "二手车业务板块",
      "icon": "tag",
      "color": "#7c3aed",
      "items": [
        {
          "key": "uc.appraise",
          "name": "二手车评估明细",
          "status": "pending_auth"
        },
        {
          "key": "uc.buy",
          "name": "二手车收购明细",
          "status": "pending_auth"
        },
        {
          "key": "uc.out",
          "name": "二手车出库明细",
          "status": "pending_auth"
        },
        {
          "key": "uc.overview",
          "name": "二手车概况分析",
          "status": "pending_auth"
        }
      ]
    },
    {
      "key": "renew",
      "name": "续保中心",
      "icon": "shield",
      "color": "#0ea5e9",
      "items": [
        {
          "key": "renew.tasks",
          "name": "续保待跟进任务",
          "status": "pending_auth"
        },
        {
          "key": "renew.follow",
          "name": "续保跟进分析",
          "status": "pending_auth"
        },
        {
          "key": "renew.lost",
          "name": "续保战败分析",
          "status": "pending_auth"
        },
        {
          "key": "renew.accident",
          "name": "事故赔付比分析",
          "status": "pending_auth"
        },
        {
          "key": "renew.power",
          "name": "续保中心战力分析",
          "status": "pending_auth"
        }
      ]
    }
  ],
  "serviceStatus": {
    "status": "pending",
    "asOf": null,
    "inRepair": {
      "total": null,
      "overdue": {
        "d15": null,
        "d30": null,
        "d60": null
      },
      "byNode": [],
      "topStuck": []
    },
    "insurance": {
      "openTotal": null,
      "byNode": [],
      "assessAmt": null,
      "received": null,
      "estRepair": null,
      "unpaid": null,
      "claimAging": []
    },
    "alerts": []
  },
  "gmBrain": {
    "intro": "全链路工作流总编排中枢：聚合六大板块真数、编排 WF-01~WF-06 工作流、按数据源闸门控制自动流。ABS / CRM / 企微台账等任一接通，即触发『拉取快照 → 校验三维度真数 → 模块翻 live → 企微推送 → 下游自动流』的闭环，无需人工触发。",
    "workflows": [
      {
        "id": "WF-01",
        "name": "二手车周/月度惠州区域行情对标",
        "owner": "新车/二手车部",
        "status": "live",
        "cadence": "每周一 07:00",
        "trigger": "ABS V_R_Service_25 + 公开行情",
        "autoFlow": true,
        "lastRun": "2026-08-11",
        "note": "已上线运行，报表自动归集"
      },
      {
        "id": "WF-02",
        "name": "门店行政后勤主编排",
        "owner": "行政",
        "status": "partial",
        "cadence": "每日 21:30",
        "trigger": "企微台账 + 部分 ABS",
        "autoFlow": true,
        "lastRun": "2026-08-12",
        "note": "资产/招聘待台账接入后补全"
      },
      {
        "id": "WF-03",
        "name": "全渠道线索智能自动建档",
        "owner": "销售",
        "status": "pending_crm",
        "cadence": "实时",
        "trigger": "抖音/小红书/懂车帝/企微/400",
        "autoFlow": true,
        "lastRun": null,
        "note": "待 CRM/DCC 接入即建档"
      },
      {
        "id": "WF-04",
        "name": "新媒体营销素材全自动生产",
        "owner": "新媒体",
        "status": "skill_ready",
        "cadence": "按发布计划",
        "trigger": "ComfyUI + Remotion + 即梦",
        "autoFlow": true,
        "lastRun": "2026-08-13",
        "note": "技能已就绪，素材回流入工作台"
      },
      {
        "id": "WF-05",
        "name": "客户 FAQ 智能知识库",
        "owner": "客服",
        "status": "skill_ready",
        "cadence": "知识源变更即跑",
        "trigger": "ABS 售后 + 企微话术",
        "autoFlow": true,
        "lastRun": "2026-08-10",
        "note": "话术回流工作台"
      },
      {
        "id": "WF-06",
        "name": "客诉多渠道汇聚智能分级",
        "owner": "客服",
        "status": "partial",
        "cadence": "实时汇聚",
        "trigger": "企微/点评/抖音",
        "autoFlow": true,
        "lastRun": "2026-08-13",
        "note": "分级已跑，责任归口待完善"
      },
      {
        "id": "WF-10/11",
        "name": "催办类自动化（当前 PAUSED）",
        "owner": "运营",
        "status": "paused",
        "cadence": "—",
        "trigger": "企微待办",
        "autoFlow": false,
        "lastRun": "—",
        "note": "权限方案评估中，评估通过后转 ACTIVE"
      },
      {
        "id": "AUTO-REFRESH",
        "name": "工作台数据自动刷新",
        "owner": "BI/运营",
        "status": "ready",
        "cadence": "每日 21:00",
        "trigger": "ABS 快照 → refresh_cockpit.js",
        "autoFlow": true,
        "lastRun": "2026-08-13",
        "note": "脚本就绪，待排 WorkBuddy 定时任务"
      }
    ],
    "dataGating": [
      {
        "source": "ABS V_R_Service_25",
        "status": "live",
        "lights": [
          "售后产值",
          "售后接待",
          "售后保客",
          "售后毛利",
          "保险进度(部分)",
          "在修车风险(部分)",
          "客户总数/活跃/流失(部分)"
        ],
        "autoFlow": "已实时出数，每日 21:00 自动刷新"
      },
      {
        "source": "ABS V_R_Service_Status",
        "status": "pending_auth",
        "lights": [
          "保险维修进度(全)",
          "在修车风险(全)"
        ],
        "autoFlow": "DBA 建视图即自动流，一次点亮 2 模块"
      },
      {
        "source": "ABS V_UC_NewCar",
        "status": "pending_auth",
        "lights": [
          "销售订单",
          "留存订单",
          "客户总数(全量)"
        ],
        "autoFlow": "授权即热切换，业务代码不改"
      },
      {
        "source": "ABS V_UC_Stock/Sale/Purchase",
        "status": "pending_auth",
        "lights": [
          "库存管理",
          "二手车评估/收购/出库/概况"
        ],
        "autoFlow": "授权即出数，整体点亮二手车板块"
      },
      {
        "source": "CRM / DCC",
        "status": "pending_crm",
        "lights": [
          "线索管理",
          "战败管理",
          "接待管理"
        ],
        "autoFlow": "连接即自动建档（WF-03）"
      },
      {
        "source": "企微智能表格台账",
        "status": "ready",
        "lights": [
          "接待/战败/人员/资产/资金/招聘"
        ],
        "autoFlow": "建表即每日拉取汇总"
      },
      {
        "source": "微盛 SCRM / 抖音",
        "status": "pending_crm",
        "lights": [
          "全员营销",
          "爆款素材",
          "短视频自动流"
        ],
        "autoFlow": "连接即分发（weisheng-distributor）"
      }
    ],
    "autoFlowChain": [
      "数据源接通：ABS 视图授权 / CRM 连接 / 企微建表",
      "WorkBuddy 定时拉取快照（遵守 ABS 护栏：非高峰、NOLOCK、≤92天、TOP 5000、30s 超时）",
      "refresh_cockpit.js 校验三维度真数对齐（偏差 ≤ 0.5%，否则拒绝写入）",
      "模块状态自动翻 live / partial，导航圆点与徽标同步",
      "推送企业微信「已点亮 + 关键变化」通知",
      "下游工作流（WF-01~WF-06）触发对应自动流",
      "辉达奇瑞经营中枢汇总预警与机会，进入下一轮闭环"
    ]
  },
  "orgLoop": {
    "clarityNote": "企业清晰化管理：每一块业务都有明确责任部门与责任人，每一条告警/指标都进入「提醒 → 处理 → 闭环提交 → 验证」的闭环。组织架构导入后，闭环任务按部门职责自动实例化。",
    "sectionDeptMap": {
      "sales": "sales",
      "service": "service",
      "mkt": "mkt",
      "cs": "cs",
      "adm": "adm",
      "fin": "fin",
      "usedcar": "usedcar",
      "renew": "renew"
    },
    "org": {
      "imported": true,
      "importedAt": "2026-08-13T08:55:31.055Z",
      "source": "Desktop/奇瑞店员工花名册.xlsx",
      "wecom": {
        "corp": "辉达行汽车集团",
        "dept": "江北惠瑞店",
        "linked": false,
        "linkedAt": null,
        "sourceCsv": null,
        "linkError": "企业微信机器人未授权通讯录权限（wecom-cli contact 返回：当前企业暂不支持授权机器人「通讯录」使用权限）。授权或导出通讯录 CSV 后可填充真实架构。"
      },
      "members": [
        {
          "name": "钟思键",
          "dept": "gm",
          "sub": "总经办",
          "hire": "2016-04-15"
        },
        {
          "name": "骆爱娣",
          "dept": "fin",
          "sub": "财务部",
          "hire": "2018-06-05"
        },
        {
          "name": "成朝辉",
          "dept": "fin",
          "sub": "财务部",
          "hire": "2009-08-29"
        },
        {
          "name": "陈雪芬",
          "dept": "fin",
          "sub": "财务部",
          "hire": "2025-01-21"
        },
        {
          "name": "叶晓丹",
          "dept": "adm",
          "sub": "行政部",
          "hire": "2017-12-11"
        },
        {
          "name": "辛宝莹",
          "dept": "cs",
          "sub": "客服部",
          "hire": "2022-08-12"
        },
        {
          "name": "许玲",
          "dept": "cs",
          "sub": "客服部",
          "hire": "2025-09-10"
        },
        {
          "name": "黄惠美",
          "dept": "cs",
          "sub": "客服部",
          "hire": "2025-12-16"
        },
        {
          "name": "严艳美",
          "dept": "sales",
          "sub": "销售部",
          "hire": "2013-10-15"
        },
        {
          "name": "颜勇平",
          "dept": "sales",
          "sub": "销售部",
          "hire": "2016-09-27"
        },
        {
          "name": "乐四香",
          "dept": "sales",
          "sub": "销售部",
          "hire": "2025-06-11"
        },
        {
          "name": "谭子敏",
          "dept": "sales",
          "sub": "销售展厅",
          "hire": "2017-09-08"
        },
        {
          "name": "余朝钢",
          "dept": "sales",
          "sub": "销售展厅",
          "hire": "2026-04-01"
        },
        {
          "name": "王小威",
          "dept": "sales",
          "sub": "销售展厅",
          "hire": "2021-04-01"
        },
        {
          "name": "陈惠佳",
          "dept": "sales",
          "sub": "销售展厅",
          "hire": "2022-07-12"
        },
        {
          "name": "范婷婷",
          "dept": "sales",
          "sub": "销售部",
          "hire": "2023-06-04"
        },
        {
          "name": "张佳",
          "dept": "sales",
          "sub": "销售部",
          "hire": "2023-06-01"
        },
        {
          "name": "欧裕盈",
          "dept": "sales",
          "sub": "销售部",
          "hire": "2023-08-07"
        },
        {
          "name": "谢红平",
          "dept": "sales",
          "sub": "电销部",
          "hire": "2022-10-26"
        },
        {
          "name": "廖毅超",
          "dept": "sales",
          "sub": "销售部",
          "hire": "2024-12-05"
        },
        {
          "name": "颜珍香",
          "dept": "service",
          "sub": "售后部",
          "hire": "2012-03-08"
        },
        {
          "name": "马振宇",
          "dept": "service",
          "sub": "前台",
          "hire": "2016-07-25"
        },
        {
          "name": "梁杏珍",
          "dept": "service",
          "sub": "前台",
          "hire": "2015-08-27"
        },
        {
          "name": "吴文诗",
          "dept": "service",
          "sub": "前台",
          "hire": "2019-06-10"
        },
        {
          "name": "赖辉婵",
          "dept": "service",
          "sub": "前台",
          "hire": "2017-12-21"
        },
        {
          "name": "叶祖能",
          "dept": "service",
          "sub": "前台",
          "hire": "2016-07-08"
        },
        {
          "name": "杨海强",
          "dept": "service",
          "sub": "车间",
          "hire": "2014-02-07"
        },
        {
          "name": "陈世旺",
          "dept": "service",
          "sub": "前台",
          "hire": "2023-11-01"
        },
        {
          "name": "游远青",
          "dept": "service",
          "sub": "机电二组",
          "hire": "2010-01-01"
        },
        {
          "name": "谢天兴",
          "dept": "service",
          "sub": "机电三组",
          "hire": "2005-11-14"
        },
        {
          "name": "李远南",
          "dept": "service",
          "sub": "机电三组",
          "hire": "2016-09-08"
        },
        {
          "name": "朱衍兰",
          "dept": "service",
          "sub": "机电四组",
          "hire": "2010-09-26"
        },
        {
          "name": "毛淳",
          "dept": "service",
          "sub": "机电四组",
          "hire": "2016-07-01"
        },
        {
          "name": "钟步发",
          "dept": "service",
          "sub": "钣金部",
          "hire": "2014-02-16"
        },
        {
          "name": "王玉成",
          "dept": "service",
          "sub": "前台",
          "hire": "2020-07-13"
        },
        {
          "name": "伍桂林",
          "dept": "service",
          "sub": "机电三组",
          "hire": "2022-02-14"
        },
        {
          "name": "邱少嘉",
          "dept": "service",
          "sub": "售后部",
          "hire": "2015-04-01"
        },
        {
          "name": "李雪亮",
          "dept": "service",
          "sub": "售后部",
          "hire": "2023-03-30"
        },
        {
          "name": "江道威",
          "dept": "service",
          "sub": "机电二组",
          "hire": "2023-06-01"
        },
        {
          "name": "叶永桂",
          "dept": "service",
          "sub": "钣金组",
          "hire": "2024-06-01"
        },
        {
          "name": "江宇亮",
          "dept": "service",
          "sub": "售后部",
          "hire": "2024-06-29"
        },
        {
          "name": "陈日珊",
          "dept": "service",
          "sub": "售后部",
          "hire": "2024-07-03"
        },
        {
          "name": "黄明杨",
          "dept": "service",
          "sub": "售后部",
          "hire": "2024-09-21"
        },
        {
          "name": "唐瑞隆",
          "dept": "service",
          "sub": "机电一组",
          "hire": "2025-04-21"
        },
        {
          "name": "许春常",
          "dept": "service",
          "sub": "售后部",
          "hire": "2025-09-21"
        },
        {
          "name": "杨敏萍",
          "dept": "mkt",
          "sub": "市场部",
          "hire": "2017-06-10"
        },
        {
          "name": "姚晓琳",
          "dept": "mkt",
          "sub": "市场部",
          "hire": "2023-07-12"
        },
        {
          "name": "陈乐茹",
          "dept": "mkt",
          "sub": "市场部",
          "hire": "2026-07-21"
        }
      ],
      "note": "已导入奇瑞店真实员工花名册（48 人 / 7 部门）。部门按板块自动对应：销售部→销售、售后部→售后、市场部→营销、客服部→客服、人事行政部→行政、财务部→财务、总经办→总经办；二手车部花名册未含（0 人，保持待接入）。花名册仅含「部门/子组/姓名/入职日期」，无职位与手机号，故责任部门负责人暂以岗位角色（销售经理/服务经理…）表示；补充含「职位/手机号」的花名册后可自动映射到具体人员并启用企微按人提醒。",
      "departments": [
        {
          "id": "gm",
          "name": "总经办",
          "lead": "总经理",
          "parent": null,
          "duties": [
            "全局经营决策",
            "自动流审核",
            "重大客诉终审"
          ]
        },
        {
          "id": "sales",
          "name": "销售部",
          "lead": "销售经理",
          "parent": "gm",
          "duties": [
            "线索管理",
            "展厅接待",
            "战败挽回",
            "库存周转"
          ]
        },
        {
          "id": "service",
          "name": "售后部",
          "lead": "服务经理",
          "parent": "gm",
          "duties": [
            "产值达成",
            "保险维修进度",
            "在修车风险",
            "保客招揽"
          ]
        },
        {
          "id": "mkt",
          "name": "市场部",
          "lead": "新媒体运营",
          "parent": "gm",
          "duties": [
            "短视频自动流",
            "全员营销",
            "爆款素材",
            "线索承接"
          ]
        },
        {
          "id": "cs",
          "name": "客服部",
          "lead": "客服主管",
          "parent": "gm",
          "duties": [
            "客户总数管理",
            "活跃客户",
            "续保招揽",
            "流失挽回"
          ]
        },
        {
          "id": "adm",
          "name": "人事行政部",
          "lead": "行政人事经理",
          "parent": "gm",
          "duties": [
            "人员信息",
            "人均效能",
            "资产管理",
            "招聘需求"
          ]
        },
        {
          "id": "fin",
          "name": "财务部",
          "lead": "财务经理",
          "parent": "gm",
          "duties": [
            "店面资金",
            "在修车风险对账",
            "留存订单"
          ]
        },
        {
          "id": "usedcar",
          "name": "二手车部",
          "lead": "二手车经理",
          "parent": "gm",
          "duties": [
            "二手车评估",
            "二手车收购",
            "二手车出库",
            "二手车行情对标"
          ]
        }
      ],
      "headcount": 48
    },
    "dutyMatrix": [
      {
        "scope": "售后产值管理",
        "wf": "WF-01",
        "dept": "service",
        "owner": "服务经理",
        "sla": "日跟进"
      },
      {
        "scope": "保险维修进度",
        "wf": "—",
        "dept": "service",
        "owner": "保险专员",
        "sla": "超期≤7天"
      },
      {
        "scope": "在修车风险",
        "wf": "—",
        "dept": "service",
        "owner": "服务经理",
        "sla": "滞留≤15天"
      },
      {
        "scope": "售后保客/招揽",
        "wf": "WF-05",
        "dept": "cs",
        "owner": "客服主管",
        "sla": "周招揽"
      },
      {
        "scope": "客诉分级",
        "wf": "WF-06",
        "dept": "cs",
        "owner": "客服主管",
        "sla": "L1 2h / L2 4h"
      },
      {
        "scope": "线索建档",
        "wf": "WF-03",
        "dept": "sales",
        "owner": "DCC主管",
        "sla": "H/A 15min"
      },
      {
        "scope": "短视频自动流",
        "wf": "WF-04",
        "dept": "mkt",
        "owner": "新媒体运营",
        "sla": "按发布计划"
      },
      {
        "scope": "全员营销",
        "wf": "—",
        "dept": "mkt",
        "owner": "新媒体运营",
        "sla": "日分发"
      },
      {
        "scope": "人均效能",
        "wf": "WF-02",
        "dept": "adm",
        "owner": "行政人事经理",
        "sla": "月"
      },
      {
        "scope": "店面资金",
        "wf": "—",
        "dept": "fin",
        "owner": "财务经理",
        "sla": "日"
      },
      {
        "scope": "二手车评估明细",
        "wf": "—",
        "dept": "usedcar",
        "owner": "二手车评估师",
        "sla": "当日出报告"
      },
      {
        "scope": "二手车收购明细",
        "wf": "—",
        "dept": "usedcar",
        "owner": "二手车收购专员",
        "sla": "收购当日入账"
      },
      {
        "scope": "二手车出库明细",
        "wf": "—",
        "dept": "usedcar",
        "owner": "二手车销售",
        "sla": "出库即结算"
      },
      {
        "scope": "二手车概况分析",
        "wf": "WF-01",
        "dept": "usedcar",
        "owner": "二手车经理",
        "sla": "周对标"
      }
    ],
    "loops": {
      "templates": [
        {
          "id": "T-ins-overdue",
          "title": "保险维修超期滞留清理",
          "trigger": "ABS V_R_Service_Status 超期清单",
          "dept": "service",
          "owner": "保险专员",
          "slaHours": 168,
          "remindHours": [
            24,
            72
          ],
          "form": [
            "处理结果",
            "已收款/理赔回款",
            "客户确认"
          ]
        },
        {
          "id": "T-inrepair-risk",
          "title": "在修车风险滞留核查",
          "trigger": "ABS 在修车超 15 天",
          "dept": "service",
          "owner": "服务经理",
          "slaHours": 360,
          "remindHours": [
            48,
            120
          ],
          "form": [
            "滞留原因",
            "预计交车",
            "客户安抚"
          ]
        },
        {
          "id": "T-complaint",
          "title": "客诉分级闭环",
          "trigger": "WF-06 客诉分级 L1/L2",
          "dept": "cs",
          "owner": "客服主管",
          "slaHours": 4,
          "remindHours": [
            1,
            2
          ],
          "form": [
            "处理方案",
            "客户满意度",
            "根因"
          ]
        },
        {
          "id": "T-lead-timeout",
          "title": "线索超时未首触",
          "trigger": "WF-03 H/A 级 15min 超时",
          "dept": "sales",
          "owner": "DCC主管",
          "slaHours": 1,
          "remindHours": [
            0.25,
            0.5
          ],
          "form": [
            "首触方式",
            "意向等级",
            "下次跟进"
          ]
        },
        {
          "id": "T-active-churn",
          "title": "活跃客户下滑招揽",
          "trigger": "客服活跃客户环比 -10.9%",
          "dept": "cs",
          "owner": "客服主管",
          "slaHours": 72,
          "remindHours": [
            24
          ],
          "form": [
            "招揽活动",
            "触达人数",
            "到店转化"
          ]
        },
        {
          "id": "T-uc-stock",
          "title": "二手车超期库存预警",
          "trigger": "ABS V_UC_Stock 库存超 45 天",
          "dept": "usedcar",
          "owner": "二手车经理",
          "slaHours": 720,
          "remindHours": [
            120,
            360
          ],
          "form": [
            "滞留原因",
            "降价/置换方案",
            "预计周转天数"
          ]
        },
        {
          "id": "T-uc-margin",
          "title": "二手车毛利异常核查",
          "trigger": "ABS V_UC_Sale 单车毛利低于阈值",
          "dept": "usedcar",
          "owner": "二手车经理",
          "slaHours": 168,
          "remindHours": [
            48
          ],
          "form": [
            "毛利偏差",
            "收购价复核",
            "车源渠道核查"
          ]
        }
      ],
      "samples": [
        {
          "id": "L-2026-0813-01",
          "tpl": "T-inrepair-risk",
          "title": "在修车风险滞留核查（示例）",
          "trigger": "ABS 在修车超 15 天 · 示例",
          "dept": "service",
          "owner": "服务经理",
          "slaHours": 360,
          "remindHours": [
            48,
            120
          ],
          "createdAt": "2026-08-13T09:00",
          "dueAt": "2026-08-16T09:00",
          "status": "open",
          "history": []
        },
        {
          "id": "L-2026-0813-02",
          "tpl": "T-ins-overdue",
          "title": "保险维修超期滞留清理（示例）",
          "trigger": "ABS 超期清单 · 示例",
          "dept": "service",
          "owner": "保险专员",
          "slaHours": 168,
          "remindHours": [
            24,
            72
          ],
          "createdAt": "2026-08-13T10:00",
          "dueAt": "2026-08-13T08:00",
          "status": "handling",
          "history": [
            {
              "at": "2026-08-13T10:30",
              "by": "保险专员",
              "act": "claim",
              "note": "已认领，正在核对定损金额"
            }
          ]
        },
        {
          "id": "L-2026-0813-03",
          "tpl": "T-complaint",
          "title": "客诉分级闭环 L2（示例）",
          "trigger": "WF-06 客诉分级 L2 · 示例",
          "dept": "cs",
          "owner": "客服主管",
          "slaHours": 4,
          "remindHours": [
            1,
            2
          ],
          "createdAt": "2026-08-13T13:20",
          "dueAt": "2026-08-13T17:20",
          "status": "open",
          "history": []
        }
      ]
    }
  },
  "moduleStatusOverride": {}
};
