export interface CountryInfo {
  code: string;
  nameAr: string;
  shortNameAr: string;
  nameEn: string;
  flag: string;
  dialCode: string;
  cleanDialCode: string;
  aliases: string[];
  example: string;
  isArab?: boolean;
  isGCC?: boolean;
  region?: "gcc" | "arab" | "europe" | "asia" | "americas" | "africa" | "oceania";
}

export const COUNTRIES_DATA: CountryInfo[] = [
  // =================== دول مجلس التعاون الخليجي ===================
  {
    code: "SA",
    nameAr: "المملكة العربية السعودية",
    shortNameAr: "السعودية",
    nameEn: "Saudi Arabia",
    flag: "🇸🇦",
    dialCode: "+966",
    cleanDialCode: "966",
    aliases: ["سعودي", "سعودية", "السعودية", "المملكة", "المملكة العربية السعودية", "saudi", "ksa", "sa"],
    example: "+966 50 123 4567",
    isArab: true,
    isGCC: true,
    region: "gcc"
  },
  {
    code: "AE",
    nameAr: "الإمارات العربية المتحدة",
    shortNameAr: "الإمارات",
    nameEn: "United Arab Emirates",
    flag: "🇦🇪",
    dialCode: "+971",
    cleanDialCode: "971",
    aliases: ["امارات", "الإمارات", "اماراتي", "إماراتي", "دبي", "أبوظبي", "uae", "ae", "emirates"],
    example: "+971 50 123 4567",
    isArab: true,
    isGCC: true,
    region: "gcc"
  },
  {
    code: "KW",
    nameAr: "دولة الكويت",
    shortNameAr: "الكويت",
    nameEn: "Kuwait",
    flag: "🇰🇼",
    dialCode: "+965",
    cleanDialCode: "965",
    aliases: ["كويت", "الكويت", "كويتي", "كويتية", "kuwait", "kw"],
    example: "+965 9123 4567",
    isArab: true,
    isGCC: true,
    region: "gcc"
  },
  {
    code: "QA",
    nameAr: "دولة قطر",
    shortNameAr: "قطر",
    nameEn: "Qatar",
    flag: "🇶🇦",
    dialCode: "+974",
    cleanDialCode: "974",
    aliases: ["قطر", "قطري", "قطرية", "دولة قطر", "qatar", "qa"],
    example: "+974 5512 3456",
    isArab: true,
    isGCC: true,
    region: "gcc"
  },
  {
    code: "BH",
    nameAr: "مملكة البحرين",
    shortNameAr: "البحرين",
    nameEn: "Bahrain",
    flag: "🇧🇭",
    dialCode: "+973",
    cleanDialCode: "973",
    aliases: ["بحرين", "البحرين", "بحريني", "بحرينية", "bahrain", "bh"],
    example: "+973 3912 3456",
    isArab: true,
    isGCC: true,
    region: "gcc"
  },
  {
    code: "OM",
    nameAr: "سلطنة عمان",
    shortNameAr: "عمان",
    nameEn: "Oman",
    flag: "🇴🇲",
    dialCode: "+968",
    cleanDialCode: "968",
    aliases: ["عمان", "عُمان", "سلطنة عمان", "عماني", "عمانية", "oman", "om"],
    example: "+968 9123 4567",
    isArab: true,
    isGCC: true,
    region: "gcc"
  },

  // =================== باقي الدول العربية (شمال أفريقيا، الشام، النيل، القرن الأفريقي) ===================
  {
    code: "EG",
    nameAr: "جمهورية مصر العربية",
    shortNameAr: "مصر",
    nameEn: "Egypt",
    flag: "🇪🇬",
    dialCode: "+20",
    cleanDialCode: "20",
    aliases: ["مصر", "مصري", "مصرية", "جمهورية مصر العربية", "egypt", "eg"],
    example: "+20 10 1234 5678",
    isArab: true,
    region: "arab"
  },
  {
    code: "JO",
    nameAr: "المملكة الأردنية الهاشمية",
    shortNameAr: "الأردن",
    nameEn: "Jordan",
    flag: "🇯🇴",
    dialCode: "+962",
    cleanDialCode: "962",
    aliases: ["اردن", "أردن", "الاردن", "الأردن", "اردني", "أردني", "أردنية", "jordan", "jo"],
    example: "+962 7 9123 4567",
    isArab: true,
    region: "arab"
  },
  {
    code: "IQ",
    nameAr: "جمهورية العراق",
    shortNameAr: "العراق",
    nameEn: "Iraq",
    flag: "🇮🇶",
    dialCode: "+964",
    cleanDialCode: "964",
    aliases: ["عراق", "العراق", "عراقي", "عراقية", "iraq", "iq"],
    example: "+964 770 123 4567",
    isArab: true,
    region: "arab"
  },
  {
    code: "YE",
    nameAr: "الجمهورية اليمنية",
    shortNameAr: "اليمن",
    nameEn: "Yemen",
    flag: "🇾🇪",
    dialCode: "+967",
    cleanDialCode: "967",
    aliases: ["يمن", "اليمن", "يمني", "يمنية", "yemen", "ye"],
    example: "+967 771 234 567",
    isArab: true,
    region: "arab"
  },
  {
    code: "SY",
    nameAr: "الجمهورية العربية السورية",
    shortNameAr: "سوريا",
    nameEn: "Syria",
    flag: "🇸🇾",
    dialCode: "+963",
    cleanDialCode: "963",
    aliases: ["سوريا", "سورية", "سوري", "سوريه", "syria", "sy"],
    example: "+963 944 123 456",
    isArab: true,
    region: "arab"
  },
  {
    code: "LB",
    nameAr: "الجمهورية اللبنانية",
    shortNameAr: "لبنان",
    nameEn: "Lebanon",
    flag: "🇱🇧",
    dialCode: "+961",
    cleanDialCode: "961",
    aliases: ["لبنان", "لبناني", "لبنانية", "lebanon", "lb"],
    example: "+961 70 123 456",
    isArab: true,
    region: "arab"
  },
  {
    code: "PS",
    nameAr: "دولة فلسطين",
    shortNameAr: "فلسطين",
    nameEn: "Palestine",
    flag: "🇵🇸",
    dialCode: "+970",
    cleanDialCode: "970",
    aliases: ["فلسطين", "فلسطيني", "فلسطينية", "غزة", "القدس", "palestine", "ps"],
    example: "+970 59 123 4567",
    isArab: true,
    region: "arab"
  },
  {
    code: "SD",
    nameAr: "جمهورية السودان",
    shortNameAr: "السودان",
    nameEn: "Sudan",
    flag: "🇸🇩",
    dialCode: "+249",
    cleanDialCode: "249",
    aliases: ["سودان", "السودان", "سوداني", "سودانية", "sudan", "sd"],
    example: "+249 91 234 5678",
    isArab: true,
    region: "arab"
  },
  {
    code: "DZ",
    nameAr: "الجمهورية الجزائرية الديمقراطية الشعبية",
    shortNameAr: "الجزائر",
    nameEn: "Algeria",
    flag: "🇩🇿",
    dialCode: "+213",
    cleanDialCode: "213",
    aliases: ["جزائر", "الجزائر", "جزائري", "جزائرية", "algeria", "dz"],
    example: "+213 551 23 45 67",
    isArab: true,
    region: "arab"
  },
  {
    code: "MA",
    nameAr: "المملكة المغربية",
    shortNameAr: "المغرب",
    nameEn: "Morocco",
    flag: "🇲🇦",
    dialCode: "+212",
    cleanDialCode: "212",
    aliases: ["مغرب", "المغرب", "مغربي", "مغربية", "morocco", "ma"],
    example: "+212 661 234 567",
    isArab: true,
    region: "arab"
  },
  {
    code: "TN",
    nameAr: "الجمهورية التونسية",
    shortNameAr: "تونس",
    nameEn: "Tunisia",
    flag: "🇹🇳",
    dialCode: "+216",
    cleanDialCode: "216",
    aliases: ["تونس", "تونسي", "تونسية", "tunisia", "tn"],
    example: "+216 98 123 456",
    isArab: true,
    region: "arab"
  },
  {
    code: "LY",
    nameAr: "دولة ليبيا",
    shortNameAr: "ليبيا",
    nameEn: "Libya",
    flag: "🇱🇾",
    dialCode: "+218",
    cleanDialCode: "218",
    aliases: ["ليبيا", "ليبي", "ليبية", "libya", "ly"],
    example: "+218 91 123 4567",
    isArab: true,
    region: "arab"
  },
  {
    code: "MR",
    nameAr: "الجمهورية الإسلامية الموريتانية",
    shortNameAr: "موريتانيا",
    nameEn: "Mauritania",
    flag: "🇲🇷",
    dialCode: "+222",
    cleanDialCode: "222",
    aliases: ["موريتانيا", "موريتاني", "موريتانية", "شنقيط", "mauritania", "mr"],
    example: "+222 45 12 34 56",
    isArab: true,
    region: "arab"
  },
  {
    code: "SO",
    nameAr: "جمهورية الصومال الفيدرالية",
    shortNameAr: "الصومال",
    nameEn: "Somalia",
    flag: "🇸🇴",
    dialCode: "+252",
    cleanDialCode: "252",
    aliases: ["صومال", "الصومال", "صومالي", "صومالية", "somalia", "so"],
    example: "+252 61 123 4567",
    isArab: true,
    region: "arab"
  },
  {
    code: "DJ",
    nameAr: "جمهورية جيبوتي",
    shortNameAr: "جيبوتي",
    nameEn: "Djibouti",
    flag: "🇩🇯",
    dialCode: "+253",
    cleanDialCode: "253",
    aliases: ["جيبوتي", "جيبوتية", "جيبوتي", "djibouti", "dj"],
    example: "+253 77 12 34 56",
    isArab: true,
    region: "arab"
  },
  {
    code: "KM",
    nameAr: "الاتحاد القمري (جزر القمر)",
    shortNameAr: "جزر القمر",
    nameEn: "Comoros",
    flag: "🇰🇲",
    dialCode: "+269",
    cleanDialCode: "269",
    aliases: ["جزر القمر", "قمري", "القمر", "comoros", "km"],
    example: "+269 321 2345",
    isArab: true,
    region: "arab"
  },

  // =================== الدول الآسيوية والإسلامية والعالمية ===================
  {
    code: "TR",
    nameAr: "الجمهورية التركية",
    shortNameAr: "تركيا",
    nameEn: "Turkey",
    flag: "🇹🇷",
    dialCode: "+90",
    cleanDialCode: "90",
    aliases: ["تركيا", "تركي", "تركية", "turkey", "tr", "turkiye"],
    example: "+90 532 123 4567",
    region: "asia"
  },
  {
    code: "IN",
    nameAr: "جمهورية الهند",
    shortNameAr: "الهند",
    nameEn: "India",
    flag: "🇮🇳",
    dialCode: "+91",
    cleanDialCode: "91",
    aliases: ["هند", "الهند", "هندي", "هندية", "india", "in"],
    example: "+91 98765 43210",
    region: "asia"
  },
  {
    code: "PK",
    nameAr: "جمهورية باكستان الإسلامية",
    shortNameAr: "باكستان",
    nameEn: "Pakistan",
    flag: "🇵🇰",
    dialCode: "+92",
    cleanDialCode: "92",
    aliases: ["باكستان", "باكستاني", "باكستانية", "pakistan", "pk"],
    example: "+92 300 1234567",
    region: "asia"
  },
  {
    code: "BD",
    nameAr: "جمهورية بنغلاديش الشعبية",
    shortNameAr: "بنغلاديش",
    nameEn: "Bangladesh",
    flag: "🇧🇩",
    dialCode: "+880",
    cleanDialCode: "880",
    aliases: ["بنغلاديش", "بنغلادش", "بنغالي", "بنغالية", "bangladesh", "bd"],
    example: "+880 1712 345678",
    region: "asia"
  },
  {
    code: "ID",
    nameAr: "جمهورية إندونيسيا",
    shortNameAr: "إندونيسيا",
    nameEn: "Indonesia",
    flag: "🇮🇩",
    dialCode: "+62",
    cleanDialCode: "62",
    aliases: ["اندونيسيا", "إندونيسيا", "اندونيسي", "إندونيسي", "إندونيسية", "indonesia", "id"],
    example: "+62 812 3456 789",
    region: "asia"
  },
  {
    code: "MY",
    nameAr: "ماليزيا",
    shortNameAr: "ماليزيا",
    nameEn: "Malaysia",
    flag: "🇲🇾",
    dialCode: "+60",
    cleanDialCode: "60",
    aliases: ["ماليزيا", "ماليزي", "ماليزية", "malaysia", "my"],
    example: "+60 12 345 6789",
    region: "asia"
  },
  {
    code: "PH",
    nameAr: "جمهورية الفلبين",
    shortNameAr: "الفلبين",
    nameEn: "Philippines",
    flag: "🇵🇭",
    dialCode: "+63",
    cleanDialCode: "63",
    aliases: ["فلبين", "الفلبين", "فلبيني", "فلبينية", "philippines", "ph"],
    example: "+63 917 123 4567",
    region: "asia"
  },
  {
    code: "CN",
    nameAr: "جمهورية الصين الشعبية",
    shortNameAr: "الصين",
    nameEn: "China",
    flag: "🇨🇳",
    dialCode: "+86",
    cleanDialCode: "86",
    aliases: ["صين", "الصين", "صيني", "صينية", "china", "cn"],
    example: "+86 138 0013 8000",
    region: "asia"
  },
  {
    code: "JP",
    nameAr: "اليابان",
    shortNameAr: "اليابان",
    nameEn: "Japan",
    flag: "🇯🇵",
    dialCode: "+81",
    cleanDialCode: "81",
    aliases: ["يابان", "اليابان", "ياباني", "يابانية", "japan", "jp"],
    example: "+81 90 1234 5678",
    region: "asia"
  },
  {
    code: "KR",
    nameAr: "جمهورية كوريا الجنوبية",
    shortNameAr: "كوريا الجنوبية",
    nameEn: "South Korea",
    flag: "🇰🇷",
    dialCode: "+82",
    cleanDialCode: "82",
    aliases: ["كوريا", "كوريا الجنوبية", "كوري", "كورية", "korea", "kr", "south korea"],
    example: "+82 10 1234 5678",
    region: "asia"
  },
  {
    code: "TH",
    nameAr: "مملكة تايلاند",
    shortNameAr: "تايلاند",
    nameEn: "Thailand",
    flag: "🇹🇭",
    dialCode: "+66",
    cleanDialCode: "66",
    aliases: ["تايلاند", "تايلند", "تايلاندي", "thailand", "th"],
    example: "+66 81 234 5678",
    region: "asia"
  },
  {
    code: "VN",
    nameAr: "جمهورية فيتنام الاشتراكية",
    shortNameAr: "فيتنام",
    nameEn: "Vietnam",
    flag: "🇻🇳",
    dialCode: "+84",
    cleanDialCode: "84",
    aliases: ["فيتنام", "فيتنامي", "vietnam", "vn"],
    example: "+84 91 234 5678",
    region: "asia"
  },
  {
    code: "SG",
    nameAr: "جمهورية سنغافورة",
    shortNameAr: "سنغافورة",
    nameEn: "Singapore",
    flag: "🇸🇬",
    dialCode: "+65",
    cleanDialCode: "65",
    aliases: ["سنغافورة", "سنغافوري", "singapore", "sg"],
    example: "+65 9123 4567",
    region: "asia"
  },
  {
    code: "LK",
    nameAr: "جمهورية سريلانكا",
    shortNameAr: "سريلانكا",
    nameEn: "Sri Lanka",
    flag: "🇱🇰",
    dialCode: "+94",
    cleanDialCode: "94",
    aliases: ["سريلانكا", "سري لانكا", "سيلان", "سريلانكي", "sri lanka", "lk"],
    example: "+94 71 234 5678",
    region: "asia"
  },
  {
    code: "NP",
    nameAr: "جمهورية نيبال الديمقراطية",
    shortNameAr: "نيبال",
    nameEn: "Nepal",
    flag: "🇳🇵",
    dialCode: "+977",
    cleanDialCode: "977",
    aliases: ["نيبال", "نيبالي", "nepal", "np"],
    example: "+977 981 2345678",
    region: "asia"
  },
  {
    code: "AF",
    nameAr: "أفغانستان",
    shortNameAr: "أفغانستان",
    nameEn: "Afghanistan",
    flag: "🇦🇫",
    dialCode: "+93",
    cleanDialCode: "93",
    aliases: ["افغانستان", "أفغانستان", "افغاني", "أفغاني", "afghanistan", "af"],
    example: "+93 70 123 4567",
    region: "asia"
  },
  {
    code: "IR",
    nameAr: "الجمهورية الإسلامية الإيرانية",
    shortNameAr: "إيران",
    nameEn: "Iran",
    flag: "🇮🇷",
    dialCode: "+98",
    cleanDialCode: "98",
    aliases: ["ايران", "إيران", "ايراني", "إيراني", "iran", "ir"],
    example: "+98 912 345 6789",
    region: "asia"
  },
  {
    code: "UZ",
    nameAr: "جمهورية أوزبكستان",
    shortNameAr: "أوزبكستان",
    nameEn: "Uzbekistan",
    flag: "🇺🇿",
    dialCode: "+998",
    cleanDialCode: "998",
    aliases: ["اوزبكستان", "أوزبكستان", "اوزبكي", "أوزبكي", "uzbekistan", "uz"],
    example: "+998 90 123 45 67",
    region: "asia"
  },
  {
    code: "KZ",
    nameAr: "جمهورية كازاخستان",
    shortNameAr: "كازاخستان",
    nameEn: "Kazakhstan",
    flag: "🇰🇿",
    dialCode: "+7",
    cleanDialCode: "7",
    aliases: ["كازاخستان", "كازاخستاني", "kazakhstan", "kz"],
    example: "+7 701 123 4567",
    region: "asia"
  },
  {
    code: "AZ",
    nameAr: "جمهورية أذربيجان",
    shortNameAr: "أذربيجان",
    nameEn: "Azerbaijan",
    flag: "🇦🇿",
    dialCode: "+994",
    cleanDialCode: "994",
    aliases: ["اذربيجان", "أذربيجان", "اذري", "azerbaijan", "az"],
    example: "+994 50 123 45 67",
    region: "asia"
  },
  {
    code: "GE",
    nameAr: "جورجيا",
    shortNameAr: "جورجيا",
    nameEn: "Georgia",
    flag: "🇬🇪",
    dialCode: "+995",
    cleanDialCode: "995",
    aliases: ["جورجيا", "جورجي", "georgia", "ge"],
    example: "+995 599 12 34 56",
    region: "asia"
  },
  {
    code: "KG",
    nameAr: "جمهورية قيرغيزستان",
    shortNameAr: "قيرغيزستان",
    nameEn: "Kyrgyzstan",
    flag: "🇰🇬",
    dialCode: "+996",
    cleanDialCode: "996",
    aliases: ["قيرغيزستان", "قيرغيزي", "kyrgyzstan", "kg"],
    example: "+996 555 123 456",
    region: "asia"
  },
  {
    code: "TJ",
    nameAr: "جمهورية طاجيكستان",
    shortNameAr: "طاجيكستان",
    nameEn: "Tajikistan",
    flag: "🇹🇯",
    dialCode: "+992",
    cleanDialCode: "992",
    aliases: ["طاجيكستان", "طاجيكي", "tajikistan", "tj"],
    example: "+992 918 12 34 56",
    region: "asia"
  },
  {
    code: "TM",
    nameAr: "تركمانستان",
    shortNameAr: "تركمانستان",
    nameEn: "Turkmenistan",
    flag: "🇹🇲",
    dialCode: "+993",
    cleanDialCode: "993",
    aliases: ["تركمانستان", "تركماني", "turkmenistan", "tm"],
    example: "+993 65 12 34 56",
    region: "asia"
  },
  {
    code: "MV",
    nameAr: "جمهورية المالديف",
    shortNameAr: "المالديف",
    nameEn: "Maldives",
    flag: "🇲🇻",
    dialCode: "+960",
    cleanDialCode: "960",
    aliases: ["المالديف", "مالديف", "جزر المالديف", "maldives", "mv"],
    example: "+960 791 2345",
    region: "asia"
  },

  // =================== دول أوروبا ===================
  {
    code: "GB",
    nameAr: "المملكة المتحدة (بريطانيا)",
    shortNameAr: "المملكة المتحدة",
    nameEn: "United Kingdom",
    flag: "🇬🇧",
    dialCode: "+44",
    cleanDialCode: "44",
    aliases: ["بريطانيا", "المملكة المتحدة", "انجلترا", "إنجلترا", "بريطاني", "إنجليزي", "uk", "gb", "britain", "england"],
    example: "+44 7911 123456",
    region: "europe"
  },
  {
    code: "DE",
    nameAr: "جمهورية ألمانيا الاتحادية",
    shortNameAr: "ألمانيا",
    nameEn: "Germany",
    flag: "🇩🇪",
    dialCode: "+49",
    cleanDialCode: "49",
    aliases: ["المانيا", "ألمانيا", "الماني", "ألماني", "ألمانية", "germany", "de"],
    example: "+49 151 12345678",
    region: "europe"
  },
  {
    code: "FR",
    nameAr: "الجمهورية الفرنسية",
    shortNameAr: "فرنسا",
    nameEn: "France",
    flag: "🇫🇷",
    dialCode: "+33",
    cleanDialCode: "33",
    aliases: ["فرنسا", "فرنسي", "فرنسية", "france", "fr"],
    example: "+33 6 12 34 56 78",
    region: "europe"
  },
  {
    code: "IT",
    nameAr: "الجمهورية الإيطالية",
    shortNameAr: "إيطاليا",
    nameEn: "Italy",
    flag: "🇮🇹",
    dialCode: "+39",
    cleanDialCode: "39",
    aliases: ["ايطاليا", "إيطاليا", "ايطالي", "إيطالي", "إيطالية", "italy", "it"],
    example: "+39 333 123 4567",
    region: "europe"
  },
  {
    code: "ES",
    nameAr: "مملكة إسبانيا",
    shortNameAr: "إسبانيا",
    nameEn: "Spain",
    flag: "🇪🇸",
    dialCode: "+34",
    cleanDialCode: "34",
    aliases: ["اسبانيا", "إسبانيا", "اسباني", "إسباني", "إسبانية", "spain", "es"],
    example: "+34 612 34 56 78",
    region: "europe"
  },
  {
    code: "RU",
    nameAr: "روسيا الاتحادية",
    shortNameAr: "روسيا",
    nameEn: "Russia",
    flag: "🇷🇺",
    dialCode: "+7",
    cleanDialCode: "7",
    aliases: ["روسيا", "روسي", "روسية", "russia", "ru"],
    example: "+7 912 345 67 89",
    region: "europe"
  },
  {
    code: "CH",
    nameAr: "الاتحاد السويسري",
    shortNameAr: "سويسرا",
    nameEn: "Switzerland",
    flag: "🇨🇭",
    dialCode: "+41",
    cleanDialCode: "41",
    aliases: ["سويسرا", "سويسري", "سويسرية", "switzerland", "ch"],
    example: "+41 79 123 45 67",
    region: "europe"
  },
  {
    code: "NL",
    nameAr: "مملكة هولندا",
    shortNameAr: "هولندا",
    nameEn: "Netherlands",
    flag: "🇳🇱",
    dialCode: "+31",
    cleanDialCode: "31",
    aliases: ["هولندا", "هولندي", "هولندية", "netherlands", "holland", "nl"],
    example: "+31 6 12345678",
    region: "europe"
  },
  {
    code: "BE",
    nameAr: "مملكة بلجيكا",
    shortNameAr: "بلجيكا",
    nameEn: "Belgium",
    flag: "🇧🇪",
    dialCode: "+32",
    cleanDialCode: "32",
    aliases: ["بلجيكا", "بلجيكي", "بلجيكية", "belgium", "be"],
    example: "+32 470 12 34 56",
    region: "europe"
  },
  {
    code: "AT",
    nameAr: "جمهورية النمسا",
    shortNameAr: "النمسا",
    nameEn: "Austria",
    flag: "🇦🇹",
    dialCode: "+43",
    cleanDialCode: "43",
    aliases: ["النمسا", "نمسا", "نمساوي", "نمساوية", "austria", "at"],
    example: "+43 664 1234567",
    region: "europe"
  },
  {
    code: "SE",
    nameAr: "مملكة السويد",
    shortNameAr: "السويد",
    nameEn: "Sweden",
    flag: "🇸🇪",
    dialCode: "+46",
    cleanDialCode: "46",
    aliases: ["السويد", "سويد", "سويدي", "سويدية", "sweden", "se"],
    example: "+46 70 123 45 67",
    region: "europe"
  },
  {
    code: "NO",
    nameAr: "مملكة النرويج",
    shortNameAr: "النرويج",
    nameEn: "Norway",
    flag: "🇳🇴",
    dialCode: "+47",
    cleanDialCode: "47",
    aliases: ["النرويج", "نرويج", "نرويجي", "نرويجية", "norway", "no"],
    example: "+47 412 34 567",
    region: "europe"
  },
  {
    code: "DK",
    nameAr: "مملكة الدنمارك",
    shortNameAr: "الدنمارك",
    nameEn: "Denmark",
    flag: "🇩🇰",
    dialCode: "+45",
    cleanDialCode: "45",
    aliases: ["الدنمارك", "دنمارك", "دنماركي", "دنماركية", "denmark", "dk"],
    example: "+45 20 12 34 56",
    region: "europe"
  },
  {
    code: "FI",
    nameAr: "جمهورية فنلندا",
    shortNameAr: "فنلندا",
    nameEn: "Finland",
    flag: "🇫🇮",
    dialCode: "+358",
    cleanDialCode: "358",
    aliases: ["فنلندا", "فنلندي", "finland", "fi"],
    example: "+358 40 1234567",
    region: "europe"
  },
  {
    code: "IE",
    nameAr: "جمهورية أيرلندا",
    shortNameAr: "أيرلندا",
    nameEn: "Ireland",
    flag: "🇮🇪",
    dialCode: "+353",
    cleanDialCode: "353",
    aliases: ["ايرلندا", "أيرلندا", "ايرلندي", "أيرلندي", "ireland", "ie"],
    example: "+353 85 123 4567",
    region: "europe"
  },
  {
    code: "PL",
    nameAr: "جمهورية بولندا",
    shortNameAr: "بولندا",
    nameEn: "Poland",
    flag: "🇵🇱",
    dialCode: "+48",
    cleanDialCode: "48",
    aliases: ["بولندا", "بولندي", "بولندية", "poland", "pl"],
    example: "+48 501 234 567",
    region: "europe"
  },
  {
    code: "PT",
    nameAr: "الجمهورية البرتغالية",
    shortNameAr: "البرتغال",
    nameEn: "Portugal",
    flag: "🇵🇹",
    dialCode: "+351",
    cleanDialCode: "351",
    aliases: ["البرتغال", "برتغال", "برتغالي", "برتغالية", "portugal", "pt"],
    example: "+351 912 345 678",
    region: "europe"
  },
  {
    code: "GR",
    nameAr: "الجمهورية الهيلينية (اليونان)",
    shortNameAr: "اليونان",
    nameEn: "Greece",
    flag: "🇬🇷",
    dialCode: "+30",
    cleanDialCode: "30",
    aliases: ["اليونان", "يونان", "يوناني", "يونانية", "greece", "gr"],
    example: "+30 691 234 5678",
    region: "europe"
  },
  {
    code: "CZ",
    nameAr: "جمهورية التشيك",
    shortNameAr: "التشيك",
    nameEn: "Czech Republic",
    flag: "🇨🇿",
    dialCode: "+420",
    cleanDialCode: "420",
    aliases: ["التشيك", "تشيك", "تشيكي", "czech", "cz"],
    example: "+420 601 123 456",
    region: "europe"
  },
  {
    code: "RO",
    nameAr: "رومانيا",
    shortNameAr: "رومانيا",
    nameEn: "Romania",
    flag: "🇷🇴",
    dialCode: "+40",
    cleanDialCode: "40",
    aliases: ["رومانيا", "روماني", "romania", "ro"],
    example: "+40 712 345 678",
    region: "europe"
  },
  {
    code: "HU",
    nameAr: "المجر (هنغاريا)",
    shortNameAr: "المجر",
    nameEn: "Hungary",
    flag: "🇭🇺",
    dialCode: "+36",
    cleanDialCode: "36",
    aliases: ["المجر", "هنغاريا", "مجري", "hungary", "hu"],
    example: "+36 20 123 4567",
    region: "europe"
  },
  {
    code: "UA",
    nameAr: "أوكرانيا",
    shortNameAr: "أوكرانيا",
    nameEn: "Ukraine",
    flag: "🇺🇦",
    dialCode: "+380",
    cleanDialCode: "380",
    aliases: ["اوكرانيا", "أوكرانيا", "اوكراني", "ukraine", "ua"],
    example: "+380 50 123 4567",
    region: "europe"
  },
  {
    code: "BA",
    nameAr: "البوسنة والهرسك",
    shortNameAr: "البوسنة والهرسك",
    nameEn: "Bosnia and Herzegovina",
    flag: "🇧🇦",
    dialCode: "+387",
    cleanDialCode: "387",
    aliases: ["البوسنة", "بوسنة", "بوسني", "bosnia", "ba"],
    example: "+387 61 123 456",
    region: "europe"
  },
  {
    code: "AL",
    nameAr: "جمهورية ألبانيا",
    shortNameAr: "ألبانيا",
    nameEn: "Albania",
    flag: "🇦🇱",
    dialCode: "+355",
    cleanDialCode: "355",
    aliases: ["البانيا", "ألبانيا", "الباني", "albania", "al"],
    example: "+355 67 123 4567",
    region: "europe"
  },
  {
    code: "CY",
    nameAr: "جمهورية قبرص",
    shortNameAr: "قبرص",
    nameEn: "Cyprus",
    flag: "🇨🇾",
    dialCode: "+357",
    cleanDialCode: "357",
    aliases: ["قبرص", "قبرصي", "cyprus", "cy"],
    example: "+357 96 123456",
    region: "europe"
  },

  // =================== قارة أمريكا الشمالية والجنوبية ===================
  {
    code: "US",
    nameAr: "الولايات المتحدة الأمريكية",
    shortNameAr: "أمريكا",
    nameEn: "United States",
    flag: "🇺🇸",
    dialCode: "+1",
    cleanDialCode: "1",
    aliases: ["امريكا", "أمريكا", "الولايات المتحدة", "امريكي", "أمريكي", "أمريكية", "usa", "us", "united states"],
    example: "+1 202 555 0123",
    region: "americas"
  },
  {
    code: "CA",
    nameAr: "كندا",
    shortNameAr: "كندا",
    nameEn: "Canada",
    flag: "🇨🇦",
    dialCode: "+1",
    cleanDialCode: "1",
    aliases: ["كندا", "كندي", "كندية", "canada", "ca"],
    example: "+1 416 555 0199",
    region: "americas"
  },
  {
    code: "BR",
    nameAr: "جمهورية البرازيل الاتحادية",
    shortNameAr: "البرازيل",
    nameEn: "Brazil",
    flag: "🇧🇷",
    dialCode: "+55",
    cleanDialCode: "55",
    aliases: ["البرازيل", "برازيل", "برازيلي", "برازيلية", "brazil", "br"],
    example: "+55 11 91234 5678",
    region: "americas"
  },
  {
    code: "MX",
    nameAr: "الولايات المكسيكية المتحدة",
    shortNameAr: "المكسيك",
    nameEn: "Mexico",
    flag: "🇲🇽",
    dialCode: "+52",
    cleanDialCode: "52",
    aliases: ["المكسيك", "مكسيك", "مكسيكي", "mexico", "mx"],
    example: "+52 55 1234 5678",
    region: "americas"
  },
  {
    code: "AR",
    nameAr: "جمهورية الأرجنتين",
    shortNameAr: "الأرجنتين",
    nameEn: "Argentina",
    flag: "🇦🇷",
    dialCode: "+54",
    cleanDialCode: "54",
    aliases: ["الارجنتين", "الأرجنتين", "ارجنتيني", "argentina", "ar"],
    example: "+54 9 11 1234 5678",
    region: "americas"
  },
  {
    code: "CO",
    nameAr: "جمهورية كولومبيا",
    shortNameAr: "كولومبيا",
    nameEn: "Colombia",
    flag: "🇨🇴",
    dialCode: "+57",
    cleanDialCode: "57",
    aliases: ["كولومبيا", "كولومبي", "colombia", "co"],
    example: "+57 300 123 4567",
    region: "americas"
  },
  {
    code: "CL",
    nameAr: "جمهورية تشيلي",
    shortNameAr: "تشيلي",
    nameEn: "Chile",
    flag: "🇨🇱",
    dialCode: "+56",
    cleanDialCode: "56",
    aliases: ["تشيلي", "شيلي", "تشيلي", "chile", "cl"],
    example: "+56 9 1234 5678",
    region: "americas"
  },

  // =================== قارة أفريقيا ===================
  {
    code: "NG",
    nameAr: "جمهورية نيجيريا الاتحادية",
    shortNameAr: "نيجيريا",
    nameEn: "Nigeria",
    flag: "🇳🇬",
    dialCode: "+234",
    cleanDialCode: "234",
    aliases: ["نيجيريا", "نيجيري", "nigeria", "ng"],
    example: "+234 802 123 4567",
    region: "africa"
  },
  {
    code: "ET",
    nameAr: "جمهورية إثيوبيا الفيدرالية الديمقراطية",
    shortNameAr: "إثيوبيا",
    nameEn: "Ethiopia",
    flag: "🇪🇹",
    dialCode: "+251",
    cleanDialCode: "251",
    aliases: ["اثيوبيا", "إثيوبيا", "حبشة", "اثيوبي", "أثيوبي", "حبشي", "ethiopia", "et"],
    example: "+251 91 123 4567",
    region: "africa"
  },
  {
    code: "ZA",
    nameAr: "جمهورية جنوب أفريقيا",
    shortNameAr: "جنوب أفريقيا",
    nameEn: "South Africa",
    flag: "🇿🇦",
    dialCode: "+27",
    cleanDialCode: "27",
    aliases: ["جنوب افريقيا", "جنوب أفريقيا", "south africa", "za"],
    example: "+27 82 123 4567",
    region: "africa"
  },
  {
    code: "KE",
    nameAr: "جمهورية كينيا",
    shortNameAr: "كينيا",
    nameEn: "Kenya",
    flag: "🇰🇪",
    dialCode: "+254",
    cleanDialCode: "254",
    aliases: ["كينيا", "كيني", "kenya", "ke"],
    example: "+254 712 345678",
    region: "africa"
  },
  {
    code: "GH",
    nameAr: "جمهورية غانا",
    shortNameAr: "غانا",
    nameEn: "Ghana",
    flag: "🇬🇭",
    dialCode: "+233",
    cleanDialCode: "233",
    aliases: ["غانا", "غاني", "ghana", "gh"],
    example: "+233 24 123 4567",
    region: "africa"
  },
  {
    code: "TZ",
    nameAr: "جمهورية تنزانيا الاتحادية",
    shortNameAr: "تنزانيا",
    nameEn: "Tanzania",
    flag: "🇹🇿",
    dialCode: "+255",
    cleanDialCode: "255",
    aliases: ["تنزانيا", "تنزاني", "زنجبار", "tanzania", "tz"],
    example: "+255 712 345 678",
    region: "africa"
  },
  {
    code: "UG",
    nameAr: "جمهورية أوغندا",
    shortNameAr: "أوغندا",
    nameEn: "Uganda",
    flag: "🇺🇬",
    dialCode: "+256",
    cleanDialCode: "256",
    aliases: ["اوغندا", "أوغندا", "اوغندي", "uganda", "ug"],
    example: "+256 772 123456",
    region: "africa"
  },
  {
    code: "SN",
    nameAr: "جمهورية السنغال",
    shortNameAr: "السنغال",
    nameEn: "Senegal",
    flag: "🇸🇳",
    dialCode: "+221",
    cleanDialCode: "221",
    aliases: ["السنغال", "سنغال", "سنغالي", "senegal", "sn"],
    example: "+221 77 123 45 67",
    region: "africa"
  },
  {
    code: "ML",
    nameAr: "جمهورية مالي",
    shortNameAr: "مالي",
    nameEn: "Mali",
    flag: "🇲🇱",
    dialCode: "+223",
    cleanDialCode: "223",
    aliases: ["مالي", "مالي", "mali", "ml"],
    example: "+223 76 12 34 56",
    region: "africa"
  },
  {
    code: "NE",
    nameAr: "جمهورية النيجر",
    shortNameAr: "النيجر",
    nameEn: "Niger",
    flag: "🇳🇪",
    dialCode: "+227",
    cleanDialCode: "227",
    aliases: ["النيجر", "نيجر", "niger", "ne"],
    example: "+227 96 12 34 56",
    region: "africa"
  },
  {
    code: "TD",
    nameAr: "جمهورية تشاد",
    shortNameAr: "تشاد",
    nameEn: "Chad",
    flag: "🇹🇩",
    dialCode: "+235",
    cleanDialCode: "235",
    aliases: ["تشاد", "تشادي", "chad", "td"],
    example: "+235 66 12 34 56",
    region: "africa"
  },
  {
    code: "GN",
    nameAr: "جمهورية غينيا",
    shortNameAr: "غينيا",
    nameEn: "Guinea",
    flag: "🇬🇳",
    dialCode: "+224",
    cleanDialCode: "224",
    aliases: ["غينيا", "غيني", "guinea", "gn"],
    example: "+224 622 12 34 56",
    region: "africa"
  },
  {
    code: "CI",
    nameAr: "جمهورية كوت ديفوار (ساحل العاج)",
    shortNameAr: "ساحل العاج",
    nameEn: "Ivory Coast",
    flag: "🇨🇮",
    dialCode: "+225",
    cleanDialCode: "225",
    aliases: ["ساحل العاج", "كوت ديفوار", "ivory coast", "ci"],
    example: "+225 07 12 34 56 78",
    region: "africa"
  },
  {
    code: "CM",
    nameAr: "جمهورية الكاميرون",
    shortNameAr: "الكاميرون",
    nameEn: "Cameroon",
    flag: "🇨🇲",
    dialCode: "+237",
    cleanDialCode: "237",
    aliases: ["الكاميرون", "كاميرون", "كاميروني", "cameroon", "cm"],
    example: "+237 671 23 45 67",
    region: "africa"
  },

  // =================== قارة أوقيانوسيا وأستراليا ===================
  {
    code: "AU",
    nameAr: "كومنولث أستراليا",
    shortNameAr: "أستراليا",
    nameEn: "Australia",
    flag: "🇦🇺",
    dialCode: "+61",
    cleanDialCode: "61",
    aliases: ["استراليا", "أستراليا", "استرالي", "أسترالي", "australia", "au"],
    example: "+61 412 345 678",
    region: "oceania"
  },
  {
    code: "NZ",
    nameAr: "نيوزيلندا",
    shortNameAr: "نيوزيلندا",
    nameEn: "New Zealand",
    flag: "🇳🇿",
    dialCode: "+64",
    cleanDialCode: "64",
    aliases: ["نيوزيلندا", "نيوزيلاند", "نيوزيلندي", "new zealand", "nz"],
    example: "+64 21 123 4567",
    region: "oceania"
  }
];

