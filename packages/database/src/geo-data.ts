import type { Database } from './client';
import { wilayas, communes } from './schema/index';

export const WILAYAS_DATA = [
  { code: '01', nameAr: 'أدرار', nameFr: 'Adrar', region: 'South' },
  { code: '02', nameAr: 'الشلف', nameFr: 'Chlef', region: 'North-West' },
  { code: '03', nameAr: 'الأغواط', nameFr: 'Laghouat', region: 'South' },
  { code: '04', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi', region: 'East' },
  { code: '05', nameAr: 'باتنة', nameFr: 'Batna', region: 'East' },
  { code: '06', nameAr: 'بجاية', nameFr: 'Béjaïa', region: 'East' },
  { code: '07', nameAr: 'بسكرة', nameFr: 'Biskra', region: 'South-East' },
  { code: '08', nameAr: 'بشار', nameFr: 'Béchar', region: 'South-West' },
  { code: '09', nameAr: 'البليدة', nameFr: 'Blida', region: 'North-Center' },
  { code: '10', nameAr: 'البويرة', nameFr: 'Bouira', region: 'North-Center' },
  { code: '11', nameAr: 'تمنراست', nameFr: 'Tamanrasset', region: 'South' },
  { code: '12', nameAr: 'تبسة', nameFr: 'Tébessa', region: 'East' },
  { code: '13', nameAr: 'تلمسان', nameFr: 'Tlemcen', region: 'North-West' },
  { code: '14', nameAr: 'تيارت', nameFr: 'Tiaret', region: 'West' },
  { code: '15', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou', region: 'East' },
  { code: '16', nameAr: 'الجزائر', nameFr: 'Alger', region: 'North-Center' },
  { code: '17', nameAr: 'الجلفة', nameFr: 'Djelfa', region: 'South' },
  { code: '18', nameAr: 'جيجل', nameFr: 'Jijel', region: 'East' },
  { code: '19', nameAr: 'سطيف', nameFr: 'Sétif', region: 'East' },
  { code: '20', nameAr: 'سعيدة', nameFr: 'Saïda', region: 'West' },
  { code: '21', nameAr: 'سكيكدة', nameFr: 'Skikda', region: 'East' },
  { code: '22', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', region: 'West' },
  { code: '23', nameAr: 'عنابة', nameFr: 'Annaba', region: 'East' },
  { code: '24', nameAr: 'قالمة', nameFr: 'Guelma', region: 'East' },
  { code: '25', nameAr: 'قسنطينة', nameFr: 'Constantine', region: 'East' },
  { code: '26', nameAr: 'المدية', nameFr: 'Médéa', region: 'North-Center' },
  { code: '27', nameAr: 'مستغانم', nameFr: 'Mostaganem', region: 'West' },
  { code: '28', nameAr: 'المسيلة', nameFr: "M'Sila", region: 'East' },
  { code: '29', nameAr: 'معسكر', nameFr: 'Mascara', region: 'West' },
  { code: '30', nameAr: 'ورقلة', nameFr: 'Ouargla', region: 'South' },
  { code: '31', nameAr: 'وهران', nameFr: 'Oran', region: 'West' },
  { code: '32', nameAr: 'البيض', nameFr: 'El Bayadh', region: 'South-West' },
  { code: '33', nameAr: 'إيليزي', nameFr: 'Illizi', region: 'South' },
  { code: '34', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj', region: 'East' },
  { code: '35', nameAr: 'بومرداس', nameFr: 'Boumerdès', region: 'North-Center' },
  { code: '36', nameAr: 'الطارف', nameFr: 'El Tarf', region: 'East' },
  { code: '37', nameAr: 'تندوف', nameFr: 'Tindouf', region: 'South-West' },
  { code: '38', nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt', region: 'West' },
  { code: '39', nameAr: 'الوادي', nameFr: 'El Oued', region: 'South-East' },
  { code: '40', nameAr: 'خنشلة', nameFr: 'Khenchela', region: 'East' },
  { code: '41', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras', region: 'East' },
  { code: '42', nameAr: 'تيبازة', nameFr: 'Tipaza', region: 'North-Center' },
  { code: '43', nameAr: 'ميلة', nameFr: 'Mila', region: 'East' },
  { code: '44', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla', region: 'West' },
  { code: '45', nameAr: 'النعامة', nameFr: 'Naâma', region: 'South-West' },
  { code: '46', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent', region: 'West' },
  { code: '47', nameAr: 'غرداية', nameFr: 'Ghardaïa', region: 'South' },
  { code: '48', nameAr: 'غليزان', nameFr: 'Relizane', region: 'West' },
  { code: '49', nameAr: 'تيميمون', nameFr: 'Timimoun', region: 'South' },
  { code: '50', nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar', region: 'South' },
  { code: '51', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal', region: 'South-East' },
  { code: '52', nameAr: 'بني عباس', nameFr: 'Béni Abbès', region: 'South-West' },
  { code: '53', nameAr: 'عين صالح', nameFr: 'In Salah', region: 'South' },
  { code: '54', nameAr: 'عين قزام', nameFr: 'In Guezzam', region: 'South' },
  { code: '55', nameAr: 'تقرت', nameFr: 'Touggourt', region: 'South-East' },
  { code: '56', nameAr: 'جانت', nameFr: 'Djanet', region: 'South' },
  { code: '57', nameAr: 'المغير', nameFr: "El M'Ghair", region: 'South-East' },
  { code: '58', nameAr: 'المنيعة', nameFr: 'El Meniaa', region: 'South' },
];

export const ALGIERS_COMMUNES = [
  { code: '1601', wilayaCode: '16', nameAr: 'الجزائر الوسطى', nameFr: 'Alger-Centre', postalCode: '16000' },
  { code: '1602', wilayaCode: '16', nameAr: 'سيدي امحمد', nameFr: "Sidi M'Hamed", postalCode: '16010' },
  { code: '1603', wilayaCode: '16', nameAr: 'المدنية', nameFr: 'El Madania', postalCode: '16013' },
  { code: '1604', wilayaCode: '16', nameAr: 'حسين داي', nameFr: 'Hussein Dey', postalCode: '16040' },
  { code: '1605', wilayaCode: '16', nameAr: 'القصبة', nameFr: 'Casbah', postalCode: '16001' },
  { code: '1606', wilayaCode: '16', nameAr: 'باب الوادي', nameFr: 'Bab El Oued', postalCode: '16029' },
  { code: '1607', wilayaCode: '16', nameAr: 'بولوغين', nameFr: 'Bologhine', postalCode: '16030' },
  { code: '1608', wilayaCode: '16', nameAr: 'الحراش', nameFr: 'El Harrach', postalCode: '16200' },
  { code: '1609', wilayaCode: '16', nameAr: 'براقي', nameFr: 'Baraki', postalCode: '16045' },
  { code: '1610', wilayaCode: '16', nameAr: 'بئر مراد رايس', nameFr: 'Bir Mourad Raïs', postalCode: '16050' },
  { code: '1611', wilayaCode: '16', nameAr: 'بئر خادم', nameFr: 'Birkhadem', postalCode: '16035' },
  { code: '1612', wilayaCode: '16', nameAr: 'بوزريعة', nameFr: 'Bouzareah', postalCode: '16033' },
  { code: '1613', wilayaCode: '16', nameAr: 'الدار البيضاء', nameFr: 'Dar El Beïda', postalCode: '16100' },
  { code: '1614', wilayaCode: '16', nameAr: 'باب الزوار', nameFr: 'Bab Ezzouar', postalCode: '16110' },
  { code: '1615', wilayaCode: '16', nameAr: 'حيدرة', nameFr: 'Hydra', postalCode: '16035' },
  { code: '1616', wilayaCode: '16', nameAr: 'الرويبة', nameFr: 'Rouïba', postalCode: '16017' },
  { code: '1618', wilayaCode: '16', nameAr: 'زرالدة', nameFr: 'Zeralda', postalCode: '16063' },
  { code: '1619', wilayaCode: '16', nameAr: 'المرادية', nameFr: 'El Mouradia', postalCode: '16070' },
  { code: '1620', wilayaCode: '16', nameAr: 'بن عكنون', nameFr: 'Ben Aknoun', postalCode: '16030' },
];

export async function seedGeographicData(db: Database): Promise<void> {
  for (const w of WILAYAS_DATA) {
    await db
      .insert(wilayas)
      .values({
        code: w.code,
        nameAr: w.nameAr,
        nameFr: w.nameFr,
        nameEn: w.nameFr,
        region: w.region,
      })
      .onConflictDoNothing({ target: wilayas.code });
  }

  for (const c of ALGIERS_COMMUNES) {
    await db
      .insert(communes)
      .values({
        code: c.code,
        wilayaCode: c.wilayaCode,
        nameAr: c.nameAr,
        nameFr: c.nameFr,
        postalCode: c.postalCode,
      })
      .onConflictDoNothing({ target: communes.code });
  }
}
