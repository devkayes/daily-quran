/**
 * The 114 surahs in mushaf order. A surah either has a recitation
 * available or it does not, and the discriminated union below makes that
 * checkable: reading `audioPath` off an unavailable surah is a type error,
 * which is what the old `isLive` boolean could not express.
 *
 * Generated once from the v1 `manager/surah-provider.js` list; edit here now.
 */

export interface SurahWithAudio {
  readonly number: number;
  readonly name: string;
  /** Path relative to `env.audioBaseUrl`. */
  readonly audioPath: string;
}

export interface SurahWithoutAudio {
  readonly number: number;
  readonly name: string;
  readonly audioPath?: undefined;
}

export type Surah = SurahWithAudio | SurahWithoutAudio;

export function hasAudio(surah: Surah): surah is SurahWithAudio {
  return surah.audioPath !== undefined;
}

export const SURAHS: readonly Surah[] = [
  { number: 1, name: "সূরা আল ফাতিহা", audioPath: "/1-fatiha.mp3" },
  { number: 2, name: "সূরা আল বাকারা", audioPath: "/2-bakara-64k.mp3" },
  { number: 3, name: "সূরা আল ইমরান", audioPath: "/3-imraan-64k.mp3" },
  { number: 4, name: "সূরা আন নিসা", audioPath: "/4-nisa-64k.mp3" },
  { number: 5, name: "সূরা আল মায়িদা", audioPath: "/5-maida-64k.mp3" },
  { number: 6, name: "সূরা আল আন'আম", audioPath: "/6-anam-64k.mp3" },
  { number: 7, name: "সূরা আল আরাফ" },
  { number: 8, name: "সূরা আল আনফাল" },
  { number: 9, name: "সূরা আত তওবা" },
  { number: 10, name: "সূরা ইউনুস" },
  { number: 11, name: "সূরা হুদ" },
  { number: 12, name: "সূরা ইউসুফ" },
  { number: 13, name: "সূরা আর রাদ" },
  { number: 14, name: "সূরা ইব্রাহিম" },
  { number: 15, name: "সূরা আল হিজর" },
  { number: 16, name: "সূরা আন নাহল" },
  { number: 17, name: "সূরা বনী ইসরাইল" },
  { number: 18, name: "সূরা আল কাহফ" },
  { number: 19, name: "সূরা মারইয়াম" },
  { number: 20, name: "সূরা তা-হা" },
  { number: 21, name: "সূরা আল আম্বিয়া" },
  { number: 22, name: "সূরা আল হাজ্জ" },
  { number: 23, name: "সূরা আল মুমিনূন" },
  { number: 24, name: "সূরা আন নূর" },
  { number: 25, name: "সূরা আল ফুরকান" },
  { number: 26, name: "সূরা আশ শুআরা" },
  { number: 27, name: "সূরা আন নামল" },
  { number: 28, name: "সূরা আল কাসাস" },
  { number: 29, name: "সূরা আল আনকাবুত" },
  { number: 30, name: "সূরা আর রুম" },
  { number: 31, name: "সূরা লোকমান" },
  { number: 32, name: "সূরা আস সাজদাহ" },
  { number: 33, name: "সূরা আল আহযাব" },
  { number: 34, name: "সূরা সাবা" },
  { number: 35, name: "সূরা ফাতির" },
  { number: 36, name: "সূরা ইয়াসিন", audioPath: "/36-yasin-64k.mp3" },
  { number: 37, name: "সূরা আস সাফফাত" },
  { number: 38, name: "সূরা সাদ" },
  { number: 39, name: "সূরা আজ জুমার" },
  { number: 40, name: "সূরা আল মুমিন" },
  { number: 41, name: "সূরা হা-মীম আস সাজদাহ" },
  { number: 42, name: "সূরা আশ শূরা" },
  { number: 43, name: "সূরা আয যুখরুফ" },
  { number: 44, name: "সূরা আদ দোখান" },
  { number: 45, name: "সূরা আল জাসিয়া" },
  { number: 46, name: "সূরা আল আহকাফ" },
  { number: 47, name: "সূরা মুহাম্মাদ" },
  { number: 48, name: "সূরা আল ফাতহ" },
  { number: 49, name: "সূরা আল হুজুরাত" },
  { number: 50, name: "সূরা ক্বাফ" },
  { number: 51, name: "সূরা আয যারিয়াত" },
  { number: 52, name: "সূরা আত তুর" },
  { number: 53, name: "সূরা আন নজম" },
  { number: 54, name: "সূরা আল কামার" },
  { number: 55, name: "সূরা আর রহমান", audioPath: "/55-ar-rahmahn-64k.mp3" },
  { number: 56, name: "সূরা আল ওয়াকিয়া" },
  { number: 57, name: "সূরা আল হাদিদ" },
  { number: 58, name: "সূরা আল মুজাদিলা" },
  { number: 59, name: "সূরা আল হাশর" },
  { number: 60, name: "সূরা আল মুমতাহিনা" },
  { number: 61, name: "সূরা আস সফ" },
  { number: 62, name: "সূরা আল জুমা" },
  { number: 63, name: "সূরা আল মুনাফিকুন" },
  { number: 64, name: "সূরা আত তাগাবুন" },
  { number: 65, name: "সূরা আত তালাক" },
  { number: 66, name: "সূরা আত তাহরিম" },
  { number: 67, name: "সূরা আল মুলক", audioPath: "/67-al-mulk-64k.mp3" },
  { number: 68, name: "সূরা আল কলম" },
  { number: 69, name: "সূরা আল হাক্কা" },
  { number: 70, name: "সূরা আল মাআরিজ" },
  { number: 71, name: "সূরা নুহ" },
  { number: 72, name: "সূরা আল জিন" },
  { number: 73, name: "সূরা আল মুযযাম্মিল" },
  { number: 74, name: "সূরা আল মুদ্দাসসির" },
  { number: 75, name: "সূরা আল ক্বিয়ামাহ" },
  { number: 76, name: "সূরা আল ইনসান" },
  { number: 77, name: "সূরা আল মুরসালাত" },
  { number: 78, name: "সূরা আন নাবা" },
  { number: 79, name: "সূরা আন নাযিয়াত" },
  { number: 80, name: "সূরা আবাসা" },
  { number: 81, name: "সূরা আত তাকভীর" },
  { number: 82, name: "সূরা আল ইনফিতার" },
  { number: 83, name: "সূরা আল মুতাফফিফিন" },
  { number: 84, name: "সূরা আল ইনশিকাক" },
  { number: 85, name: "সূরা আল বুরূজ" },
  { number: 86, name: "সূরা আত তারিক" },
  { number: 87, name: "সূরা আল আ'লা" },
  { number: 88, name: "সূরা আল গাশিয়া" },
  { number: 89, name: "সূরা আল ফাজর" },
  { number: 90, name: "সূরা আল বালাদ", audioPath: "/90-balad.mp3" },
  { number: 91, name: "সূরা আশ শামস", audioPath: "/91-shams.mp3" },
  { number: 92, name: "সূরা আল লাইল", audioPath: "/92-layel.mp3" },
  { number: 93, name: "সূরা আদ দুহা", audioPath: "/93-duha.mp3" },
  { number: 94, name: "সূরা আশ শারহ", audioPath: "/94-insirah.mp3" },
  { number: 95, name: "সূরা আত তীন", audioPath: "/95-teen.mp3" },
  { number: 96, name: "সূরা আল আলাক", audioPath: "/96-alak.mp3" },
  { number: 97, name: "সূরা আল ক্বদর", audioPath: "/97-kodor.mp3" },
  { number: 98, name: "সূরা আল বাইয়্যিনাহ", audioPath: "/98-bayeenah.mp3" },
  { number: 99, name: "সূরা আয যালযালাহ", audioPath: "/99-jiljal.mp3" },
  { number: 100, name: "সূরা আল আদিয়াত", audioPath: "/100-adiyath.mp3" },
  { number: 101, name: "সূরা আল কারিয়াহ" },
  { number: 102, name: "সূরা আত তাকাসুর", audioPath: "/102-taksur.mp3" },
  { number: 103, name: "সূরা আল আসর", audioPath: "/103-asaer.mp3" },
  { number: 104, name: "সূরা আল হুমাযাহ", audioPath: "/104-humaja.mp3" },
  { number: 105, name: "সূরা আল ফীল", audioPath: "/105-al-feel.mp3" },
  { number: 106, name: "সূরা কুরাইশ", audioPath: "/106-quraish.mp3" },
  { number: 107, name: "সূরা আল মাউন", audioPath: "/107-maun.mp3" },
  { number: 108, name: "সূরা আল কাউসার", audioPath: "/108-kausar.mp3" },
  { number: 109, name: "সূরা আল কাফিরুন", audioPath: "/109-kafirun.mp3" },
  { number: 110, name: "সূরা আন নাসর", audioPath: "/110-nasar.mp3" },
  { number: 111, name: "সূরা আল মাসাদ", audioPath: "/111-lahab.mp3" },
  { number: 112, name: "সূরা আল ইখলাস", audioPath: "/112-ikhlas.mp3" },
  { number: 113, name: "সূরা আল ফালাক", audioPath: "/113-falakh.mp3" },
  { number: 114, name: "সূরা আন নাস", audioPath: "/114-naas.mp3" },
];

/** Surahs with a recitation first, each group keeping its numeric order. */
export const SURAHS_AUDIO_FIRST: readonly Surah[] = [...SURAHS].sort((a, b) => {
  const byAudio = Number(hasAudio(b)) - Number(hasAudio(a));
  return byAudio !== 0 ? byAudio : a.number - b.number;
});

export function findSurah(number: number): Surah | undefined {
  return SURAHS.find((surah) => surah.number === number);
}

export const FIRST_PLAYABLE_SURAH: SurahWithAudio = (() => {
  const first = SURAHS.find(hasAudio);
  if (!first) throw new Error("No surah has a recitation configured.");
  return first;
})();
