/**
 * Translation Service Abstraction Layer
 * Supports local dynamic dictionary translations and future integration with
 * Google Cloud Translation API / external machine translation services.
 */

import { LanguageCode } from '../../shared/types';

export interface ITranslationService {
  translateText(text: string, targetLang: LanguageCode): Promise<string>;
  getLocalizedData<T extends Record<string, any>>(item: T, lang: LanguageCode): T;
}

/**
 * Local Translation Dictionary for Dynamic Model Data
 * (Mock events, alert messages, learning descriptions, etc.)
 */
const dynamicDictionary: Record<string, { hi: string; mr: string }> = {
  // Alert Titles & Messages
  'High Brood Temperature Warning (38.6°C)': {
    hi: 'भीतरी तापमान अधिक होने की चेतावनी (38.6°C)',
    mr: 'अंतर्गत तापमान वाढल्याची सतर्कता (38.6°C)',
  },
  'Brood temperature exceeded safety threshold of 35.5°C for 3 consecutive hours. Worker bees are actively fanning.': {
    hi: 'भीतरी तापमान लगातार 3 घंटे से 35.5°C की सुरक्षित सीमा से ऊपर है। श्रमिक मक्खियां पंख फड़फड़ा रही हैं।',
    mr: 'अंतर्गत तापमान सलग 3 तास 35.5°C च्या सुरक्षित मर्यादेपेक्षा जास्त राहिले आहे. कामकरी माश्या हवा घालत आहेत.',
  },
  'Provide additional canopy shade over Box H023 and ensure nearby freshwater trough is filled to prevent brood overheating.': {
    hi: 'बॉक्स H023 पर छायादार छप्पर लगाएं और भीतरी अति-तपिश रोकने के लिए पास में ताजे पानी की व्यवस्था करें।',
    mr: 'पेटी H023 वर सावली करा आणि पोळे जास्त गरम होऊ नये म्हणून जवळच पिण्याच्या स्वच्छ पाण्याची व्यवस्था करा.',
  },
  'Abrupt Weight Loss Alert (-2.4 kg)': {
    hi: 'अचानक वजन घटने की चेतावनी (-2.4 किलो)',
    mr: 'पेटीचे वजन अचानक कमी झाल्याची सूचना (-2.4 किलो)',
  },
  'Sudden hive mass drop detected between 13:00 and 14:30. Acoustic sensors recorded swarming flight frequencies (>600 Hz).': {
    hi: 'दोपहर 13:00 से 14:30 के बीच बक्से का वजन अचानक गिरा। ध्वनि सेंसर ने झुंड उड़ने की आवृत्ति (>600 Hz) दर्ज की।',
    mr: 'दुपारी 13:00 ते 14:30 दरम्यान पेटीचे वजन अचानक कमी झाले. ध्वनी सेन्सरने माश्या पोळे सोडत असल्याच्या फ्रिक्वेन्सी (>600 Hz) नोंदवल्या.',
  },
  'Immediate field inspection needed: Check for departed swarm cluster on nearby tree branches to recapture queen.': {
    hi: 'तत्काल निरीक्षण आवश्यक: रानी मक्खी को पुनः पकड़ने के लिए पास के पेड़ों की टहनियों पर उड़े हुए झुंड की जांच करें।',
    mr: 'तातडीने प्रत्यक्ष पाहणी करा: राणी माशी पुन्हा पकडण्यासाठी जवळच्या झाडांच्या फांद्यांवर बसलेला माश्यांचा घोळका शोधा.',
  },

  // Traceability Timeline Events
  'Hive Digital Identity Minted': {
    hi: 'हाइव डिजिटल पहचान ब्लॉकचेन पर अंकित',
    mr: 'पोळ्याची डिजिटल ओळख ब्लॉकचेनवर नोंदवली',
  },
  'Continuous IoT Colony Production': {
    hi: 'निरंतर आईओटी कॉलोनी उत्पादन निगरानी',
    mr: 'आयओटीद्वारे मध निर्मितीचे अखंड निरीक्षण',
  },
  'Manual Comb Frame Extraction': {
    hi: 'छत्ते से शहद निष्कासन',
    mr: 'पोळ्यातून मधाच्या फ्रेम्स काढल्या',
  },
  'Cold Centrifugal Extraction': {
    hi: 'कोल्ड सेंट्रीफ्यूगल निष्कासन (बिना गर्म किए)',
    mr: 'कोल्ड सेंट्रीफ्यूगल पद्धतीने मध काढणी (गरम न करता)',
  },
  'FSSAI & KVIC Laboratory Analysis': {
    hi: 'एफएसएसएआई एवं केवीआईसी प्रयोगशाला जांच',
    mr: 'एफएसएसएआय आणि केव्हीआयसी प्रयोगशाळा तपासणी',
  },
  'Batch Bottling & Batch Tagging': {
    hi: 'बोतलों में भराई एवं बैच नंबर मुद्रण',
    mr: 'बाटल्यांमध्ये पॅकिंग व बॅच नंबर लेबलिंग',
  },
  'Dispatched to KVIC & Market Network': {
    hi: 'केवीआईसी खादी भवन व बाजार में प्रेषित',
    mr: 'केव्हीआयसी खादी भांडार व बाजारात पाठवले',
  },
  'Origin Hive Digital Passport Verified': {
    hi: 'मूल हाइव डिजिटल पासपोर्ट सत्यापित',
    mr: 'मूळ पोळे डिजिटल पासपोर्ट पडताळणी पूर्ण',
  },
  'Comb Harvesting Recorded': {
    hi: 'शहद निष्कासन रिकॉर्ड दर्ज',
    mr: 'मध गोळा केल्याची नोंद झाली',
  },
  'Batch Integrity Tokenized on Ledger': {
    hi: 'बैच अखंडता ब्लॉकचेन लेजर पर टोकनाइज्ड',
    mr: 'बॅचची अस्सलता ब्लॉकचेन वहीत नोंदवली',
  },

  // Learning Content
  'Modern Hive Monitoring & Temperature Equilibrium': {
    hi: 'आधुनिक हाइव निगरानी एवं तापमान संतुलन तकनीक',
    mr: 'आधुनिक पोळे निरीक्षण व तापमान संतुलन तंत्रज्ञान',
  },
  'Official KVIC Honey Mission guide on interpreting digital temperature/humidity sensor data and preventing summer thermal stress in Indian bee colonies.': {
    hi: 'डिजिटल तापमान/आर्द्रता डेटा को समझने और गर्मी में भारतीय मधुमक्खी कॉलोनियों को सुरक्षित रखने पर आधिकारिक केवीआईसी मार्गदर्शिका।',
    mr: 'डिजिटल तापमान/आर्द्रता डेटा समजून घेण्यासाठी आणि उन्हाळ्यात मधमाश्यांचे रक्षण करण्यासाठी अधिकृत केव्हीआयसी मार्गदर्शक.',
  },
  'Varroa Mite Detection & Organic Thymol Treatment': {
    hi: 'वरोआ माइट की पहचान एवं जैविक थाइमोल उपचार',
    mr: 'वरोआ माइट रोग ओळख व सेंद्रिय थायमॉल उपचार',
  },
  'Step-by-step diagnostic techniques for inspecting brood comb frames and applying KVIC-approved herbal miticides without honey contamination.': {
    hi: 'शहद को दूषित किए बिना ब्रूड कॉम्ब फ्रेम की जांच करने और केवीआईसी अनुमोदित हर्बल उपचार लागू करने की चरणबद्ध तकनीक।',
    mr: 'मधाची शुद्धता टिकवून ठेवत पोळ्याची तपासणी करणे आणि केव्हीआयसी प्रमाणित सेंद्रिय औषधोपचार करण्याची पद्धत.',
  },
  'KVIC Honey Mission Subsidy & Toolkits (मधुमक्खी पालन योजना)': {
    hi: 'केवीआईसी हनी मिशन 80% सब्सिडी एवं टूलकिट योजना',
    mr: 'केव्हीआयसी हनी मिशन 80% अनुदान व साहित्य योजना',
  },
  'Complete walkthrough of applying for 80% subsidized bee boxes, centrifugal extractors, and digital MadhuDhara IoT monitoring starter kits.': {
    hi: '80% अनुदानित मधुमक्खी बक्से, निष्कासन उपकरण और डिजिटल मधुधारा आईओटी किट प्राप्त करने की पूरी आवेदन प्रक्रिया।',
    mr: '80% अनुदानावर मधमाशी पेट्या, मध काढणी यंत्रे आणि डिजिटल मधुधारा आयओटी किट मिळवण्याची संपूर्ण माहिती.',
  },

  // Products
  'Pure Raw Multi-Floral Sahyadri Honey': {
    hi: 'शुद्ध कच्चा बहु-पुष्पीय सह्याद्री शहद',
    mr: 'अस्सल नैसर्गिक बहु-फुलोरा सह्याद्री मध',
  },
  'KVIC Certified Pure Raw Sahyadri Honey (500g)': {
    hi: 'केवीआईसी प्रमाणित शुद्ध कच्चा सह्याद्री शहद (500 ग्राम)',
    mr: 'केव्हीआयसी प्रमाणित अस्सल नैसर्गिक सह्याद्री मध (500 ग्रॅम)',
  },
  'Wild Forest Flora, Mustard & Jamun': {
    hi: 'जंगली वनस्पति, सरसों एवं जामुन पुष्प',
    mr: 'रानटी वनस्पती, मोहरी आणि जांभूळ फुलोरा',
  },
};

