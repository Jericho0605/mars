// Source-specific publication facts reviewed in the manufacturer's dated US price tables.
// Never apply a fee by make/year alone or to a different price publication.
const publications=[
 ['release-d73d9911716c8277bb60a27897015f1e-2025-honda-civic-sedan-pricing-and-epa-ratings-2025',1150,'2025-01-03'],
 ['release-d73d9911716c8277bb60a278970139ac-2025-honda-civic-hatchback-pricing-and-epa-ratings-2025',1150,'2025-01-03'],
 ['release-d73d9911716c8277bb60a2789701d8f5-2025-honda-cr-v-pricing-and-epa-ratings-2025',1395,'2025-01-03'],
 ['release-e888887b6471c0aba407829ba700187c-2024-honda-cr-v-pricing-and-epa-ratings',1325,'2023-07-07'],
 ['release-008e554add341b8444085beaa206f3f9-new-2025-honda-accord-se-adds-sporty-styling-and-standard-tech-features-begins-arriving-at-honda-dealers-today',1095,'2024-09-16'],
 ['release-a0290fb377b9a07ba1686b6591082f20-2025-honda-civic-type-r-pricing-and-epa-ratings',1095,'2024-10-30'],
 ['/2025-honda-civic-si-heats-up-summer-with-more-aggressive-styling-leading-edge-technology-improved-dynamics-and-new-heated-front-seats',1095,'2024-07-23']
];
export function enrichPublicationPricing(records){for(const v of records){if(!v.sources.msrpUsd)continue;const source=v.sources.msrpUsd,match=publications.find(([slug])=>source.url.endsWith(slug));if(!match)continue;const[,fee,date]=match;v.destinationFeeUsd=fee;v.sources.destinationFeeUsd={...source,rawValue:fee,rawUnit:'USD',unit:'USD',evidence:'Destination charge explicitly stated in the same dated US MSRP publication; not included in base MSRP',scope:'Same price table as this reviewed retail configuration'};v.pricePublicationDate=date;v.sources.pricePublicationDate={...source,rawValue:date,rawUnit:'ISO date',unit:'ISO date',scope:'Publication date for the historical price snapshot, not an assertion the price remains valid today'};}}
