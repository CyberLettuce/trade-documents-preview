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

// Same Fluent UI paths used by the React status badges.
const shapes={"Draft":{"size":20,"paths":["M6.5 10a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zM4 4c0-1.1.9-2 2-2h4.59q.62.01 1.06.44l3.91 3.91c.28.28.44.67.44 1.06V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8h-3.5A1.5 1.5 0 0 1 10 6.5V3zm5.5 4h3.3L11 3.2v3.3c0 .28.22.5.5.5"]},"Submitted":{"size":20,"paths":["M2.18 2.11a.5.5 0 0 1 .54-.06l15 7.5a.5.5 0 0 1 0 .9l-15 7.5a.5.5 0 0 1-.7-.58L3.98 10 2.02 2.63a.5.5 0 0 1 .16-.52m2.7 8.39-1.61 6.06L16.38 10 3.27 3.44 4.88 9.5h6.62a.5.5 0 1 1 0 1z"]},"Pending":{"size":20,"paths":["M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16m0 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14m-.5 2a.5.5 0 0 1 .5.41V10h2.5a.5.5 0 0 1 .09 1H9.5a.5.5 0 0 1-.5-.41V5.5c0-.28.22-.5.5-.5"]},"In Progress":{"size":20,"paths":["M5.92 18q-.38 0-.72-.16-.35-.15-.62-.42A2 2 0 0 1 4 16.08a6 6 0 0 1 .5-2.3 5 5 0 0 1 1.44-1.88l1.82-1.52q.18-.15.18-.38a.5.5 0 0 0-.18-.38L5.94 8.09A5.3 5.3 0 0 1 4 3.92q0-.38.16-.72.15-.35.42-.62A2 2 0 0 1 5.92 2h8.16q.38 0 .72.16.35.15.62.42A2 2 0 0 1 16 3.92q0 1.24-.5 2.3a5 5 0 0 1-1.44 1.87l-1.82 1.53a.5.5 0 0 0 0 .77l1.82 1.5A5.4 5.4 0 0 1 16 16.09q0 .38-.16.72-.15.35-.42.62a2 2 0 0 1-1.34.58zm8.12-1a1 1 0 0 0 .68-.28q.15-.15.2-.3.06-.18.08-.38a4.3 4.3 0 0 0-1.58-3.37l-1.82-1.52a1.5 1.5 0 0 1-.54-1.15 1.5 1.5 0 0 1 .54-1.16l1.82-1.51A4.3 4.3 0 0 0 15 3.96a1 1 0 0 0-.28-.68 1 1 0 0 0-.3-.2q-.17-.06-.38-.08H5.96a1 1 0 0 0-.37.07 1 1 0 0 0-.3.21q-.15.15-.21.3-.07.18-.08.38a4.5 4.5 0 0 0 .9 2.67q.3.37.68.7L8.4 8.84q.25.21.4.52a1.5 1.5 0 0 1-.4 1.79l-1.82 1.52A4.3 4.3 0 0 0 5 16.04q0 .2.07.37.08.18.21.3.15.14.3.21.18.07.38.08z"]},"Approved":{"size":20,"paths":["M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16m0 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14m3.36 4.65c.17.17.2.44.06.63l-.06.07-4 4a.5.5 0 0 1-.64.07l-.07-.06-2-2a.5.5 0 0 1 .63-.77l.07.06L9 11.3l3.65-3.65c.2-.2.51-.2.7 0"]},"Rejected":{"size":20,"paths":["M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16m0 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14M7.8 7.11l.08.06L10 9.3l2.12-2.12a.5.5 0 0 1 .64-.06l.07.06c.17.18.2.44.06.64l-.06.07L10.7 10l2.12 2.12c.17.17.2.44.06.64l-.06.07a.5.5 0 0 1-.64.06l-.07-.06L10 10.7l-2.12 2.12a.5.5 0 0 1-.64.06l-.07-.06a.5.5 0 0 1-.06-.64l.06-.07L9.3 10 7.17 7.88a.5.5 0 0 1-.06-.64l.06-.07a.5.5 0 0 1 .64-.06"]},"Archive":{"size":20,"paths":["M8.5 10a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zM2 4.75C2 3.78 2.78 3 3.75 3h12.5c.97 0 1.75.78 1.75 1.75v1.5c0 .7-.4 1.3-1 1.58V14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7.83c-.6-.28-1-.88-1-1.58zM3.75 4a.75.75 0 0 0-.75.75v1.5c0 .41.34.75.75.75h12.5c.41 0 .75-.34.75-.75v-1.5a.75.75 0 0 0-.75-.75zM4 8v6c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V8z"]},"Auto Accepted":{"size":16,"paths":["M5.87 1a1 1 0 0 0-.96.71L3.03 8.04c-.14.48.22.96.72.96h1.58l-1.28 4.39c-.38 1.31 1.33 2.2 2.18 1.13l6.6-8.3A.75.75 0 0 0 12.26 5h-2.03l1-2.65A1 1 0 0 0 10.27 1z"]}};
const aliases={Completed:'Approved',Processed:'Approved',Accepted:'Approved',Active:'Approved',Closed:'Approved',Paid:'Approved',Inactive:'Rejected',Suspended:'Rejected',Awaiting:'Pending','Awaiting payment':'Pending',Archived:'Archive'};
export const StatusIcon={props:['status'],computed:{shape(){return shapes[aliases[this.status]||this.status]||shapes.Pending}},template:String.raw`<svg class="status-icon" :class="{'status-send':status==='Submitted'}" :viewBox="'0 0 '+shape.size+' '+shape.size" fill="currentColor" aria-hidden="true" focusable="false"><path v-for="path in shape.paths" :key="path" :d="path"/></svg>`};
