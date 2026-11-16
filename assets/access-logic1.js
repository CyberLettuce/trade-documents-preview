export const currentExporterUser=space=>(space.users||[]).find(user=>user.id===(space.currentUserId||'self'))||null;
export const accessLevel=user=>user?.role==='Administrator'?'Administrator':'Basic';
export const isExporterAdmin=space=>{const user=currentExporterUser(space);return Boolean(user&&user.status==='Active'&&accessLevel(user)==='Administrator');};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function protectExporterStore(previous,next){
 if(isExporterAdmin(previous.spaces[previous.active]))return next;
 if(!same(previous.accounts,next.accounts))throw Error('Only Administrators can change company details.');
 for(const [id,space]of Object.entries(previous.spaces||{})){const changed=next.spaces?.[id];if(!changed||!same(space.users,changed.users)||!same(space.signatories,changed.signatories))throw Error('Only Administrators can manage users or change signatories.');}
 return next;
}
export function saveExporterUser(space,draft){
 if(!isExporterAdmin(space))throw Error('Only Administrators can manage users.');
 const users=space.users||[],existing=users.find(user=>user.id===draft.id),name=String(draft.name||'').trim(),email=String(draft.email||'').trim(),role=draft.role;
 if(!name||name.length>120)throw Error('Enter a name of 1–120 characters.');
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email address.');
 if(!['Basic','Administrator'].includes(role))throw Error('Choose Basic or Administrator.');
 if(users.some(user=>user.id!==draft.id&&String(user.email||'').trim().toLowerCase()===email.toLowerCase()))throw Error('That email address is already on this account.');
 if(existing?.id===currentExporterUser(space)?.id&&role!==existing.role)throw Error('You cannot change your own access level.');
 const value={...existing,id:draft.id,name,email,role,status:existing?.status||'Active',notifications:existing?.notifications??false};
 const updated=existing?users.map(user=>user.id===value.id?value:user):[...users,value];
 if(!updated.some(user=>user.role==='Administrator'&&user.status==='Active'))throw Error('Keep at least one Administrator on this account.');
 return {...space,users:updated};
}
export function removeExporterUser(space,id){
 if(!isExporterAdmin(space))throw Error('Only Administrators can manage users.');
 if(id===currentExporterUser(space)?.id)throw Error('You cannot remove your own user.');
 const users=(space.users||[]).filter(user=>user.id!==id);
 if(!users.some(user=>user.role==='Administrator'&&user.status==='Active'))throw Error('Keep at least one Administrator on this account.');
 return {...space,users};
}
