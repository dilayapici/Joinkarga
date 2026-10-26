import type {JourneyInput,SavedJourney} from './journey';
export const emptyJourney=():JourneyInput=>({origin:'',destination:'',km:null,roundTrip:false,mode:'plane',cups:0,bottles:0});
export function journeyAfterSignIn(draft:JourneyInput|null,saved:SavedJourney|null){
 if(draft&&(draft.origin.trim()||draft.destination.trim()))return {journey:{...draft},saved:false,restoredDraft:true};
 if(saved?.origin&&saved.destination&&['plane','car','bus','rail','bike','walk'].includes(saved.mode??''))return {journey:{origin:saved.origin,destination:saved.destination,km:saved.one_way_km,roundTrip:saved.round_trip??false,mode:saved.mode as JourneyInput['mode'],cups:saved.cups??0,bottles:saved.bottles??0},saved:true,restoredDraft:false};
 return {journey:emptyJourney(),saved:false,restoredDraft:false};
}
