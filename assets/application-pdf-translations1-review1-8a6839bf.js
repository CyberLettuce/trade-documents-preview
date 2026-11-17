import {registerPatterns} from './language-runtime-review1-57775012.js?v=2026-11-17-carnet-actions-r1';
const words={
 'Uploaded PDF preview':['Voorbeeld van geüploade PDF','Üleslaaditud PDF-i eelvaade','معاينة ملف PDF المرفوع'],
 'Uploaded PDF':['Geüploade PDF','Üleslaaditud PDF','ملف PDF المرفوع'],
 'Original uploaded PDF':['Originele geüploade PDF','Algne üleslaaditud PDF','ملف PDF الأصلي المرفوع'],
 'Open original PDF':['Originele PDF openen','Ava algne PDF','فتح ملف PDF الأصلي'],
 'Previous page':['Vorige pagina','Eelmine lehekülg','الصفحة السابقة'],
 'Next page':['Volgende pagina','Järgmine lehekülg','الصفحة التالية'],
 'Page {0} of {1}':['Pagina {0} van {1}','Lehekülg {0}/{1}','الصفحة {0} من {1}'],
 'Loading PDF…':['PDF laden…','PDF-i laadimine…','جارٍ تحميل ملف PDF…'],
 'Saving PDF…':['PDF opslaan…','PDF-i salvestamine…','جارٍ حفظ ملف PDF…'],
 'PDF stored in this browser. The original file is unchanged.':['PDF opgeslagen in deze browser. Het originele bestand blijft ongewijzigd.','PDF on salvestatud selles brauseris. Algne fail jääb muutmata.','تم حفظ ملف PDF في هذا المتصفح. لم يتغير الملف الأصلي.'],
 'PDF only, up to 10 MB each. PDFs are saved in this browser for document preview.':['Alleen PDF, maximaal 10 MB per bestand. PDF-bestanden worden in deze browser opgeslagen voor documentvoorbeelden.','Ainult PDF, kuni 10 MB faili kohta. PDF-id salvestatakse selles brauseris dokumentide eelvaateks.','ملفات PDF فقط، حتى 10 ميغابايت لكل ملف. تُحفظ الملفات في هذا المتصفح لمعاينتها.'],
 'Only the filename is available for this attachment. Add the original PDF to the application to preview it.':['Van deze bijlage is alleen de bestandsnaam beschikbaar. Voeg de originele PDF toe aan de aanvraag om deze te bekijken.','Selle manuse puhul on saadaval ainult failinimi. Eelvaateks lisage taotlusele algne PDF.','يتوفر اسم الملف فقط لهذا المرفق. أضف ملف PDF الأصلي إلى الطلب لمعاينته.'],
 'This PDF is no longer available in this browser. Add the original PDF again.':['Deze PDF is niet meer beschikbaar in deze browser. Voeg de originele PDF opnieuw toe.','See PDF pole selles brauseris enam saadaval. Lisage algne PDF uuesti.','لم يعد ملف PDF متاحًا في هذا المتصفح. أضف الملف الأصلي مجددًا.'],
 'This PDF could not be displayed. Open the original PDF to view it.':['Deze PDF kan niet worden weergegeven. Open de originele PDF om deze te bekijken.','Seda PDF-i ei saanud kuvada. Vaatamiseks avage algne PDF.','تعذّر عرض ملف PDF. افتح الملف الأصلي لعرضه.'],
 'This page could not be displayed. Open the original PDF to view it.':['Deze pagina kan niet worden weergegeven. Open de originele PDF om deze te bekijken.','Seda lehekülge ei saanud kuvada. Vaatamiseks avage algne PDF.','تعذّر عرض هذه الصفحة. افتح ملف PDF الأصلي لعرضها.'],
 'Enter the PDF password.':['Voer het PDF-wachtwoord in.','Sisestage PDF-i parool.','أدخل كلمة مرور ملف PDF.'],
 'Incorrect password. Try again.':['Onjuist wachtwoord. Probeer het opnieuw.','Vale parool. Proovige uuesti.','كلمة المرور غير صحيحة. حاول مجددًا.'],
 'Open PDF':['PDF openen','Ava PDF','فتح ملف PDF']
};
for(const [index,locale]of ['nl','et','ar'].entries())registerPatterns(Object.entries(words).map(([en,value])=>[en,value[index]]),locale);
