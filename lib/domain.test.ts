import test from 'node:test';
import assert from 'node:assert/strict';
import {footprint,actions} from './domain';
test('calculator accounts for consumables and passenger distance',()=>{assert.ok(Math.abs(footprint(2,3,10,'car')-2.079)<0.000001);assert.equal(footprint(0,0,10,'walk'),0);assert.equal(footprint(0,0,10,'bike'),0);assert.ok(footprint(1,1,10,'rail')<footprint(1,1,10,'car'));});
test('all verified actions unlock one reward',()=>{assert.equal(actions.reduce((n,a)=>n+a.points,0),105);assert.equal(new Set(actions.map(a=>a.id)).size,3);});
