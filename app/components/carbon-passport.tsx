'use client';

import {useId,useState} from 'react';
import {ArrowDownToLine,ArrowRight,ArrowUpRight,Bike,Bus,Car,Check,CheckCheck,Coffee,Droplets,Footprints,Gift,Leaf,MapPin,Plane,ScanLine,ShieldCheck,Sparkles,TrainFront} from 'lucide-react';
import {actions} from '@/lib/domain';
import {journeyEstimate,type JourneyInput} from '@/lib/journey';
import './carbon-passport.css';

type Verification={id:string;action:string;points:number;verified_at:string|null};
type Props={
 me:{id:string;name:string}|null;
 journey:JourneyInput;
 verifications:Verification[];
 saved:boolean;
 loading:boolean;
 reward:{transaction_hash:string;confirmed_at:string|null}|null;
 onJourney:()=>void;
 onActions:()=>void;
 onRewards:()=>void;
 onExample:()=>void;
};
const modes={plane:{label:'Flight',icon:Plane},car:{label:'Car',icon:Car},bus:{label:'Bus',icon:Bus},rail:{label:'Rail / metro',icon:TrainFront},bike:{label:'Bicycle',icon:Bike},walk:{label:'Walking',icon:Footprints}};
const format=(n:number)=>n.toLocaleString('en-GB',{maximumFractionDigits:1});

