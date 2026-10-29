import{useEffect as g,useLayoutEffect as v,useRef as o}from"./motion-react-contactfix1.js";import x from"./gsap-contactfix1.js";var f=typeof document<"u"?v:g,i=e=>e&&!Array.isArray(e)&&typeof e=="object",c=[],A={},p=x,u=(e,r=c)=>{let n=A;i(e)?(n=e,e=null,r="dependencies"in n?n.dependencies:c):i(r)&&(n=r,r="dependencies"in n?n.dependencies:c),e&&typeof e!="function"&&console.warn("First parameter must be a function or config object");let{scope:s,revertOnUpdate:l}=n,a=o(!1),t=o(p.context(()=>{},s)),m=o(y=>t.current.add(null,y)),d=r&&r.length&&!l;return d&&f(()=>(a.current=!0,()=>t.current.revert()),c),f(()=>{if(e&&t.current.add(e,s),!d||!a.current)return()=>t.current.revert()},r),{context:t.current,contextSafe:m.current}};u.register=e=>{p=e},u.headless=!0;/*! Bundled license information:

@gsap/react/src/index.js:
  (*!
   * @gsap/react 2.1.2
   * https://gsap.com
   *
   * Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license or for
   * Club GSAP members, the agreement issued with that membership.
   * @author: Jack Doyle, jack@greensock.com
  *)
*/export{u as useGSAP};
