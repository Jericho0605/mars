# DriveWise 真实车型数据包

本包面向美国市场，所有车型是实际 EPA 记录，不包含虚构 DNA 车型。采集日期：2026-10-16。**3,722 条是 EPA 车辆配置记录，不等于 3,722 个独立车型或销售配置。** 当前年款范围为 2024–2026，50 个品牌；2026 数据只代表此下载快照，不保证最终完整。

## 文件怎么用

- `vehicles-2024-2026.json`：3,722 条标准化能耗记录，适合车型搜索、按驱动/动力形式筛选和能耗计算。未人工核对的销售 trim、价格、座位、电池容量、接口都保留 `null`。
- `curated-2025.json`：9 条人工核对销售配置与 MSRP 的种子数据，保留 EPA 能耗和逐项来源。可用于历史基础 MSRP 对比，不能用于保证当前落地预算。
- `curated-overrides.json`：人工维护的价格和 trim 对照；重新生成不会被覆盖。
- `vehicles.sqlite`：SQLite 数据库，`vehicles` 是基础表，`curated` 是价格补充表，均用 `epa_id` 连接。每行 `data_json` 包含完整字段。
- `车型数据预览.md`：9 条种子数据的可读版本。
- `quality-report.json`：条数、年份、动力类型、缺失字段、原始文件 SHA-256 和采集时间。
- `raw/vehicles.csv.zip`：官方原始快照，50,407 条，保留全部原始字段供审计；正常推荐建议只读整理后的 JSON。
- `build_data.py`：离线重建 JSON、SQLite、质量报告，只使用 Python 标准库。
- `test_data.py`：8 项数据校验。

## 可信边界

1. 能耗统一来自 FuelEconomy.gov / EPA，保留 `epa_id`、单车 API 链接、官方修改日期；原始 CSV 是唯一自动生成输入。
2. EPA 记录通常是能耗认证配置组，不一定对应唯一销售 trim。价格只通过人工明确映射写入种子表，不采用模糊车型名自动拼接。
3. 价格是来源页面对应年款的基础 MSRP：不含税、牌照、选装、经销商加价和目的地费用。Nissan LEAF 的目的地费用另列，其余未核实的目的地费用为空。同一年款不同时间的价格可能调整，种子表可能是发布时价格或年款页面价格，不保证同一天生效。
4. `price_verified_on` 表示本次核对日期，不是报价生效日期。所有 `current_market_price_usd` 为空。没有抓取当前库存、二手车成交价、VIN 或实时优惠。
5. `base_msrp_filter_ready` 在种子表表示可按基础 MSRP 筛选；`budget_filter_ready` 仍为 false，不能代表当前落地预算通过。`seat_filter_ready` 为 false，不能把未知座位默认成 5。
6. 未核实座位数、真实可用电池容量、充电接口、快充曲线、维修成本、保险费、残值和可靠性分数。不要把缺失值自动填为 0，也不要据此宣称完整精准推荐。
7. 数据来自测试工况；真实能耗受温度、速度、载重和充电习惯影响。未知字段和数据冲突在 `quality_flags` 中显式保留。

## 单位与关键字段

| 字段 | 定义 |
|---|---|
| `market` / `model_year` | 美国市场 / 年款；不是首次注册年份 |
| `epa_id` | 官方记录主键；不要仅按 make + model 去重 |
| `sales_trim` | 人工核实的销售配置；基础库为空 |
| `powertrain` | GASOLINE / HEV / PHEV / BEV / DIESEL / FLEX_FUEL / FCEV |
| `drive` / `transmission` | 保留官方驱动形式和变速箱标识 |
| `fuel_primary` / `fuel_secondary` | 原始主/次燃料名称；保留燃油标号 |
| `fuel_mpg_city/highway/combined` | 美制 MPG；纯电与氢能不填此项，插混为主燃料/保持电量模式，不是油电综合 MPG |
| `fuel_l_per_100km` | 235.214583 ÷ 美制 MPG；按三位小数导出 |
| `ev_mpge_combined` | 纯电能量等效 MPG，不能作为汽油 MPG 计算油费 |
| `electric_kwh_per_100mi` | EPA `combE`；插混为耗电模式的电耗，不是整个年度平均电耗 |
| `electric_kwh_per_100km` | 上一字段 ÷ 1.609344 |
| `bev_range_mi/km` | 仅纯电 EPA 续航；不用于燃油车 |
| `phev_charge_depleting_range_mi` | 插混 EPA `rangeA`；不能直接保证发动机完全不启动 |
| `phev_blended` | 官方混合运行标志，原样保留 |
| `phev_cd_gal_per_100mi` | 插混耗电模式中仍消耗的汽油量；0 是有效值，不能转成缺失 |
| `phev_epa_utility_factor` | EPA 统计工况电力占比，不代表某个用户实际占比 |
| `epa_charge240_hours` | 官方 240V 充电时间，缺失/零占位转 null；不是 DC 10–80% 快充时间 |
| `epa_primary_tailpipe_co2_g_per_mi` | 官方主燃料尾气 CO₂，不含发电、燃油上游或制造；纯电值 0 不表示全生命周期零排放 |
| `base_msrp_usd` / `destination_usd` | 历史基础指导价 / 单独核实的目的地费用 |
| `current_market_price_usd` | 当前成交或报价，未采集，因此为空 |
| `field_sources` | 种子表字段组来源；基础表的实际非空参数来自单车 EPA API / 下载快照 |
| `trim_mapping_note` | 人工匹配理由及配置差异 |

EPA 对 FCEV 的字段另有氢耗口径，未强行转换成燃油/纯电经济性。FLEX_FUEL 的标准化 MPG 仅保留主燃料，次燃料数值仍在原始文件中。电池容量、座位、尺寸和可用空间无法从 EPA 分类字段可靠推算。

## 已确认的冲突

2025 Prius Plug-in Hybrid SE：厂家早期公布电动续航 44 mi，本次 EPA 数据 `rangeA` 为 45 mi。种子表同时保留两值和各自来源，不静默覆盖。EPA 同时标记 `phevBlended=true`，因此字段名称明确使用 charge-depleting range。

## 接入示例

```python
import json
from pathlib import Path
root = Path('outputs/vehicle-data')
cars = json.loads((root / 'curated-2025.json').read_text())
# 这里只筛历史基础 MSRP，不是当前落地预算。
candidates = [c for c in cars if c['base_msrp_usd'] is not None
              and c['base_msrp_usd'] <= 35000]
```

```sql
SELECT v.epa_id, v.make, v.model, c.sales_trim, c.base_msrp_usd
FROM vehicles v JOIN curated c USING (epa_id)
WHERE c.base_msrp_usd <= 35000 ORDER BY c.base_msrp_usd;
```

重新生成和验证：在本文件目录执行 `python3 build_data.py` 和 `python3 -m unittest test_data.py -v`。更新官方快照时，先把新下载存入不同文件，比较 ID、参数变化和人工映射，再替换；不要将下载成功等同于全部价格更新成功。

主要资料：[FuelEconomy.gov 下载与字段文档](https://www.fueleconomy.gov/feg/ws/index.shtml)。每个种子车型的厂家链接见预览表及 JSON。官方库不提供完整实时售价，不存在一份可直接替代所有价格、座位、售后信息的万能表。
