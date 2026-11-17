import test from 'node:test';
import assert from 'node:assert/strict';
import {optionsStorageKey,readOptionsOpen,writeOptionsOpen,hasOptionFilters} from '../../assets/list-options-model.js';
import words from '../../assets/list-options-language.js';

test('Options defaults closed and remembers each workspace and page separately',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const keys=['react-chamber','react-exporter','vue-chamber','vue-exporter'].flatMap(w=>['applications','reports'].map(p=>optionsStorageKey(w,p)));
 assert.equal(new Set(keys).size,8);
 assert.ok(keys.every(k=>!readOptionsOpen(storage,k)));
 writeOptionsOpen(storage,keys[0],true);
 assert.equal(readOptionsOpen(storage,keys[0]),true);
 assert.ok(keys.slice(1).every(k=>!readOptionsOpen(storage,k)));
 writeOptionsOpen(storage,keys[0],false);
 assert.equal(readOptionsOpen(storage,keys[0]),false);
});
test('Unavailable or corrupted preference storage cannot prevent search and controls rendering',()=>{
 const denied={getItem(){throw Error('disabled')},setItem(){throw Error('full')}};
 assert.equal(readOptionsOpen(denied,'x'),false);
 assert.doesNotThrow(()=>writeOptionsOpen(denied,'x',true));
 assert.equal(readOptionsOpen({getItem:()=>'{invalid'},'x'),false);
});
test('Hidden filters stay indicated independently of visible search and export preferences',()=>{
 const filters={query:'Northshore',status:'All',service:'All',from:'',includeStatus:true};
 assert.equal(hasOptionFilters(filters),false);
 assert.equal(hasOptionFilters({...filters,status:'Auto Accepted'}),true);
 assert.equal(hasOptionFilters({...filters,from:'2026-11-01'}),true);
 assert.equal(hasOptionFilters({...filters,docTypes:['ata']}),true);
 assert.equal(hasOptionFilters({...filters,docTypes:[]}),false);
 assert.deepEqual(filters,{query:'Northshore',status:'All',service:'All',from:'',includeStatus:true});
});
test('The Options controls are translated into every supported non-English language',()=>{
 assert.deepEqual(Object.keys(words).sort(),['ar','et','nl','pt','sv']);
 for(const dictionary of Object.values(words))for(const key of ['Options','Filters active'])assert.ok(dictionary[key]&&dictionary[key]!==key);
});