// Helper to normalize text for search (removes tashkeel, standardizes arabic letters)
export function normalizeSearchText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "") // Tashkeel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s\-_+]+/g, " ");
}

// Find country by dialing code (supports +966, 00966, 966, 20, 971, etc.)
export function findCountryByDialCode(input: string): CountryInfo | null {
  if (!input) return null;
  const cleaned = input.replace(/[^\d+]/g, "").trim();
  if (!cleaned) return null;

  // Standardize: if starts with 00, replace with +
  let num = cleaned;
  if (num.startsWith("00")) {
    num = "+" + num.substring(2);
  }

  // Sort countries by longest dial code first to match +880 before +8 or +966 before +96
  const sorted = [...COUNTRIES_DATA].sort((a, b) => b.cleanDialCode.length - a.cleanDialCode.length);

  for (const country of sorted) {
    if (num.startsWith(country.dialCode) || num.startsWith("+" + country.cleanDialCode) || num.startsWith(country.cleanDialCode)) {
      return country;
    }
  }

  return null;
}

// Find country by text name or nationality alias
export function findCountryByNameOrText(text: string): CountryInfo | null {
  if (!text) return null;
  const norm = normalizeSearchText(text);
  if (!norm) return null;

  // 1. Direct match with nameAr, shortNameAr, nameEn, or cleanDialCode
  for (const c of COUNTRIES_DATA) {
    const normNameAr = normalizeSearchText(c.nameAr);
    const normShortAr = normalizeSearchText(c.shortNameAr);
    const normNameEn = normalizeSearchText(c.nameEn);
    
    if (
      norm === normNameAr || 
      norm === normShortAr || 
      norm === normNameEn || 
      norm === c.cleanDialCode || 
      norm === c.dialCode.toLowerCase()
    ) {
      return c;
    }
  }

  // 2. Search aliases
  for (const c of COUNTRIES_DATA) {
    for (const alias of c.aliases) {
      const normAlias = normalizeSearchText(alias);
      if (norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm)) {
        return c;
      }
    }
  }

  // 3. Partial inclusion match
  for (const c of COUNTRIES_DATA) {
    const normShortAr = normalizeSearchText(c.shortNameAr);
    if (norm.includes(normShortAr) || normShortAr.includes(norm)) {
      return c;
    }
  }

  return null;
}

