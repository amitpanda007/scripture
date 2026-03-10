"""Populate the database with Bhagavad Gita Chapter 1 verses."""

import asyncio

from sqlalchemy import select

from app.database import engine, async_session, Base
from app.models import Scripture, Chapter, Verse

GITA_CH1_VERSES = [
    {
        "verse_number": 1,
        "original_text": "धृतराष्ट्र उवाच |\nधर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः |\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ||१||",
        "transliteration": "dhṛtarāśhtra uvācha |\ndharmakṣhetre kurukṣhetre samavetā yuyutsavaḥ |\nmāmakāḥ pāṇḍavāśhchaiva kimakurvata sañjaya ||1||",
        "hindi_meaning": "धृतराष्ट्र ने कहा — हे संजय! धर्मभूमि कुरुक्षेत्र में एकत्र हुए, युद्ध की इच्छा वाले, मेरे और पाण्डु के पुत्रों ने क्या किया?",
    },
    {
        "verse_number": 2,
        "original_text": "सञ्जय उवाच |\nदृष्ट्वा तु पाण्डवानीकं व्यूढं दुर्योधनस्तदा |\nआचार्यमुपसंगम्य राजा वचनमब्रवीत् ||२||",
        "transliteration": "sañjaya uvācha |\ndṛṣhṭvā tu pāṇḍavānīkaṁ vyūḍhaṁ duryodhanastadā |\nāchāryamupasaṅgamya rājā vachanamabravīt ||2||",
        "hindi_meaning": "संजय ने कहा — पाण्डवों की सेना को व्यूह-रचना में देखकर, राजा दुर्योधन ने उस समय आचार्य द्रोणाचार्य के पास जाकर यह वचन कहा।",
    },
    {
        "verse_number": 3,
        "original_text": "पश्यैतां पाण्डुपुत्राणामाचार्य महतीं चमूम् |\nव्यूढां द्रुपदपुत्रेण तव शिष्येण धीमता ||३||",
        "transliteration": "paśhyaitāṁ pāṇḍuputrāṇāmāchārya mahatīṁ chamūm |\nvyūḍhāṁ drupadaputreṇa tava śhiṣhyeṇa dhīmatā ||3||",
        "hindi_meaning": "हे आचार्य! पाण्डु-पुत्रों की इस विशाल सेना को देखिए, जो आपके बुद्धिमान शिष्य द्रुपद-पुत्र धृष्टद्युम्न द्वारा व्यूह-रचना में खड़ी की गई है।",
    },
    {
        "verse_number": 4,
        "original_text": "अत्र शूरा महेष्वासा भीमार्जुनसमा युधि |\nयुयुधानो विराटश्च द्रुपदश्च महारथः ||४||",
        "transliteration": "atra śhūrā maheṣhvāsā bhīmārjunasamā yudhi |\nyuyudhāno virāṭaśhcha drupadaśhcha mahārathaḥ ||4||",
        "hindi_meaning": "इस सेना में भीम और अर्जुन के समान युद्ध करने वाले, बड़े-बड़े धनुर्धारी शूरवीर हैं — युयुधान (सात्यकि), विराट और महारथी द्रुपद।",
    },
    {
        "verse_number": 5,
        "original_text": "धृष्टकेतुश्चेकितानः काशिराजश्च वीर्यवान् |\nपुरुजित्कुन्तिभोजश्च शैब्यश्च नरपुंगवः ||५||",
        "transliteration": "dhṛṣhṭaketuśhchekitānaḥ kāśhirājaśhcha vīryavān |\npurujitkuntibhojaśhcha śhaibyaśhcha narapuṅgavaḥ ||5||",
        "hindi_meaning": "धृष्टकेतु, चेकितान, पराक्रमी काशिराज, पुरुजित्, कुन्तिभोज और नरश्रेष्ठ शैब्य भी हैं।",
    },
    {
        "verse_number": 6,
        "original_text": "युधामन्युश्च विक्रान्त उत्तमौजाश्च वीर्यवान् |\nसौभद्रो द्रौपदेयाश्च सर्व एव महारथाः ||६||",
        "transliteration": "yudhāmanyuśhcha vikrānta uttamaujāśhcha vīryavān |\nsaubhadro draupadeyāśhcha sarva eva mahārathāḥ ||6||",
        "hindi_meaning": "पराक्रमी युधामन्यु, बलवान उत्तमौजा, सुभद्रा-पुत्र (अभिमन्यु) और द्रौपदी के पाँचों पुत्र — ये सभी महारथी हैं।",
    },
    {
        "verse_number": 7,
        "original_text": "अस्माकं तु विशिष्टा ये तान्निबोध द्विजोत्तम |\nनायका मम सैन्यस्य संज्ञार्थं तान्ब्रवीमि ते ||७||",
        "transliteration": "asmākaṁ tu viśhiṣhṭā ye tānnibodha dvijottama |\nnāyakā mama sainyasya saṁjñārthaṁ tānbravīmi te ||7||",
        "hindi_meaning": "हे ब्राह्मणश्रेष्ठ! अब हमारे पक्ष में जो प्रमुख योद्धा हैं, उन्हें भी जानिए। आपकी जानकारी के लिए मैं अपनी सेना के नायकों के नाम बताता हूँ।",
    },
    {
        "verse_number": 8,
        "original_text": "भवान्भीष्मश्च कर्णश्च कृपश्च समितिंजयः |\nअश्वत्थामा विकर्णश्च सौमदत्तिस्तथैव च ||८||",
        "transliteration": "bhavānbhīṣhmaśhcha karṇaśhcha kṛpaśhcha samitiñjayaḥ |\naśhvatthāmā vikarṇaśhcha saumadattistathiva cha ||8||",
        "hindi_meaning": "स्वयं आप (द्रोणाचार्य), भीष्म, कर्ण, और संग्राम-विजयी कृपाचार्य; तथा अश्वत्थामा, विकर्ण और सोमदत्त-पुत्र (भूरिश्रवा) भी हैं।",
    },
    {
        "verse_number": 9,
        "original_text": "अन्ये च बहवः शूरा मदर्थे त्यक्तजीविताः |\nनानाशस्त्रप्रहरणाः सर्वे युद्धविशारदाः ||९||",
        "transliteration": "anye cha bahavaḥ śhūrā madarthe tyaktajīvitāḥ |\nnānāśhastra-praharaṇāḥ sarve yuddhaviśhāradāḥ ||9||",
        "hindi_meaning": "और भी बहुत से शूरवीर हैं, जो मेरे लिए अपने प्राणों की बाजी लगाने को तैयार हैं। वे सब अनेक प्रकार के अस्त्र-शस्त्रों से सुसज्जित और युद्ध-कला में निपुण हैं।",
    },
    {
        "verse_number": 10,
        "original_text": "अपर्याप्तं तदस्माकं बलं भीष्माभिरक्षितम् |\nपर्याप्तं त्विदमेतेषां बलं भीमाभिरक्षितम् ||१०||",
        "transliteration": "aparyāptaṁ tadasmākaṁ balaṁ bhīṣhmābhirakṣhitam |\nparyāptaṁ tvidameteṣhāṁ balaṁ bhīmābhirakṣhitam ||10||",
        "hindi_meaning": "भीष्म पितामह द्वारा रक्षित हमारी सेना अजेय है, जबकि भीम द्वारा रक्षित इनकी (पाण्डवों की) सेना सीमित है।",
    },
    {
        "verse_number": 11,
        "original_text": "अयनेषु च सर्वेषु यथाभागमवस्थिताः |\nभीष्ममेवाभिरक्षन्तु भवन्तः सर्व एव हि ||११||",
        "transliteration": "ayaneṣhu cha sarveṣhu yathābhāgamavasthitāḥ |\nbhīṣhmamevābhirakṣhantu bhavantaḥ sarva eva hi ||11||",
        "hindi_meaning": "इसलिए, व्यूह के सभी मोर्चों पर अपनी-अपनी जगह स्थित रहते हुए, आप सब लोग भीष्म पितामह की ही सब ओर से रक्षा करें।",
    },
    {
        "verse_number": 12,
        "original_text": "तस्य सञ्जनयन्हर्षं कुरुवृद्धः पितामहः |\nसिंहनादं विनद्योच्चैः शङ्खं दध्मौ प्रतापवान् ||१२||",
        "transliteration": "tasya sañjanayanhṛṣhaṁ kuruvṛddhaḥ pitāmahaḥ |\nsiṁhanādaṁ vinadyochchaiḥ śhaṅkhaṁ dadhmau pratāpavān ||12||",
        "hindi_meaning": "तब कौरवों के प्रतापी वृद्ध पितामह भीष्म ने दुर्योधन के हृदय में हर्ष उत्पन्न करते हुए, उच्च स्वर से सिंह की भाँति गर्जना करके शंख बजाया।",
    },
]

