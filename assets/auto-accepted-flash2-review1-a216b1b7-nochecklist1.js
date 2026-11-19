/* Fluent UI Flash16Filled. MIT License

Copyright (c) 2020 Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
import{r as e}from"./index-Cj32ATD7-review1-d3188122-nochecklist1-options1-sidebar1-editorcol1.js?v=2026-11-19-audit-fixes-r1";var b=e.Activity,w=e.Children,V=e.Component,P=e.Fragment,$=e.Profiler,k=e.PureComponent,q=e.StrictMode,W=e.Suspense,G=e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Y=e.__COMPILER_RUNTIME,j=e.act,J=e.cache,K=e.cacheSignal,Q=e.captureOwnerStack,X=e.cloneElement,C=e.createContext,u=e.createElement,Z=e.createRef,R=e.forwardRef,ee=e.isValidElement,te=e.lazy,oe=e.memo,re=e.startTransition,ce=e.unstable_useCacheRefresh,ne=e.use,le=e.useActionState,se=e.useCallback,F=e.useContext,ae=e.useDebugValue,ie=e.useDeferredValue,ue=e.useEffect,pe=e.useEffectEvent,xe=e.useId,fe=e.useImperativeHandle,he=e.useInsertionEffect,me=e.useLayoutEffect,L=e.useMemo,de=e.useOptimistic,Ce=e.useReducer,Re=e.useRef,Fe=e.useState,Le=e.useSyncExternalStore,_e=e.useTransition,Ie=e.version;var h="fui-Icon";var m="data-fui-icon";var _="data-fui-icon-rtl";function I(...t){return t.filter(Boolean).join(" ")||void 0}var E=C(void 0),y={},Te=E.Provider,N=()=>{let t=F(E);return t??y};var A=(t,o)=>{let{filled:r,idPrefix:l,title:n,primaryFill:p="currentColor",...i}=t,c={...i,fill:p},s=N(),a=!!(o?.flipInRtl&&s?.textDirection==="rtl");return n&&(c["aria-label"]=n),!c["aria-label"]&&!c["aria-labelledby"]?c["aria-hidden"]=!0:c.role="img",c[m]="",{state:c,isRtlFlip:a}};var g=(t,o)=>{let{state:r,isRtlFlip:l}=A(t,o);return l&&(r[_]=""),r};var d="url(#",M=(t,o,r)=>{let[l,n,...p]=t,i=n;if(r&&n){let c={};for(let s in n){let a=n[s];if(typeof a!="string")c[s]=a;else if(s==="id")c[s]=r+a;else{let x=a.indexOf(d);c[s]=x<0?a:a.slice(0,x+d.length)+r+a.slice(x+d.length)}}i=c}return u(l,{...i,key:o},...p.map((c,s)=>M(c,s,r)))},S=t=>t==="1em"?"20":t,v=(t,o,r)=>typeof t!="string"&&(o?.color||Array.isArray(t[0]))?t.map((l,n)=>M(l,n,r)):void 0,O=()=>{},H=(t,o)=>{let r=v(t,o);return r?function(n){return L(()=>n?v(t,o,n):r,[n])}:O},T=(t,o,r)=>typeof o=="string"?u("svg",{...t,dangerouslySetInnerHTML:{__html:o}}):r?u("svg",t,...r):u("svg",t,...o.map(l=>u("path",{d:l,fill:t.fill})));var z=(t,o,r,l)=>{let n=S(o),p=H(r,l),i=R((c,s)=>{let a=g(c,{flipInRtl:l?.flipInRtl}),x=p(c.idPrefix),D={...a,className:I(h,a.className),ref:s,width:o,height:o,viewBox:`0 0 ${n} ${n}`,xmlns:"http://www.w3.org/2000/svg"};return T(D,r,x)});return i.displayName=t,i};var U=z("Flash16Filled","16",["M5.87 1a1 1 0 0 0-.96.71L3.03 8.04c-.14.48.22.96.72.96h1.58l-1.28 4.39c-.38 1.31 1.33 2.2 2.18 1.13l6.6-8.3A.75.75 0 0 0 12.26 5h-2.03l1-2.65A1 1 0 0 0 10.27 1z"]);export{U as Flash16Filled};
