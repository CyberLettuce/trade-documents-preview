import test from 'node:test';
import assert from 'node:assert/strict';
import {readSidebar,saveSidebar,sidebarKey} from '../../assets/sidebar-state.js';
test('sidebar preference survives reload and each version retains its own choice',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 assert.equal(readSidebar(storage,'react'),false);
 saveSidebar(storage,'react',true);
 assert.equal(readSidebar(storage,'react'),true);
 assert.equal(readSidebar(storage,'vue'),false);
 saveSidebar(storage,'vue',true);saveSidebar(storage,'react',false);
 assert.equal(readSidebar(storage,'react'),false);assert.equal(readSidebar(storage,'vue'),true);
 values.set(sidebarKey('react'),'invalid');assert.equal(readSidebar(storage,'react'),false);
});
test('blocked browser storage does not prevent sidebar use',()=>{
 const storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.equal(readSidebar(storage,'react'),false);assert.equal(saveSidebar(storage,'react',true),false);
});
