# DriveWise Vehicle Database V3

本次仅新增独立数据库与采集工具。原有 3,654 条 EPA 数据、下载清洗模块、网站、API、推荐器与 Car DNA 均保持原样。V3 不自动接入线上推荐，以免缺失价格或 Trim 的记录进入现有推荐链路。

## 实际完成范围

V3 有 3,710 条真实 EPA 配置，新增 56 条柴油配置。按 EPA 官方 baseModel、品牌和年份去重为 897 组，跨年份去重为 356 组；这些车型组已在原始 EPA 数据内存在，新增车型年份组为 0。该口径有时比厂商销售车系更宽，不将 EPA 原始名称中的轮胎、驱动和动力差异当作新车型。

**尚未完成 300 个具有真实零售 Trim 和合法照片的完整车型年份。** 目前 12 个车型年份有厂商核实 Trim，38 个 Trim 键对应 40 条配置；Recommendation-Ready 为 40 条。合法、同年款真实照片覆盖 6 个车型年份、23 条配置。未核实 Trim 保持 null，不从 EPA 配置名猜测零售配置。

字段覆盖率与缺口见 [覆盖报告](../coverage-report.md)、[机器报告](../coverage-report.json)。各组实际配置 ID、Trim 及就绪数量见 [车型年份索引](../model-year-index.json)。共有 108 条来源或适用范围冲突保留在 conflicts.json，不挑选更好看的数值。

## 结构与数据适用范围

- vehicles-v3.json / vehicles-v3.csv：稳定 EPA ID、完整参数、字段来源、单位、图片、用途明确的外链及冲突。vehicle-schema-v3.json 为导出结构；src/v3/schema.js 还执行跨字段、来源和图片适用性校验。
- 身份、能耗、续航与排放来自原有 EPA CSV。纯电车只填 MPGe，不冒充 MPG；PHEV 分开保留液体燃料与电力指标。EPA 年燃料费用是参考假设，非个人报价。
- NHTSA 官方批量数据用于座位与碰撞评级，严格匹配年份、车型、车身及驱动。只有所有适用测试记录一致才填标量；例如 7 或 8 座、不同发布版评分冲突均不强行取值。没有评级不填默认五星。
- vPIC 缓存覆盖 20 个品牌、60 个品牌年份查询；2,110 条配置有精确 baseModel / 年份匹配。它仅补充身份确认，不能据此推断 Trim、价格或加州库存。
- EPA 货舱数据是四舍五入的认证内部容积，保留其测量范围，不能与厂商最大装载容积混用。已有厂商参数保持优先，冲突另记。
- 金额 USD，长度 in，重量 lb，容积 ft³，扭矩 lb-ft，里程 mi，电池 kWh，充电功率 kW，油耗 mpg-US。转换保留原值、原单位及系数；未知为 null，不变成 0。
- 历史厂商 MSRP 与目的地费用分开。pricePublicationDate 仅表示发布日，不冒充 msrpEffectiveDate。dealer advertised price、estimate 和 manufacturer MSRP 有独立类型。
- 官方链接分车型介绍、规格、配置器、库存搜索、真实经销商车源。21 个既有官方 URL 已通过 HTTP 检查；品牌级库存入口复用于多个记录，不代表这些年份在售或有加州库存。
- 图片仅复用已有明确授权且品牌、车型、年份相符的真实照片；记录来源、许可、署名、本地文件 SHA-256。通用示意图及无明确复用授权的厂商图片不计真实照片。未宣称精确 Trim、颜色匹配。
- 缺少可靠来源的充电、质保、保险、折旧、拥有成本等保留空值。估算批次必须附方法与假设；不生成加州用户保险报价或电网排放默认值。

## 可重复运行命令

在仓库根目录使用 Node.js 22+，无需新增依赖：

```powershell
node scripts/vehicle-data-v3.js fetch-safety
node scripts/vehicle-data-v3.js fetch-vpic --makes=Toyota,Honda,Ford,Chevrolet,Hyundai,Kia,Nissan,Mazda,Subaru,Tesla,Lexus,Volkswagen,Mercedes-Benz,Audi,BMW,GMC,Rivian,Lucid,Volvo,Chrysler
node scripts/vehicle-data-v3.js check-links
node scripts/vehicle-data-v3.js build
node --test --experimental-test-isolation=none
```

缓存和检查点会避免重复请求；build 对输入与输出 SHA-256 均未变化时跳过重复处理。fetch 命令加 --refresh 才主动重取；build --force 强制重建。请求串行限速约 1.1 秒、超时 25 秒、最多重试两次；401/403 不重试或绕过，429 尊重 Retry-After，较长等待交由下一次运行继续。缓存校验失败会停止，不静默采用损坏数据。日志在 data/v3/cache/http/requests.jsonl。

raw EPA CSV 沿用现有下载器，V3 不重复下载。NHTSA 与 HTTP 原始响应缓存不提交仓库，首次运行先 fetch-safety；vPIC 查询与链接检查点随数据保留。重建时来源缺少会反映到覆盖率，不制造来源。导出快照可直接读取，原 API 的数据文件不被替换。

## 人工增量补充

使用 manual-template.json 作为结构说明，另建一个真实条目的 JSON 数组；模板本身不是车辆记录，不可导入。复制 V3 的精确 ID 与 match 身份，逐字段填写官方 URL、获取日、证据、年份/Trim 适用范围、原始单位与转换信息。已核实新增 Trim 还需 trimStatus=manufacturer-verified 及其证据。图片必须附合法许可、正确身份与已验证文件校验信息。

```powershell
node scripts/vehicle-data-v3.js import reviewed.json
node scripts/vehicle-data-v3.js build
```

import 在完整身份和全库校验通过后，登记带内容哈希的批次；相同批次不会重复登记。现有值发生冲突时保留原值并写审计，不静默覆盖高可信参数。待补充记录见 enrichment-queue.json。当前批次工具只丰富已有 EPA 配置，不制造新 ID 或占位车型。

## 后续数据来源

source-research.json 记录已核实来源与限制。CarAPI 当前 Premium 为 $299/年、6,000 次/日，提供 1990–2027 年 Trim/规格；Base $199/年、Plus $249/年不包含这些规格。其条款限制批量独立数据再分发；不能直接假设允许导出可分发数据库。本次未订阅、未提供密钥或导入商业数据。授权照片仍需要补充有明确展示许可的来源。

研究来源：[EPA](https://www.fueleconomy.gov/feg/ws/index.shtml)、[NHTSA](https://www.nhtsa.gov/nhtsa-datasets-and-apis)、[vPIC](https://vpic.nhtsa.dot.gov/api/)、[CarAPI 价格](https://carapi.app/pricing/)、[CarAPI 条款](https://carapi.app/terms-of-use/)。所有在线核查日期与原始证据在对应记录内保留。
