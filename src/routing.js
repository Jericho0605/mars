export async function roadRoute(input,{fetchImpl=fetch}={}) {
 if(input?.consent!==true)throw Error('Explicit location-sharing consent required');
 const points=[input.origin,input.destination];
 for(const point of points)if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||Math.abs(point[0])>180||Math.abs(point[1])>90)throw Error('Coordinates must be [longitude, latitude]');
 const url=`https://router.project-osrm.org/route/v1/driving/${points.map(p=>p.join(',')).join(';')}?overview=simplified&geometries=geojson&steps=false`;
 let response;try{response=await fetchImpl(url,{signal:AbortSignal.timeout(15000)});}catch{throw Error('Road routing unavailable; use manual commute distance');}
 if(!response.ok)throw Error('Road routing service unavailable');
 const data=await response.json(),route=data.routes?.[0];
 if(data.code!=='Ok'||!Number.isFinite(route?.distance)||!Number.isFinite(route?.duration)||route.distance<0||route.duration<0||route.geometry?.type!=='LineString'||!Array.isArray(route.geometry.coordinates))throw Error('No verified road route returned');
 return {oneWayMiles:route.distance/1609.344,roundTripMiles:2*route.distance/1609.344,oneWayMinutes:route.duration/60,geometry:route.geometry,type:'road-route',provider:'OSRM public demonstration server / OpenStreetMap',retrievedAt:new Date().toISOString(),traffic:'static routing estimate; not live traffic',privacy:'Coordinates sent to OSRM only after consent; this app does not persist or log them. No station availability information.'};
}
