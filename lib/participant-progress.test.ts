import test from 'node:test';
import assert from 'node:assert/strict';
import {nextParticipantStep} from './participant-progress';
const ready={signedIn:true,journeySaved:true,points:0,rewardConfirmed:false};
test('participant guidance never suggests claiming before the verified-points threshold',()=>{assert.equal(nextParticipantStep({...ready,signedIn:false,points:105}).id,'account');assert.equal(nextParticipantStep({...ready,journeySaved:false}).id,'journey');for(const points of [0,25,30,50,55,75,80,99])assert.equal(nextParticipantStep({...ready,points}).id,'actions');for(const points of [100,105])assert.equal(nextParticipantStep({...ready,points}).id,'reward');assert.equal(nextParticipantStep({...ready,points:105,rewardConfirmed:true}).id,'passport');});
