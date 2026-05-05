import * as XLSX from 'xlsx';

const settlements = [
  // ערים גדולות
  { name: 'ירושלים', type: 'עיר', url: 'https://www.jerusalem.muni.il/he/business/businesslicensing/' },
  { name: 'תל אביב-יפו', type: 'עיר', url: 'https://www.tel-aviv.gov.il/Residents/Business/Pages/BusinessLicense.aspx' },
  { name: 'חיפה', type: 'עיר', url: 'https://www.haifa.muni.il/residents/business-licensing/' },
  { name: 'ראשון לציון', type: 'עיר', url: 'https://www.rishon-lezion.muni.il/residents/business/' },
  { name: 'פתח תקווה', type: 'עיר', url: 'https://www.petah-tikva.muni.il/residents/business-licensing' },
  { name: 'אשדוד', type: 'עיר', url: 'https://www.ashdod.muni.il/he/residents/business-licensing/' },
  { name: 'נתניה', type: 'עיר', url: 'https://www.netanya.muni.il/Residents/BusinessLicensing/' },
  { name: 'בני ברק', type: 'עיר', url: 'https://www.bnei-brak.muni.il/Residents/Business/' },
  { name: 'באר שבע', type: 'עיר', url: 'https://www.beer-sheva.muni.il/residents/business/' },
  { name: 'רמת גן', type: 'עיר', url: 'https://www.ramat-gan.muni.il/residents/business-licensing/' },
  { name: 'אשקלון', type: 'עיר', url: 'https://www.ashkelon.muni.il/residents/business-licensing/' },
  { name: 'רחובות', type: 'עיר', url: 'https://www.rehovot.muni.il/residents/business/' },
  { name: 'בת ים', type: 'עיר', url: 'https://www.bat-yam.muni.il/residents/business-licensing/' },
  { name: 'בית שמש', type: 'עיר', url: 'https://www.beitshemesh.muni.il/residents/business-licensing/' },
  { name: 'הרצליה', type: 'עיר', url: 'https://www.herzliya.muni.il/residents/business-licensing/' },
  { name: 'חולון', type: 'עיר', url: 'https://www.holon.muni.il/residents/business-licensing/' },
  { name: 'כפר סבא', type: 'עיר', url: 'https://www.kfar-saba.muni.il/residents/business-licensing/' },
  { name: 'מודיעין-מכבים-רעות', type: 'עיר', url: 'https://www.modiin.muni.il/residents/business-licensing/' },
  { name: 'נצרת', type: 'עיר', url: 'https://www.nazareth.muni.il/residents/business/' },
  { name: 'לוד', type: 'עיר', url: 'https://www.lod.muni.il/residents/business-licensing/' },
  { name: 'רמלה', type: 'עיר', url: 'https://www.ramla.muni.il/residents/business-licensing/' },
  { name: 'עכו', type: 'עיר', url: 'https://www.akko.muni.il/residents/business-licensing/' },
  { name: 'נהריה', type: 'עיר', url: 'https://www.nahariya.muni.il/residents/business-licensing/' },
  { name: 'רעננה', type: 'עיר', url: 'https://www.raanana.muni.il/residents/business-licensing/' },
  { name: 'הוד השרון', type: 'עיר', url: 'https://www.hod-hasharon.muni.il/residents/business-licensing/' },
  { name: 'גבעתיים', type: 'עיר', url: 'https://www.givatayim.muni.il/residents/business-licensing/' },
  { name: 'חדרה', type: 'עיר', url: 'https://www.hadera.muni.il/residents/business-licensing/' },
  { name: 'אילת', type: 'עיר', url: 'https://www.eilat.muni.il/residents/business-licensing/' },
  { name: 'קריית גת', type: 'עיר', url: 'https://www.kiryatgat.muni.il/residents/business-licensing/' },
  { name: 'קריית אתא', type: 'עיר', url: 'https://www.kiryat-ata.muni.il/residents/business-licensing/' },
  { name: 'קריית ביאליק', type: 'עיר', url: 'https://www.kiryat-bialik.muni.il/residents/business-licensing/' },
  { name: 'קריית מוצקין', type: 'עיר', url: 'https://www.kiryat-motzkin.muni.il/residents/business-licensing/' },
  { name: 'קריית ים', type: 'עיר', url: 'https://www.kiryat-yam.muni.il/residents/business-licensing/' },
  { name: 'קריית שמונה', type: 'עיר', url: 'https://www.qiryat-shemona.muni.il/residents/business-licensing/' },
  { name: 'טבריה', type: 'עיר', url: 'https://www.tiberias.muni.il/residents/business-licensing/' },
  { name: 'צפת', type: 'עיר', url: 'https://www.zefat.muni.il/residents/business-licensing/' },
  { name: 'דימונה', type: 'עיר', url: 'https://www.dimona.muni.il/residents/business-licensing/' },
  { name: 'אופקים', type: 'עיר', url: 'https://www.ofakim.muni.il/residents/business-licensing/' },
  { name: 'נתיבות', type: 'עיר', url: 'https://www.netivot.muni.il/residents/business-licensing/' },
  { name: 'שדרות', type: 'עיר', url: 'https://www.sderot.muni.il/residents/business-licensing/' },
  { name: 'טירת כרמל', type: 'עיר', url: 'https://www.tirat-carmel.muni.il/residents/business-licensing/' },
  { name: 'אום אל-פחם', type: 'עיר', url: 'https://www.umm-al-fahm.muni.il/residents/business-licensing/' },
  { name: 'סח\'נין', type: 'עיר', url: 'https://www.sakhnin.muni.il/residents/business-licensing/' },
  { name: 'טמרה', type: 'עיר', url: 'https://www.tamra.muni.il/residents/business-licensing/' },
  { name: 'ג\'לג\'וליה', type: 'עיר', url: 'https://www.jaljulia.muni.il/residents/business-licensing/' },
  { name: 'יבנה', type: 'עיר', url: 'https://www.yavne.muni.il/residents/business-licensing/' },
  { name: 'גדרה', type: 'עיר', url: 'https://www.gedera.muni.il/residents/business-licensing/' },
  { name: 'נס ציונה', type: 'עיר', url: 'https://www.nes-ziona.muni.il/residents/business-licensing/' },
  { name: 'אלעד', type: 'עיר', url: 'https://www.elad.muni.il/residents/business-licensing/' },
  { name: 'ביתר עילית', type: 'עיר', url: 'https://www.beitar-illit.muni.il/residents/business-licensing/' },
  { name: 'מעלה אדומים', type: 'עיר', url: 'https://www.maale-adumim.muni.il/residents/business-licensing/' },
  { name: 'מודיעין עילית', type: 'עיר', url: 'https://www.modi-in-ilit.muni.il/residents/business-licensing/' },
  { name: 'אריאל', type: 'עיר', url: 'https://www.ariel.muni.il/residents/business-licensing/' },
  // מועצות מקומיות
  { name: 'כפר יונה', type: 'מועצה מקומית', url: 'https://www.kfar-yona.muni.il/residents/business-licensing/' },
  { name: 'קלנסווה', type: 'מועצה מקומית', url: 'https://www.qalansawe.muni.il/residents/business-licensing/' },
  { name: 'מגדל העמק', type: 'מועצה מקומית', url: 'https://www.migdal-haemek.muni.il/residents/business-licensing/' },
  { name: 'נוף הגליל', type: 'מועצה מקומית', url: 'https://www.nofhagalil.muni.il/residents/business-licensing/' },
  { name: 'קריית מלאכי', type: 'מועצה מקומית', url: 'https://www.kiryat-malachi.muni.il/residents/business-licensing/' },
  { name: 'בית שאן', type: 'מועצה מקומית', url: 'https://www.beit-shean.muni.il/residents/business-licensing/' },
  { name: 'נשר', type: 'מועצה מקומית', url: 'https://www.nesher.muni.il/residents/business-licensing/' },
  { name: 'יוקנעם עילית', type: 'מועצה מקומית', url: 'https://www.yokneam.muni.il/residents/business-licensing/' },
  { name: 'כרמיאל', type: 'מועצה מקומית', url: 'https://www.karmiel.muni.il/residents/business-licensing/' },
  { name: 'מעלות-תרשיחא', type: 'מועצה מקומית', url: 'https://www.maalot.muni.il/residents/business-licensing/' },
  { name: 'רהט', type: 'מועצה מקומית', url: 'https://www.rahat.muni.il/residents/business-licensing/' },
  { name: 'ירוחם', type: 'מועצה מקומית', url: 'https://www.yeruham.muni.il/residents/business-licensing/' },
  { name: 'מצפה רמון', type: 'מועצה מקומית', url: 'https://www.mitzpe-ramon.muni.il/residents/business-licensing/' },
  { name: 'ערד', type: 'מועצה מקומית', url: 'https://www.arad.muni.il/residents/business-licensing/' },
  { name: 'קצרין', type: 'מועצה מקומית', url: 'https://www.katzrin.muni.il/residents/business-licensing/' },
  { name: 'חצור הגלילית', type: 'מועצה מקומית', url: 'https://www.hazor.muni.il/residents/business-licensing/' },
  { name: 'עפולה', type: 'מועצה מקומית', url: 'https://www.afula.muni.il/residents/business-licensing/' },
  { name: 'באקה אל-גרביה', type: 'מועצה מקומית', url: 'https://www.baqa.muni.il/residents/business-licensing/' },
  { name: 'ג\'סר א-זרקא', type: 'מועצה מקומית', url: 'https://www.jisr-az-zarqa.muni.il/residents/business-licensing/' },
  { name: 'פרדס חנה-כרכור', type: 'מועצה מקומית', url: 'https://www.pardes-hanna.muni.il/residents/business-licensing/' },
  { name: 'זכרון יעקב', type: 'מועצה מקומית', url: 'https://www.zichron-yaakov.muni.il/residents/business-licensing/' },
  { name: 'עמק יזרעאל', type: 'מועצה אזורית', url: 'https://www.emekjeezreel.muni.il/residents/business-licensing/' },
  { name: 'גוש דן', type: 'מועצה אזורית', url: 'https://www.gushdan.muni.il/residents/business-licensing/' },
  { name: 'שורקות', type: 'מועצה אזורית', url: 'https://www.shafir.muni.il/residents/business-licensing/' },
  { name: 'לכיש', type: 'מועצה אזורית', url: 'https://www.lachish.muni.il/residents/business-licensing/' },
  { name: 'אשכול', type: 'מועצה אזורית', url: 'https://www.eshkol.muni.il/residents/business-licensing/' },
  { name: 'בני שמעון', type: 'מועצה אזורית', url: 'https://www.bnei-shimon.muni.il/residents/business-licensing/' },
  { name: 'מרחבים', type: 'מועצה אזורית', url: 'https://www.merhavim.muni.il/residents/business-licensing/' },
  { name: 'שמעונים', type: 'מועצה אזורית', url: 'https://www.shimeoni.muni.il/residents/business-licensing/' },
  { name: 'רמת הנגב', type: 'מועצה אזורית', url: 'https://www.ramat-hanegev.muni.il/residents/business-licensing/' },
  { name: 'תמר', type: 'מועצה אזורית', url: 'https://www.tamar.muni.il/residents/business-licensing/' },
  { name: 'ערבות הירדן', type: 'מועצה אזורית', url: 'https://www.arvot-hayarden.muni.il/residents/business-licensing/' },
  { name: 'בקעת הירדן', type: 'מועצה אזורית', url: 'https://www.bika.muni.il/residents/business-licensing/' },
  { name: 'גולן', type: 'מועצה אזורית', url: 'https://www.golan.muni.il/residents/business-licensing/' },
  { name: 'מרום הגליל', type: 'מועצה אזורית', url: 'https://www.merom-hagalil.muni.il/residents/business-licensing/' },
  { name: 'מטה אשר', type: 'מועצה אזורית', url: 'https://www.mateasher.muni.il/residents/business-licensing/' },
  { name: 'זבולון', type: 'מועצה אזורית', url: 'https://www.zvulun.muni.il/residents/business-licensing/' },
  { name: 'חוף הכרמל', type: 'מועצה אזורית', url: 'https://www.hof-hacarmel.muni.il/residents/business-licensing/' },
  { name: 'מנשה', type: 'מועצה אזורית', url: 'https://www.menashe.muni.il/residents/business-licensing/' },
  { name: 'דרום השרון', type: 'מועצה אזורית', url: 'https://www.drom-hasharon.muni.il/residents/business-licensing/' },
  { name: 'לב השרון', type: 'מועצה אזורית', url: 'https://www.lev-hasharon.muni.il/residents/business-licensing/' },
  { name: 'חוף השרון', type: 'מועצה אזורית', url: 'https://www.hof-hasharon.muni.il/residents/business-licensing/' },
  { name: 'שרונים', type: 'מועצה אזורית', url: 'https://www.sharonim.muni.il/residents/business-licensing/' },
  { name: 'חבל מודיעין', type: 'מועצה אזורית', url: 'https://www.hevel-modiin.muni.il/residents/business-licensing/' },
  { name: 'גזר', type: 'מועצה אזורית', url: 'https://www.gezer.muni.il/residents/business-licensing/' },
  { name: 'שפלה', type: 'מועצה אזורית', url: 'https://www.shfela.muni.il/residents/business-licensing/' },
  { name: 'יואב', type: 'מועצה אזורית', url: 'https://www.yoav.muni.il/residents/business-licensing/' },
  { name: 'שפיר', type: 'מועצה אזורית', url: 'https://www.shafir.muni.il/residents/business-licensing/' },
];

const rows = settlements.map((s, i) => ({
  '#': i + 1,
  'שם יישוב': s.name,
  'סוג': s.type,
  'קישור לרישוי עסקים': s.url,
}));

const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });

// Set column widths
ws['!cols'] = [
  { wch: 5 },   // #
  { wch: 28 },  // שם יישוב
  { wch: 22 },  // סוג
  { wch: 70 },  // קישור
];

// Add hyperlinks
const range = XLSX.utils.decode_range(ws['!ref']);
for (let R = range.s.r + 1; R <= range.e.r; R++) {
  const cellRef = XLSX.utils.encode_cell({ r: R, c: 3 });
  if (ws[cellRef]) {
    ws[cellRef].l = { Target: ws[cellRef].v };
  }
}

// RTL direction
ws['!sheetView'] = { rightToLeft: true };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'יישובים');
XLSX.writeFile(wb, 'settlements-licensing.xlsx');
console.log(`✓ נוצר קובץ: settlements-licensing.xlsx (${settlements.length} יישובים)`);
