/**
 * The 114 surahs in mushaf order.
 *
 * Every surah has a recitation now that audio comes from the Islamic Network
 * CDN, addressed purely by number. Earlier versions stored a per-surah audio
 * path and had to model "no recitation yet" as a separate case; that
 * distinction is gone, along with the disabled buttons it produced.
 */

import type { TranslationLanguage } from "@/lib/storage";

export interface Surah {
  readonly number: number;
  /** Bengali name, shown while the Bengali translation is selected. */
  readonly name: string;
  /**
   * English name, shown while English is selected. Spelled as AlQuran Cloud
   * spells it, so a surah reads the same in this list and in the ayah header,
   * which takes its name straight from that API.
   */
  readonly englishName: string;
}

export const SURAHS: readonly Surah[] = [
  { number: 1, name: "সূরা আল ফাতিহা", englishName: "Al-Faatiha" },
  { number: 2, name: "সূরা আল বাকারা", englishName: "Al-Baqara" },
  { number: 3, name: "সূরা আল ইমরান", englishName: "Aal-i-Imraan" },
  { number: 4, name: "সূরা আন নিসা", englishName: "An-Nisaa" },
  { number: 5, name: "সূরা আল মায়িদা", englishName: "Al-Maaida" },
  { number: 6, name: "সূরা আল আন'আম", englishName: "Al-An'aam" },
  { number: 7, name: "সূরা আল আরাফ", englishName: "Al-A'raaf" },
  { number: 8, name: "সূরা আল আনফাল", englishName: "Al-Anfaal" },
  { number: 9, name: "সূরা আত তওবা", englishName: "At-Tawba" },
  { number: 10, name: "সূরা ইউনুস", englishName: "Yunus" },
  { number: 11, name: "সূরা হুদ", englishName: "Hud" },
  { number: 12, name: "সূরা ইউসুফ", englishName: "Yusuf" },
  { number: 13, name: "সূরা আর রাদ", englishName: "Ar-Ra'd" },
  { number: 14, name: "সূরা ইব্রাহিম", englishName: "Ibrahim" },
  { number: 15, name: "সূরা আল হিজর", englishName: "Al-Hijr" },
  { number: 16, name: "সূরা আন নাহল", englishName: "An-Nahl" },
  { number: 17, name: "সূরা বনী ইসরাইল", englishName: "Al-Israa" },
  { number: 18, name: "সূরা আল কাহফ", englishName: "Al-Kahf" },
  { number: 19, name: "সূরা মারইয়াম", englishName: "Maryam" },
  { number: 20, name: "সূরা তা-হা", englishName: "Taa-Haa" },
  { number: 21, name: "সূরা আল আম্বিয়া", englishName: "Al-Anbiyaa" },
  { number: 22, name: "সূরা আল হাজ্জ", englishName: "Al-Hajj" },
  { number: 23, name: "সূরা আল মুমিনূন", englishName: "Al-Muminoon" },
  { number: 24, name: "সূরা আন নূর", englishName: "An-Noor" },
  { number: 25, name: "সূরা আল ফুরকান", englishName: "Al-Furqaan" },
  { number: 26, name: "সূরা আশ শুআরা", englishName: "Ash-Shu'araa" },
  { number: 27, name: "সূরা আন নামল", englishName: "An-Naml" },
  { number: 28, name: "সূরা আল কাসাস", englishName: "Al-Qasas" },
  { number: 29, name: "সূরা আল আনকাবুত", englishName: "Al-Ankaboot" },
  { number: 30, name: "সূরা আর রুম", englishName: "Ar-Room" },
  { number: 31, name: "সূরা লোকমান", englishName: "Luqman" },
  { number: 32, name: "সূরা আস সাজদাহ", englishName: "As-Sajda" },
  { number: 33, name: "সূরা আল আহযাব", englishName: "Al-Ahzaab" },
  { number: 34, name: "সূরা সাবা", englishName: "Saba" },
  { number: 35, name: "সূরা ফাতির", englishName: "Faatir" },
  { number: 36, name: "সূরা ইয়াসিন", englishName: "Yaseen" },
  { number: 37, name: "সূরা আস সাফফাত", englishName: "As-Saaffaat" },
  { number: 38, name: "সূরা সাদ", englishName: "Saad" },
  { number: 39, name: "সূরা আজ জুমার", englishName: "Az-Zumar" },
  { number: 40, name: "সূরা আল মুমিন", englishName: "Ghafir" },
  { number: 41, name: "সূরা হা-মীম আস সাজদাহ", englishName: "Fussilat" },
  { number: 42, name: "সূরা আশ শূরা", englishName: "Ash-Shura" },
  { number: 43, name: "সূরা আয যুখরুফ", englishName: "Az-Zukhruf" },
  { number: 44, name: "সূরা আদ দোখান", englishName: "Ad-Dukhaan" },
  { number: 45, name: "সূরা আল জাসিয়া", englishName: "Al-Jaathiya" },
  { number: 46, name: "সূরা আল আহকাফ", englishName: "Al-Ahqaf" },
  { number: 47, name: "সূরা মুহাম্মাদ", englishName: "Muhammad" },
  { number: 48, name: "সূরা আল ফাতহ", englishName: "Al-Fath" },
  { number: 49, name: "সূরা আল হুজুরাত", englishName: "Al-Hujuraat" },
  { number: 50, name: "সূরা ক্বাফ", englishName: "Qaaf" },
  { number: 51, name: "সূরা আয যারিয়াত", englishName: "Adh-Dhaariyat" },
  { number: 52, name: "সূরা আত তুর", englishName: "At-Tur" },
  { number: 53, name: "সূরা আন নজম", englishName: "An-Najm" },
  { number: 54, name: "সূরা আল কামার", englishName: "Al-Qamar" },
  { number: 55, name: "সূরা আর রহমান", englishName: "Ar-Rahmaan" },
  { number: 56, name: "সূরা আল ওয়াকিয়া", englishName: "Al-Waaqia" },
  { number: 57, name: "সূরা আল হাদিদ", englishName: "Al-Hadid" },
  { number: 58, name: "সূরা আল মুজাদিলা", englishName: "Al-Mujaadila" },
  { number: 59, name: "সূরা আল হাশর", englishName: "Al-Hashr" },
  { number: 60, name: "সূরা আল মুমতাহিনা", englishName: "Al-Mumtahana" },
  { number: 61, name: "সূরা আস সফ", englishName: "As-Saff" },
  { number: 62, name: "সূরা আল জুমা", englishName: "Al-Jumu'a" },
  { number: 63, name: "সূরা আল মুনাফিকুন", englishName: "Al-Munaafiqoon" },
  { number: 64, name: "সূরা আত তাগাবুন", englishName: "At-Taghaabun" },
  { number: 65, name: "সূরা আত তালাক", englishName: "At-Talaaq" },
  { number: 66, name: "সূরা আত তাহরিম", englishName: "At-Tahrim" },
  { number: 67, name: "সূরা আল মুলক", englishName: "Al-Mulk" },
  { number: 68, name: "সূরা আল কলম", englishName: "Al-Qalam" },
  { number: 69, name: "সূরা আল হাক্কা", englishName: "Al-Haaqqa" },
  { number: 70, name: "সূরা আল মাআরিজ", englishName: "Al-Ma'aarij" },
  { number: 71, name: "সূরা নুহ", englishName: "Nooh" },
  { number: 72, name: "সূরা আল জিন", englishName: "Al-Jinn" },
  { number: 73, name: "সূরা আল মুযযাম্মিল", englishName: "Al-Muzzammil" },
  { number: 74, name: "সূরা আল মুদ্দাসসির", englishName: "Al-Muddaththir" },
  { number: 75, name: "সূরা আল ক্বিয়ামাহ", englishName: "Al-Qiyaama" },
  { number: 76, name: "সূরা আল ইনসান", englishName: "Al-Insaan" },
  { number: 77, name: "সূরা আল মুরসালাত", englishName: "Al-Mursalaat" },
  { number: 78, name: "সূরা আন নাবা", englishName: "An-Naba" },
  { number: 79, name: "সূরা আন নাযিয়াত", englishName: "An-Naazi'aat" },
  { number: 80, name: "সূরা আবাসা", englishName: "Abasa" },
  { number: 81, name: "সূরা আত তাকভীর", englishName: "At-Takwir" },
  { number: 82, name: "সূরা আল ইনফিতার", englishName: "Al-Infitaar" },
  { number: 83, name: "সূরা আল মুতাফফিফিন", englishName: "Al-Mutaffifin" },
  { number: 84, name: "সূরা আল ইনশিকাক", englishName: "Al-Inshiqaaq" },
  { number: 85, name: "সূরা আল বুরূজ", englishName: "Al-Burooj" },
  { number: 86, name: "সূরা আত তারিক", englishName: "At-Taariq" },
  { number: 87, name: "সূরা আল আ'লা", englishName: "Al-A'laa" },
  { number: 88, name: "সূরা আল গাশিয়া", englishName: "Al-Ghaashiya" },
  { number: 89, name: "সূরা আল ফাজর", englishName: "Al-Fajr" },
  { number: 90, name: "সূরা আল বালাদ", englishName: "Al-Balad" },
  { number: 91, name: "সূরা আশ শামস", englishName: "Ash-Shams" },
  { number: 92, name: "সূরা আল লাইল", englishName: "Al-Lail" },
  { number: 93, name: "সূরা আদ দুহা", englishName: "Ad-Dhuhaa" },
  { number: 94, name: "সূরা আশ শারহ", englishName: "Ash-Sharh" },
  { number: 95, name: "সূরা আত তীন", englishName: "At-Tin" },
  { number: 96, name: "সূরা আল আলাক", englishName: "Al-Alaq" },
  { number: 97, name: "সূরা আল ক্বদর", englishName: "Al-Qadr" },
  { number: 98, name: "সূরা আল বাইয়্যিনাহ", englishName: "Al-Bayyina" },
  { number: 99, name: "সূরা আয যালযালাহ", englishName: "Az-Zalzala" },
  { number: 100, name: "সূরা আল আদিয়াত", englishName: "Al-Aadiyaat" },
  { number: 101, name: "সূরা আল কারিয়াহ", englishName: "Al-Qaari'a" },
  { number: 102, name: "সূরা আত তাকাসুর", englishName: "At-Takaathur" },
  { number: 103, name: "সূরা আল আসর", englishName: "Al-Asr" },
  { number: 104, name: "সূরা আল হুমাযাহ", englishName: "Al-Humaza" },
  { number: 105, name: "সূরা আল ফীল", englishName: "Al-Fil" },
  { number: 106, name: "সূরা কুরাইশ", englishName: "Quraish" },
  { number: 107, name: "সূরা আল মাউন", englishName: "Al-Maa'un" },
  { number: 108, name: "সূরা আল কাউসার", englishName: "Al-Kawthar" },
  { number: 109, name: "সূরা আল কাফিরুন", englishName: "Al-Kaafiroon" },
  { number: 110, name: "সূরা আন নাসর", englishName: "An-Nasr" },
  { number: 111, name: "সূরা আল মাসাদ", englishName: "Al-Masad" },
  { number: 112, name: "সূরা আল ইখলাস", englishName: "Al-Ikhlaas" },
  { number: 113, name: "সূরা আল ফালাক", englishName: "Al-Falaq" },
  { number: 114, name: "সূরা আন নাস", englishName: "An-Naas" },
];

export function findSurah(number: number): Surah | undefined {
  return SURAHS.find((surah) => surah.number === number);
}

/** Al-Fatiha. What the play button starts when nothing has been chosen. */
export const FIRST_SURAH: Surah = {
  number: 1,
  name: "সূরা আল ফাতিহা",
  englishName: "Al-Faatiha",
};

/** The surah's name in whichever language the reader has selected. */
export function surahNameIn(surah: Surah, language: TranslationLanguage): string {
  return language === "en" ? surah.englishName : surah.name;
}
