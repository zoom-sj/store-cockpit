# DBA 操作手册 · 一键点亮「保险维修进度 + 在修车风险」

> 目标：用 **一条只读视图**，让工作台财务/售后两个模块从 `partial` 直接转 `live`。
> 耗时：ABS 管理员约 **3–5 分钟**。无需改任何前端代码（业务侧已就绪）。

---

## 为什么这是"最快见效"

- **只读、不含 PII**：视图只暴露 工单号 / VIN / 状态 / 时间 / 金额，**没有客户姓名、电话、身份证**，合规风险最低，最容易批。
- **一次授权，点亮两个模块**：`保险维修进度（service.insurance）` 与 `在修车风险（fin.risk）` 共用同一份视图。
- **零前端改动**：WorkBuddy 侧的取数 SQL、图表、三级预警、状态翻转逻辑已全部写好，DBA 建完视图我拉数即生效。

---

## 操作步骤（DBA）

### ① 探查真实列名（1 分钟）
打开 `scripts/DDL_V_R_Service_Status.sql`，先跑 **第 0 步** 的
```sql
SELECT TOP 1 * FROM dbo.维修工单主表 WITH (NOLOCK);
```
把【维修工单主表】的真实表名和各列名记下来（不同版本 ABS 列名可能不同）。

### ② 建视图 + 授权（1 分钟）
按第 0 步查到的真实列名，**替换模板中的占位列名**，执行 **第 1、2 步**：
```sql
CREATE VIEW dbo.V_R_Service_Status AS
SELECT 工单号 AS order_no, VIN AS vin, 进厂日期 AS in_date, 当前节点 AS node,
       完工时间 AS done_time, 交车时间 AS delivery_time,
       定损金额 AS assess_amt, 预估维修款 AS est_repair, 已收金额 AS received,
       理赔回款日期 AS claim_paid
FROM dbo.维修工单主表 WITH (NOLOCK)
WHERE 进厂日期 >= DATEADD(DAY, -92, GETDATE());

GRANT SELECT ON dbo.V_R_Service_Status TO [ABS_ReadOnly];
```
> ⚠️ `交车时间 IS NULL` = 当前在修；`理赔回款日期 IS NULL` = 未回款。语义必须保留。

### ③ 通知 WorkBuddy
把视图名 **`V_R_Service_Status`** 告诉 WorkBuddy（或直接说"视图已建好"）。
→ WorkBuddy 会用 SQL 文件第 3 步的查询取数 → 运行 `pull_service_status.js` → 两个模块自动转 `live`，并在企业微信推送"已点亮"通知。

---

## 取数结果形状（WorkBuddy 侧消费，DBA 无需关心）

```json
{
  "asOf": "2026-08-13",
  "inRepair": {
    "total": 9,
    "overdue": { "d15": 3, "d30": 1, "d60": 0 },
    "byNode": [ { "node": "维修中", "cnt": 5, "avgStayDays": 8.3 } ],
    "topStuck": [ { "order_no": "G...", "vin": "L...", "node": "等配件", "stayDays": 42, "estRepair": 5800, "unpaid": 3000, "reason": "等配件" } ]
  },
  "insurance": {
    "openTotal": 7,
    "byNode": [ { "node": "理赔回款中", "cnt": 5 } ],
    "assessAmt": 42000, "received": 15000, "estRepair": 58000, "unpaid": 43000,
    "claimAging": [ { "bucket": "30天内", "cnt": 3 }, { "bucket": "30-60天", "cnt": 2 } ]
  }
}
```

---

## 回滚

`DROP VIEW dbo.V_R_Service_Status;` —— 模块自动回落到 `partial`（仅事故维修结算真数），不影响其他功能。

---

## 联动提醒

- 此视图可与 `adm.efficiency`（技师工时）一并申请，顺带把人均效能的"技师产能"也点亮。
- 取数统一走 `hdhr-abs-connector`，遵循护栏：NOLOCK / TOP 5000 / 30s 超时 / 避开 08:30–18:30 营业高峰。