export function CarbonPassport({me,journey,verifications,saved,loading,reward,onJourney,onActions,onRewards,onExample}:Props){
 const id=useId();
 const [selected,setSelected]=useState('transport');
 const hasRoute=!!journey.origin.trim()&&!!journey.destination.trim();
 const estimate=journeyEstimate(journey);
 const total=hasRoute&&!loading?estimate.kg:null;
 const verified=verifications.filter(v=>v.verified_at);
 const points=verified.reduce((sum,v)=>sum+v.points,0);
 const percent=Math.min(points,100);
 const Mode=modes[journey.mode].icon;
 const categories=[
  {id:'transport',label:'Transport',kg:hasRoute&&!loading?estimate.transportKg:null,color:'#315a48',icon:Mode,note:'Estimated emissions for your journey. Saving a route does not award Karga Points.'},
  {id:'cups',label:'Coffee cups',kg:journey.cups*.06,color:'#d0b272',icon:Coffee,note:`${journey.cups} disposable ${journey.cups===1?'cup':'cups'} recorded. Reusable-cup points require organizer verification.`},
  {id:'bottles',label:'Plastic bottles',kg:journey.bottles*.083,color:'#8da9a0',icon:Droplets,note:`${journey.bottles} plastic ${journey.bottles===1?'bottle':'bottles'} recorded. Refill points require organizer verification.`}
 ];
 const active=categories.find(c=>c.id===selected)!;
 const circumference=2*Math.PI*72;
 let offset=0;
 return <div className="carbon-passport-page">
  <div className="passport-toolbar"><div><span className="passport-label"><Leaf size={13}/> YOUR PERSONAL IMPACT RECORD</span><p>A lighter footprint starts with knowing your own.</p></div><button className="button passport-export" onClick={()=>window.print()}><ArrowDownToLine size={15}/> Save as PDF</button></div>
  <div className="passport-top-grid">
   <section className="passport-book" aria-label="Your carbon passport">
    <div className="passport-book-grain" aria-hidden="true"/>
    <div className="passport-cover-top"><span className="passport-wordmark">karga<span>.</span></span><span className="passport-state"><span/>{me&&saved?'SAVED RECORD':'DRAFT PREVIEW'}</span></div>
    <div className="passport-title"><span>SMALL ACTIONS. REAL IMPACT.</span><h2>Carbon<br/><em>passport.</em></h2><p>Your journey. Your choices. Your footprint.</p></div>
    <div className="passport-seal" aria-hidden="true"><div><Leaf size={38} strokeWidth={1.1}/><span>GROW WITH EVERY STEP</span></div></div>
    <div className="passport-holder"><div><span>PASSPORT HOLDER</span><strong>{me?.name??'Your journey starts here'}</strong></div><ShieldCheck size={22} strokeWidth={1.3}/></div>
    <div className="passport-book-footer"><span>{me?'KG / '+me.id.slice(0,8).toUpperCase():'PERSONAL PREVIEW'}</span><span>PRIVATE BY DEFAULT <Leaf size={10}/></span></div>
   </section>
   <section className="passport-route-card" aria-label="Latest journey visualization">
    <div className="passport-card-heading"><div><span className="passport-label">THE JOURNEY BEHIND YOUR FOOTPRINT</span><h2>{hasRoute?'One journey. A bigger picture.':'Where will your next step take you?'}</h2></div><span className="passport-mode"><Mode size={14}/>{modes[journey.mode].label}</span></div>
    <div className="passport-route-art">
     <svg viewBox="0 0 480 200" role="img" aria-labelledby={id+'-route-title'}><title id={id+'-route-title'}>{hasRoute?`Schematic route from ${journey.origin} to ${journey.destination}; not a geographic map`:'Your route will appear here'}</title><defs><pattern id={id+'-dots'} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#d9e0cf"/></pattern><linearGradient id={id+'-route-gradient'}><stop stopColor="#a6b88b"/><stop offset="1" stopColor="#315a48"/></linearGradient></defs><rect width="480" height="200" fill={`url(#${id}-dots)`}/><ellipse cx="240" cy="115" rx="180" ry="91" fill="none" stroke="#e1e7d8"/><ellipse cx="240" cy="115" rx="100" ry="91" fill="none" stroke="#e1e7d8"/><path d="M60 115H420 M78 75H402 M78 155H402" stroke="#e1e7d8" fill="none"/>{hasRoute&&<><path d="M78 145 Q225 -22 398 129" stroke={`url(#${id}-route-gradient)`} strokeWidth="2" strokeDasharray="5 6" fill="none"/><circle cx="78" cy="145" r="11" fill="#e6edd9"/><circle cx="78" cy="145" r="4" fill="#729354"/><circle cx="398" cy="129" r="11" fill="#e6edd9"/><circle cx="398" cy="129" r="4" fill="#315a48"/></>}</svg>
     <span className="passport-route-vehicle" aria-hidden="true"><Mode size={23}/></span>
     <span className="passport-schematic">SCHEMATIC ROUTE</span>
    </div>
    <div className="passport-endpoints"><div><span>FROM</span><strong>{journey.origin||'Your starting point'}</strong></div><ArrowRight size={20}/><div><span>TO</span><strong>{journey.destination||'Your destination'}</strong></div></div>
    <div className="passport-route-meta"><span><MapPin size={13}/>{loading?'Calculating distance…':hasRoute&&estimate.distanceKm!==null?`${format(estimate.distanceKm)} km estimated`:'Add a journey to see your route'}</span><span>{journey.roundTrip?'Return included':'One way'}</span></div>
    <button className="passport-inline-link passport-actions" onClick={onJourney}>{hasRoute?'Edit journey':'Add your journey'}<ArrowUpRight size={14}/></button>
   </section>
  </div>

  <div className="passport-metrics" aria-label="Passport summary">
   <div><span><Leaf size={14}/> ESTIMATED FOOTPRINT</span><strong>{total===null?'—':format(total)}<small> kg CO₂e</small></strong><p>{loading?'Calculating your route':hasRoute?'Your latest journey, including recorded items':'Add a journey to calculate your footprint'}</p></div>
   <div><span><ShieldCheck size={14}/> VERIFIED ACTIONS</span><strong>{verified.length}<small> / 3</small></strong><p>Confirmed by an event organizer</p></div>
   <div><span><Sparkles size={14}/> KARGA POINTS</span><strong>{points}<small> KP</small></strong><p>{points===0?'Your first verified action gets you started':'Earned from your verified eco actions'}</p></div>
  </div>

  <div className="passport-details-grid">
   <section className="passport-breakdown" aria-label="Interactive carbon breakdown">
    <div className="passport-card-heading"><div><span className="passport-label">UNDERSTAND YOUR IMPACT</span><h2>What makes up your footprint?</h2></div><span className="passport-soft-tag">kg CO₂e</span></div>
    <div className="passport-breakdown-body"><div className="passport-donut"><svg viewBox="0 0 180 180" role="img" aria-labelledby={id+'-chart-title'}><title id={id+'-chart-title'}>{total===null?'A complete footprint estimate is not available yet':`Estimated footprint: ${format(total)} kilograms CO2 equivalent. Breakdown listed beside this chart.`}</title><circle cx="90" cy="90" r="72" fill="none" stroke="#eef1e8" strokeWidth="17"/>{total!==null&&total>0&&categories.map(c=>{const length=(c.kg??0)/total*circumference;const current=offset;offset+=length;return <circle key={c.id} cx="90" cy="90" r="72" fill="none" stroke={c.color} strokeWidth={selected===c.id?20:15} strokeDasharray={`${length} ${circumference-length}`} strokeDashoffset={-current} transform="rotate(-90 90 90)" opacity={selected===c.id?1:.55}/>;})}</svg><div><strong>{total===null?'—':format(total)}</strong><span>kg CO₂e</span><small>{total===null?'Awaiting estimate':'LATEST JOURNEY'}</small></div></div>
    <div className="passport-chart-legend">{categories.map(c=><button key={c.id} aria-pressed={selected===c.id} onClick={()=>setSelected(c.id)}><span className="passport-chart-dot" style={{background:c.color}}/><span>{c.label}</span><strong>{c.kg===null?'Pending':format(c.kg)}</strong>{total!==null&&total>0&&<small>{((c.kg??0)/total*100).toFixed(1)}%</small>}</button>)}<p className="passport-category-note" aria-live="polite"><active.icon size={15}/>{active.note}</p></div></div>
    <p className="passport-caption">{total===null?'No complete total yet. Recorded cups and bottles are shown separately.':'Estimates describe emissions; they are not carbon offsets or verified emissions reductions.'}</p>
   </section>
   <section className="passport-reward-card"><span className="passport-label">GOOD CHOICES GO FURTHER</span><div className="passport-gift"><Gift size={28} strokeWidth={1.4}/><Sparkles size={15}/></div><h2>{reward?.confirmed_at?'A little thank you, delivered.':'Your next good thing.'}</h2><p>{reward?.confirmed_at?'Your earned reward is confirmed on Stellar Testnet.':'Every verified action brings you closer to your first reward.'}</p><strong className="passport-reward-amount">1 <span>XLM</span><small>TESTNET</small></strong><div className="passport-reward-track" role="progressbar" aria-label="Verified points toward reward" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:percent+'%'}}/></div><div className="passport-reward-progress"><strong>{points} KP</strong><span>{percent>=100?'Reward unlocked':'100 KP to unlock'}</span></div><button className="button primary passport-actions" onClick={onRewards}>{reward?.confirmed_at?'View reward':percent>=100?'Claim your reward':'Explore rewards'}<ArrowRight size={15}/></button><small className="passport-caption">Testnet XLM has no monetary value.</small></section>
  </div>

  <section className="passport-stamps"><div className="passport-card-heading"><div><span className="passport-label">SMALL ACTIONS, LEAVING THEIR MARK</span><h2>Your verified-action stamps.</h2></div><span className="passport-soft-tag">{verified.length} of 3 verified</span></div><div className="passport-stamp-grid">{actions.map((action,i)=>{const verification=verifications.find(v=>v.action===action.id);const isVerified=!!verification?.verified_at;const Icon=[Coffee,Droplets,Bike][i];return <div key={action.id} className={'passport-stamp '+(isVerified?'is-verified':'')}><div className="passport-stamp-seal"><Icon size={28} strokeWidth={1.3}/><span>{isVerified?<Check size={13}/>:<ScanLine size={12}/>}</span></div><h3>{action.en}</h3><strong>+{action.points} KP</strong><p>{isVerified?<><CheckCheck size={12}/> Organizer verified</>:verification?'QR ready · awaiting verification':'Complete the action to earn this stamp'}</p>{isVerified&&<small>{new Date(verification!.verified_at!).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</small>}</div>;})}</div><div className="passport-stamp-footer"><span><ShieldCheck size={14}/> Stamps and points appear only after organizer verification.</span><button className="passport-inline-link passport-actions" onClick={onActions}>Find your next action<ArrowUpRight size={14}/></button></div></section>
  {!hasRoute&&<div className="passport-empty-callout passport-actions"><div><span className="icon-bg sage"><Plane size={21}/></span><div><strong>See your passport come to life.</strong><p>Try an Istanbul → Lisbon flight estimate. It won’t create verified points or save a journey.</p></div></div><button className="button secondary" onClick={onExample}>Preview a journey<ArrowRight size={14}/></button></div>}
  <div className="passport-fine-print"><Leaf size={14}/><p>Your passport reflects your latest journey, not lifetime travel. {me&&saved?'Saved to your account.':'This is a draft; sign in and save your journey to keep it.'} Your route and name are included if you choose to print or save this page.</p></div>
 </div>;
}
