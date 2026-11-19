import words from './quick-access-language1.js?v=2026-11-19-audit-fixes-r1';
import {registerPatterns} from './language-runtime-review1-57775012.js?v=2026-11-19-audit-fixes-r1';
for(const [locale,values] of Object.entries(words))registerPatterns(Object.entries(values),locale);
