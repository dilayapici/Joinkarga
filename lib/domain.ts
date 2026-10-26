export const actions = [
 {id:'cup', points:25, en:'Bring your own cup', sub:'A small switch. A lasting difference.', icon:'coffee'},
 {id:'bottle', points:30, en:'Refill, don’t landfill', sub:'Refill your reusable water bottle.',icon:'bottle'},
 {id:'transit', points:50, en:'Take the greener route', sub:'Walk, cycle, or take public transport.',icon:'bike'}
] as const;
export function footprint(cups:number,bottles:number,km:number,mode:string){return cups*0.06+bottles*0.083+km*({car:0.171,bus:0.105,rail:0.035,bike:0,walk:0}[mode]??0);}
