export const inventoryRegistry=[
 {make:'Toyota',url:'https://www.toyota.com/search-inventory/',scope:'Brand-wide official inventory search; model/year not preselected; no stock assertion'},
 {make:'Nissan',url:'https://www.nissanusa.com/shopping-tools/search-inventory',scope:'Brand-wide official inventory search; model/year not preselected; no stock assertion'},
 {make:'Ford',model:'Maverick',url:'https://www.ford.com/inventory/maverick/',scope:'Official Maverick inventory search; historical model year/trim not preselected; no stock assertion'}
];
export function enrichExistingLinks(records,checks={}){for(const v of records){const match=inventoryRegistry.find(r=>r.make===v.make&&(!r.model||r.model===v.model));if(match){const check=checks[match.url]??{status:'not-checked-this-run'};if(check.status===404||check.status===410)continue;v.officialLinks.inventorySearchPage={url:match.url,scope:match.scope,purpose:'inventory-search',source:'Existing DriveWise explicitly reviewed official inventory link registry; not a guessed URL',verification:check};}for(const link of Object.values(v.officialLinks))if(link?.url){link.verification??=checks[link.url]??{status:'not-checked-this-run'};}}}