AUDIO_BASE = "/audio"


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        gita = Scripture(
            name="Bhagavad Gita",
            slug="gita",
            description="The Bhagavad Gita, often referred to as the Gita, is a 700-verse Hindu scripture that is part of the epic Mahabharata. It is a dialogue between Prince Arjuna and the god Krishna, who serves as his charioteer.",
            language="Sanskrit",
            total_chapters=18,
            poster_image="design.jpg",
        )
        session.add(gita)
        await session.flush()

        ch1 = Chapter(
            scripture_id=gita.id,
            chapter_number=1,
            title="Arjuna Vishada Yoga",
            title_hindi="अर्जुन विषाद योग",
            total_verses=len(GITA_CH1_VERSES),
        )
        session.add(ch1)
        await session.flush()

        for v in GITA_CH1_VERSES:
            verse = Verse(
                chapter_id=ch1.id,
                verse_number=v["verse_number"],
                original_text=v["original_text"],
                transliteration=v["transliteration"],
                hindi_meaning=v["hindi_meaning"],
                scripture_audio_url=f"{AUDIO_BASE}/gita/1/{v['verse_number']}_verse.mp3",
                meaning_audio_url=f"{AUDIO_BASE}/gita/1/{v['verse_number']}_meaning.mp3",
            )
            session.add(verse)

        await session.commit()
        print(f"Seeded: {gita.name} -> Chapter 1 with {len(GITA_CH1_VERSES)} verses")


if __name__ == "__main__":
    asyncio.run(seed())
