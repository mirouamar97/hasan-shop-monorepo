export interface WilayaRecord {
  code: string;
  nameAr: string;
  nameFr: string;
  region: string | null;
}

export interface CommuneRecord {
  code: string;
  wilayaCode: string;
  nameAr: string;
  nameFr: string;
  postalCode: string | null;
  dairaAr: string | null;
  dairaFr: string | null;
}

export interface IGeoRepository {
  findAllWilayas(): Promise<WilayaRecord[]>;
  findCommunesByWilaya(wilayaCode: string): Promise<CommuneRecord[]>;
}
