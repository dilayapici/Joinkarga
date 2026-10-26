export type ParticipantProgress={signedIn:boolean;journeySaved:boolean;points:number;rewardConfirmed:boolean};
export function nextParticipantStep(progress:ParticipantProgress){
 if(!progress.signedIn)return {id:'account',title:'Make it your journey',description:'Create your account to keep your passport, points, and rewards together.',button:'Create my account'};
 if(!progress.journeySaved)return {id:'journey',title:'Put your journey in perspective',description:'Add where you traveled from and to, then save the estimate to your passport.',button:'Add my journey'};
 if(progress.points<100)return {id:'actions',title:progress.points===0?'Your first good choice starts here':'Keep the good choices going',description:progress.points===0?'Complete an eco-action and ask an organizer to verify it. That’s how you earn your first Karga Points.':`${100-progress.points} more verified points unlock your Testnet reward. Choose your next eco-action.`,button:progress.points===0?'Earn my first points':'Explore eco-actions'};
 if(!progress.rewardConfirmed)return {id:'reward',title:'You’ve earned a little thank you',description:'Your verified actions have unlocked a 1 XLM Testnet reward. Check your wallet and claim it.',button:'Open my reward'};
 return {id:'passport',title:'Your good choices, all together',description:'See your journey, verified actions, and confirmed reward in your personal carbon passport.',button:'Open my passport'};
}
