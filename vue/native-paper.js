import {reviewPageHeight} from '../assets/review-preferences.js?v=2026-11-20-pending-review-r1';
import {carnetTripCounts} from '../assets/carnet-review.js?v=2026-11-20-carnet-r1';
import {h,ref,onMounted,onUpdated,onUnmounted,nextTick} from './assets/vue.esm-browser.prod.js?v=2026-11-20-acceptance-r1';
import {DocumentForm} from './assets/native-document-forms.js?v=2026-11-20-acceptance-r1';import {withPaperEdit} from './paper-runtime.js?v=2026-11-20-acceptance-r1';import {DOC_IDS} from './form-model.js?v=2026-11-20-carnet-r1';
export function paperRecord(record,document=record.document){const r={...record};r.docs=(r.documents||[r.document]).map(d=>DOC_IDS[d]);r.reference=r.yourReference||r.reference;r.use=Array.isArray(r.use)?r.use:[r.use||''];r.importStatuses=r.importStatuses||[];r.originCountries=r.originCountries?.length?r.originCountries:[r.origin].filter(Boolean);r.originBasis=r.originBasis||[];r.invoices=r.invoices||[];r.items=r.items||[];r.trips=(r.trips||[]).map(trip=>({...trip,...carnetTripCounts(trip)}));r.manufacturers=[];r.goodsLayout=r.items.length||r.packages?'structured':'free';r.goodsItems=r.items.map(i=>({...i,marks:i.marks||'',packages:i.packages||'',description:i.description}));if(r.items.length){r.goods=r.items[0].description;r.packages=r.items[0].packages;r.shippingMarks=r.items[0].marks;r.additionalGoods=r.items.slice(1).map(i=>({id:i.id,marks:i.marks,packages:i.packages,description:i.description}))}r.originCountries=[r.origin,...String(r.otherOrigins||'').split(/[,\n]/)].filter(Boolean);r.eurGross=r.eurGross||r.gross;r.eurTransport=r.eurTransport||r.transport;r.eurRemarks=r.eurRemarks||r.remarks;r.eurWeightUnit=r.weightUnit;r.eurUseSharedWeight=true;r.eurInvoices=r.eurInvoices||r.invoices.map(i=>[i.number,i.date].filter(Boolean).join(' · ')).join('\n');if(['EUR1','EUR-MED'].includes(document)){r.gross=r.eurGross||r.gross;if(r.eurOrigin)r.originCountries=[r.eurOrigin];}r.remarksType=r.remarksTemplate||'None';r.replacementReference=r.previousCertificate||r.replacementReference;r.replacementIssueDate=r.previousDate||r.replacementIssueDate;r.eurRemarksType=r.eurRemarksType||(['Duplicate','Issued Retrospectively','Replacement of Duplicate','Replacement of Retrospective','Duplicate of Retrospective'].includes(r.remarksTemplate)?r.remarksTemplate:'None');r.eurOriginalSerial=r.eurOriginalSerial||r.previousCertificate;r.eurIssueDate=r.eurIssueDate||r.previousDate;r.cumulation=r.cumulation==='Cumulation applied with'?'Cumulation applied':r.cumulation;return r}
export const NativePaper={
  props:{record:Object,document:String,page:Number,editable:Boolean,print:Boolean,zoom:String,compactFitPage:Boolean},
  emits:['edit','fit','fit-page-width'],
  setup(props,{emit}){
    const host=ref(null);
    let observer,frame;
    function measure(){
      const container=host.value;
      const sheet=container?.querySelector('.certificate-form');
      if(!sheet?.scrollHeight)return;
      const height=sheet.scrollHeight;
      emit('fit',height<=1132);
      sheet.style.setProperty('--paper-print-scale',String(Math.min(718/640,1009/height)));
      const compact=props.compactFitPage&&props.zoom==='page'&&!props.print;
      const preferredWidth=Math.min(640,640*reviewPageHeight(container.parentElement)/height);
      const available=compact?container.parentElement.clientWidth-16:container.clientWidth;
      const numeric=Number(props.zoom)/100;
      const scale=props.print?1:numeric>0?numeric:compact
        ?Math.max(0,Math.min(preferredWidth,available))/640
        :Math.min(1,available/640,props.zoom==='page'?Math.max(250,window.innerHeight-220)/height:1);
      sheet.style.transform='scale('+scale+')';
      container.style.height=height*scale+'px';
      container.style.width=compact?640*scale+'px':'';
      if(compact)emit('fit-page-width',preferredWidth);
    }
    function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(measure)}
    onMounted(()=>{
      observer=new ResizeObserver(schedule);
      observer.observe(host.value);
      if(props.compactFitPage){
        observer.observe(host.value.parentElement);
        window.addEventListener('resize',schedule);
      }
      nextTick(schedule);
    });
    onUpdated(()=>nextTick(schedule));
    onUnmounted(()=>{
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize',schedule);
    });
    return()=>h('div',{class:'native-paper',ref:host,lang:'en',dir:'ltr',translate:'no'},[
      withPaperEdit(props.editable?(section,field)=>emit('edit',section,field):undefined,()=>DocumentForm({
        form:paperRecord(props.record,props.document),doc:DOC_IDS[props.document||props.record.document],
        page:props.page||0,chamber:true,print:props.print
      }))
    ]);
  }
};
