import {z} from 'zod';
import {footprint} from './domain';
import {flightFactor} from './flight';
export const journeySchema=z.object({
 origin:z.string().trim().min(2,'Enter where you traveled from.').max(120),
 destination:z.string().trim().min(2,'Enter where you traveled to.').max(120),
 km:z.number().positive().max(21000).nullable().optional(),
 roundTrip:z.boolean(),
 mode:z.enum(['car','bus','rail','bike','walk','plane']),
 cups:z.number().int().min(0).max(100),
 bottles:z.number().int().min(0).max(100)
});
export type JourneyInput=z.infer<typeof journeySchema>;
export type SavedJourney={origin:string|null;destination:string|null;one_way_km:number|null;round_trip:boolean|null;mode:string|null;cups:number|null;bottles:number|null;kg:number|null;updated_at:string};
export function journeyEstimate(input:JourneyInput){
 const distanceKm=input.km==null?null:input.km*(input.roundTrip?2:1);
 const transportKg=distanceKm===null?null:input.mode==='plane'?distanceKm*flightFactor(input.km!):footprint(0,0,distanceKm,input.mode);
 const consumablesKg=footprint(input.cups,input.bottles,0,'walk');
 return {distanceKm,transportKg,consumablesKg,kg:transportKg===null?null:transportKg+consumablesKg};
}
