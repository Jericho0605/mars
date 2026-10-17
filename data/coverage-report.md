# DriveWise US / California database V3

Generated: 2026-10-16T20:09:47.940Z

## Actual scope

- 3710 real EPA test configurations.
- 897 make + EPA baseModel + year groups; 356 case-insensitive make + EPA baseModel groups.
- 38 verified retail trim keys; 12 model-year groups contain at least one verified retail trim.
- 40 Recommendation-Ready configurations across 12 model-year groups.
- Licensed real photos cover 6 model-year groups. Generic illustrations are excluded.

**The 300-group EPA identity inventory is not a claim that 300 models have verified retail trims, MSRP or licensed photos. Those latter targets are not complete.** EPA baseModel groups can be coarser than marketing model names. Original EPA model labels and IDs are preserved per configuration.

## Coverage (all configurations)

|Field|Valid|Missing|Coverage|
|---|---:|---:|---:|
|Trim MSRP|40|3670|1.08%|
|Horsepower|36|3674|0.97%|
|Torque|16|3694|0.43%|
|0–60 mph|2|3708|0.05%|
|MPG|2797|913|75.39%|
|MPGe|1035|2675|27.90%|
|EPA electric range|1035|2675|27.90%|
|Seating|1133|2577|30.54%|
|Cargo (manufacturer or separately scoped EPA volume)|1500|2210|40.43%|
|NHTSA overall rating|712|2998|19.19%|
|Licensed real image|23|3687|0.62%|
|Any official link|413|3297|11.13%|
|Official model introduction page|15|3695|0.40%|
|Official specs page|40|3670|1.08%|
|Official inventory search|395|3315|10.65%|

All fields, brands, body styles and powertrains are enumerated in coverage-report.json. Per-year trims and actual configuration IDs are in model-year-index.json. Missing and non-applicable values remain null; percentages use the full configuration denominator.

## Provenance and applicability

EPA figures are retained at their actual test-configuration scope. Manufacturer values remain bound to their reviewed year/trim/engine/drivetrain. EPA luggage volume is a rounded certification interior-volume measurement and may differ from manufacturer cargo capacity. Where a reviewed manufacturer value exists, it is retained and the EPA observation is recorded as a conflict rather than silently overwritten. Torque, lengths, masses and volumes retain original units and conversion factors. No estimated acceleration, insurance, resale, tax or California electricity emissions are invented. EPA annual fuel costs use EPA reference assumptions, not a user quote.

NHTSA safety import requires make, exact model or an explicit reviewed alias, year, drivetrain and compatible body. All release records must agree on each scalar value; variable seats, conflicting ratings and release-specific bodies are not propagated. No frontal test curb weight is treated as the weight of every trim. Unknown ratings are not defaulted to five stars.

## Remaining gaps

- 300 individually verified retail-trim model-year groups and 300 licensed-photo model-year groups remain unmet.
- Most MSRP, horsepower, torque, charging, warranty and ownership fields need OEM/appropriately licensed enrichment.
- NHTSA vPIC can confirm model identities but does not supply general MSRP, trim specifications or current inventory.
- No live California dealer inventory or actual purchase availability verified. Brand-level inventory links do not assert model-year stock.
- Every field with no current values: startingMsrpUsd, topSpeedMph, towingCapacityLb, manufacturerEstimatedRangeMiles, usableBatteryCapacityKwh, acChargingPowerKw, dcFastChargingPeakKw, charging10To80Minutes, curbWeightLb, turningRadiusFt, maxCargoVolumeCuFt, doors, maintenanceEstimateUsd, insuranceEstimateUsd, depreciationEstimateUsd, resaleValueEstimateUsd, fiveYearOwnershipCostUsd, annualEstimatedCo2Kg, chargingConnector, chargingTimeDescription, iihsRating, warranty, batteryWarranty, fuelEconomyClassification, msrpEffectiveDate, currentAvailabilityStatus, californiaAvailabilityStatus, officialBuildAndPricePage, verifiedDealerListing.

No frontend, recommendation engine, Car DNA, existing server routes or original EPA database was changed by the V3 build.