export class LocalTranslationService implements ITranslationService {
  async translateText(text: string, targetLang: LanguageCode): Promise<string> {
    if (targetLang === 'en') return text;
    const match = dynamicDictionary[text.trim()];
    if (match && match[targetLang]) {
      return match[targetLang];
    }
    return text;
  }

  getLocalizedData<T extends Record<string, any>>(item: T, lang: LanguageCode): T {
    if (lang === 'en') return item;
    const localized = { ...item };

    // Automatically localize string properties if found in dictionary
    for (const key of Object.keys(localized)) {
      const val = localized[key];
      if (typeof val === 'string' && dynamicDictionary[val.trim()] && dynamicDictionary[val.trim()][lang]) {
        (localized as any)[key] = dynamicDictionary[val.trim()][lang];
      }
    }
    return localized;
  }
}

/**
 * Future Machine Translation Service (Google Cloud Translation API / Cloud AI)
 * TODO: When external Google Cloud Translation API credentials are provisioned,
 * Antigravity can activate this class to dynamically translate arbitrary user notes.
 */
export class FutureMachineTranslationService implements ITranslationService {
  private apiKey: string;

  constructor(apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '') {
    this.apiKey = apiKey;
  }

  async translateText(text: string, targetLang: LanguageCode): Promise<string> {
    // TODO: Call https://translation.googleapis.com/language/translate/v2
    // fallback to local dictionary
    return new LocalTranslationService().translateText(text, targetLang);
  }

  getLocalizedData<T extends Record<string, any>>(item: T, lang: LanguageCode): T {
    return new LocalTranslationService().getLocalizedData(item, lang);
  }
}

export const translationService: ITranslationService = new LocalTranslationService();
