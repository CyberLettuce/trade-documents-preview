import carnetWords from './carnet-language1.js?v=2026-11-17-carnet-actions-r1';
import {languageCreateElement as h,registerPatterns} from './language-runtime-review1-57775012.js?v=2026-11-17-carnet-actions-r1';
import {I as Icon} from './index-Cj32ATD7-review1-d3188122-nochecklist1.js?v=2026-11-17-carnet-actions-r1';
import {carnetAccess,carnetQr,carnetActions} from './carnet-actions-model1.js?v=2026-11-17-carnet-actions-r1';
for(const [language,words] of Object.entries(carnetWords))registerPatterns(Object.entries(words),language);
export function CarnetAccessPanel({app}) {
  const access=carnetAccess(app),qr=carnetQr(access.payload);
  return h('div',{className:'carnet-access'},
    h('p',null,'Sample access details. This QR code cannot open a real carnet.'),
    h('dl',null,h('dt',null,'Carnet ID'),h('dd',{translate:'no'},access.id),h('dt',null,'PIN'),h('dd',{className:'demo-pin',translate:'no'},access.pin)),
    h('svg',{className:'carnet-qr',viewBox:`0 0 ${qr.size} ${qr.size}`,role:'img','aria-label':'Sample eCarnet QR code'},h('rect',{width:qr.size,height:qr.size,fill:'white'}),h('path',{d:qr.path,fill:'black',shapeRendering:'crispEdges'})));
}
export function CarnetRowActions({app,onAction}) {
  return h('div',{className:'carnet-row-actions'},...carnetActions.map(action=>h('button',{
    key:action.id,type:'button',className:'icon-button row-action-icon',title:action.label,'aria-label':action.label+' '+app.reference,
    onClick:event=>{event.stopPropagation();onAction(app,action.id);}
  },h(Icon,{name:action.icon}))));
}
