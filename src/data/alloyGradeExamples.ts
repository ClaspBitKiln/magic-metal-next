// Examples of alloy / metal grades only. Not a matrix of permissible products or stock.
export type GradeExamples = { title: string; grades: string[]; standard: string; source: string; caution?: string }
export const alloyGradeExamples: Record<string, GradeExamples> = {
  med: { title: 'Медь', grades: ['М0','М1','М1р','М1ф','М2','М2р','М3','М3р'], standard: 'ГОСТ 859-2014', source: 'https://protect.gost.ru/gost/details/8b09dfe4-609d-4813-9894-e66ab3f382ba' },
  latun: { title: 'Латунь', grades: ['Л63','Л68','Л70','Л90','ЛС59-1'], standard: 'ГОСТ 15527-2004 (деформируемые латуни)', source: 'https://mpchb.ru/gost/produkciya-iz-cvetnyh-metallov/gost-15527-2004' },
  bronza: { title: 'Бронза', grades: ['БрОФ6,5-0,15','БрОЦ4-3','БрАЖ9-4','БрАМц9-2'], standard: 'ГОСТ 5017-2006 (оловянные), ГОСТ 18175-78 (безоловянные)', source: 'https://protect.gost.ru/gost/details/39616174-fd36-48c0-9b2f-b631462e2a2c', caution: 'Оловянные и безоловянные бронзы относятся к разным группам и стандартам.' },
  alyuminij: { title: 'Алюминий', grades: ['АД1','АД31','АМг2','АМг5','Д16','В95'], standard: 'ГОСТ 4784-2019 (деформируемые сплавы)', source: 'https://meganorm.ru/mega_doc/norm/gost_gosudarstvennyj-standart/13/gost_4784-2019_mezhgosudarstvennyy_standart_alyuminiy_i.html' },
  titan: { title: 'Титан', grades: ['ВТ1-00','ВТ1-0','ОТ4','ВТ5','ВТ6'], standard: 'ГОСТ 19807-91 (деформируемые сплавы)', source: 'https://dnaop.com/html/72940/doc-%D0%93%D0%9E%D0%A1%D0%A2_19807-91' },
  olovo: { title: 'Олово', grades: ['ОВЧ 000','О1 пч','О1','О2','О3','О4'], standard: 'ГОСТ 860-75', source: 'https://npo-fenix.ru/production/olovo/' },
  svinec: { title: 'Свинец', grades: ['С0','С1','С2','С3'], standard: 'ГОСТ 3778-98', source: 'https://litzavod.com/2024/11/21/%D0%B3%D0%BE%D1%81%D1%82-3778-98-%D1%81%D0%B2%D0%B8%D0%BD%D0%B5%D1%86-%D1%82%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B5-%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F/' },
  cink: { title: 'Цинк', grades: ['ЦВ00','ЦВ0','Ц0А','Ц0','Ц1','Ц2'], standard: 'ГОСТ 3640-94', source: 'https://ferrolabs.ru/digest/tsink-gost-3640-94/' },
  nihrom: { title: 'Нихром', grades: ['Х20Н80','Х15Н60'], standard: 'ГОСТ 10994-74 (прецизионные сплавы)', source: 'https://metotech.ru/gost_10994_74_prec.htm' },
  babbit: { title: 'Баббит', grades: ['Б88','Б83','Б83С','Б16','БН','БС6'], standard: 'ГОСТ 1320-74', source: 'https://mpchb.ru/gost/cvetnye-metally/gost-1320-74' },
  list: { title: 'Нержавеющий лист', grades: ['08Х18Н10','12Х18Н10Т','10Х17Н13М2Т'], standard: 'ГОСТ 5632-2014 (марки сталей)', source: 'https://metexpro.ru/gost/5632-2014/' },
  truby: { title: 'Нержавеющие трубы', grades: ['08Х18Н10','12Х18Н10Т','10Х17Н13М2Т'], standard: 'ГОСТ 5632-2014 (марки сталей)', source: 'https://metexpro.ru/gost/5632-2014/' },
  'sortovoy-prokat': { title: 'Нержавеющий сортовой прокат', grades: ['08Х18Н10','12Х18Н10Т','20Х13','40Х13'], standard: 'ГОСТ 5632-2014 (марки сталей)', source: 'https://metexpro.ru/gost/5632-2014/' },
}
