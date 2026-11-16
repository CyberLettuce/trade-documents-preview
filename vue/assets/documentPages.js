// Shared page order for the document renderer, preview dialogs and Chamber pack.
export const formPages={coo:['Application','Origin declaration'],arab:['Certificate','Application / control copy'],ata:['Front cover','General list'],eur:['Certificate'],eurmed:['Certificate','Declaration'],iic:['Application']};
export const carnetPages=[...formPages.ata,'Vouchers','Counterfoil','Green carnet back sheet','Application form','Aviva guarantee'];
export const chamberPages=doc=>doc==='ata'?carnetPages:formPages[doc]||['Document'];