// Attach / change dial code to a phone number cleanly
export function formatPhoneWithCountryCode(currentPhone: string, targetCountry: CountryInfo): string {
  if (!targetCountry) return currentPhone;
  const targetCode = targetCountry.dialCode; // e.g. "+966"
  
  if (!currentPhone || !currentPhone.trim()) {
    return targetCode;
  }

  let cleaned = currentPhone.replace(/[^\d+]/g, "").trim();

  // If already starts with 00, standardize to +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.substring(2);
  }

  // Find if current phone already has a dial code
  const existingCountry = findCountryByDialCode(cleaned);

  if (existingCountry) {
    // Strip existing country dial code
    let withoutCode = cleaned;
    if (withoutCode.startsWith(existingCountry.dialCode)) {
      withoutCode = withoutCode.substring(existingCountry.dialCode.length);
    } else if (withoutCode.startsWith("+" + existingCountry.cleanDialCode)) {
      withoutCode = withoutCode.substring(existingCountry.cleanDialCode.length + 1);
    } else if (withoutCode.startsWith(existingCountry.cleanDialCode)) {
      withoutCode = withoutCode.substring(existingCountry.cleanDialCode.length);
    }
    
    // Remove leading zero if any
    withoutCode = withoutCode.replace(/^0+/, "");
    return `${targetCode}${withoutCode}`;
  } else {
    // Current phone doesn't have an identified country code, strip leading zero and attach
    const digitsOnly = cleaned.replace(/[^\d]/g, "").replace(/^0+/, "");
    return `${targetCode}${digitsOnly}`;
  }
}
