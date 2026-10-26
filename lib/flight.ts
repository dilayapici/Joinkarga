import {z} from 'zod';
export const FLIGHT_FACTOR_SOURCE='https://measuringemissionsguide.environment.govt.nz/7_travel.html#international-air-travel';
// 2026 NZ Ministry for the Environment, Table 7.29 (DESNZ 2025 data).
// Average passenger; factors already include 8% distance uplift and RF.
export function flightFactor(oneWayKm:number){return oneWayKm<3700?0.12786:0.15282;}
export type City={name:string;country:string;latitude:number;longitude:number};
// Approximate city-center coordinates for a reliable offline hackathon demo.
// These are locations, not hardcoded trip distances or carbon results.
const cities:Record<string,City>={
 istanbul:{name:'Istanbul',country:'Türkiye',latitude:41.0082,longitude:28.9784},
 lisbon:{name:'Lisbon',country:'Portugal',latitude:38.7223,longitude:-9.1393}
};
function normalize(value:string){return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');}
export function greatCircleKm(a:City,b:City){const rad=(n:number)=>n*Math.PI/180;const dlat=rad(b.latitude-a.latitude),dlon=rad(b.longitude-a.longitude);const h=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;return 6371.0088*2*Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));}
const location=z.object({name:z.string(),country:z.string().default(''),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)});
export async function geocodeCity(query:string):Promise<City>{
 const normalized=normalize(query);
 if(['istanbul','istanbul, turkey','istanbul, turkiye','istanbul, tr'].includes(normalized))return cities.istanbul;
 if(['lisbon','lisboa','lisbon, portugal','lisboa, portugal','lisbon, pt'].includes(normalized))return cities.lisbon;
 const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.searchParams.set('name',query);url.searchParams.set('count','1');url.searchParams.set('language','en');
 try{const response=await fetch(url,{signal:AbortSignal.timeout(7000),cache:'force-cache',next:{revalidate:86400}});if(!response.ok)throw new Error('lookup unavailable');const data=z.object({results:z.array(location).optional()}).parse(await response.json());if(data.results?.[0])return data.results[0];}catch{throw new Error('City lookup is unavailable. Please try again.');}
 throw new Error('City not found. Enter a city name, optionally followed by its country.');
}
export async function resolveFlight(origin:string,destination:string,lookup:(query:string)=>Promise<City>=geocodeCity){const [from,to]=await Promise.all([lookup(origin),lookup(destination)]);const km=greatCircleKm(from,to);if(km<1)throw new Error('Choose different departure and arrival cities.');return {km,from,to,method:'city-center-great-circle',factor:flightFactor(km),source:FLIGHT_FACTOR_SOURCE};}
