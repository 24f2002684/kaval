from typing import Dict, Any

def generate_multilingual_alert(
    household_name: str,
    neighbourhood: str,
    risk_level: str,
    shelter_name: str,
    recommended_action: str = "Follow the verified evacuation route to higher ground."
) -> Dict[str, str]:
    """
    Generates deterministic emergency alerts in English, Tamil, and Hindi.
    """
    risk_upper = risk_level.upper()
    
    # English
    en_msg = (
        f"KAVAL ALERT – {neighbourhood}\n\n"
        f"Dear {household_name},\n"
        f"Flood risk near your household is {risk_upper}.\n"
        f"Water accumulation may increase significantly in your area over the next few hours.\n\n"
        f"Nearest available shelter: {shelter_name}.\n"
        f"Recommended action: {recommended_action}\n\n"
        f"Reply immediately:\n"
        f"1 – I AM SAFE\n"
        f"2 – I NEED HELP / RESCUE"
    )
    
    # Tamil
    ta_risk_map = {
        "CRITICAL": "அதிதீவிர அபாயம் (CRITICAL)",
        "HIGH": "அதிக அபாயம் (HIGH)",
        "MODERATE": "மிதமான அபாயம் (MODERATE)",
        "LOW": "குறைந்த அபாயம் (LOW)"
    }
    ta_risk = ta_risk_map.get(risk_upper, "அதிக அபாயம்")
    
    ta_msg = (
        f"காவல் வெள்ள அபாய எச்சரிக்கை – {neighbourhood}\n\n"
        f"அன்பார்ந்த {household_name},\n"
        f"உங்கள் வீட்டின் அருகிலுள்ள வெள்ள அபாய நிலை: {ta_risk}.\n"
        f"அடுத்த சில மணிநேரங்களில் உங்கள் பகுதியில் நீர்மட்டம் மேலும் உயரக்கூடும்.\n\n"
        f"அருகிலுள்ள நிவாரண முகாம்: {shelter_name}.\n"
        f"பரிந்துரை: சரிபார்க்கப்பட்ட பாதுகாப்பான மாற்றுப் பாதையைப் பயன்படுத்தி உடனடியாக பாதுகாப்பான இடத்திற்கு செல்லவும்.\n\n"
        f"உடனடியாக பதில் அனுப்பவும்:\n"
        f"1 – நான் பாதுகாப்பாக உள்ளேன் (I AM SAFE)\n"
        f"2 – எனக்கு மீட்பு உதவி தேவை (I NEED HELP)"
    )
    
    # Hindi
    hi_risk_map = {
        "CRITICAL": "अत्यधिक गंभीर (CRITICAL)",
        "HIGH": "उच्च जोखिम (HIGH)",
        "MODERATE": "मध्यम जोखिम (MODERATE)",
        "LOW": "निम्न जोखिम (LOW)"
    }
    hi_risk = hi_risk_map.get(risk_upper, "उच्च जोखिम")
    
    hi_msg = (
        f"कावल आपातकालीन चेतावनी – {neighbourhood}\n\n"
        f"प्रिय {household_name},\n"
        f"आपके आवास के निकट बाढ़ का स्तर: {hi_risk} है।\n"
        f"आगामी घंटों में आपके क्षेत्र में जलभराव तेजी से बढ़ सकता है।\n\n"
        f"निकटतम सुरक्षित राहत केंद्र: {shelter_name}.\n"
        f"सुझाव: सत्यापित सुरक्षित निकासी मार्ग का पालन करें और सुरक्षित स्थान पर जाएं।\n\n"
        f"तुरंत उत्तर दें:\n"
        f"1 – मैं सुरक्षित हूँ (I AM SAFE)\n"
        f"2 – मुझे सहायता / बचाव चाहिए (I NEED HELP)"
    )
    
    return {
        "en": en_msg,
        "ta": ta_msg,
        "hi": hi_msg
    }
