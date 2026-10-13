import { GoogleGenAI } from '@google/genai';
import { BloodGroup, RequestUrgency, Donor, BloodRequest } from '../types';

let genAIClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (genAIClient) return genAIClient;
  // Try client-side env var or standard window env if injected
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any)?.env?.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      genAIClient = new GoogleGenAI({ apiKey });
      return genAIClient;
    } catch (e) {
      console.warn('Could not initialize GoogleGenAI client:', e);
      return null;
    }
  }
  return null;
}

export interface ExtractedTriageData {
  patientRef: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: RequestUrgency;
  hospitalName: string;
  city: string;
  clinicalReason: string;
  contactPerson: string;
  contactPhone: string;
}

/**
 * Parses raw hospital / doctor notes into structured BloodRequest draft.
 * Works with Gemini AI if key exists, otherwise uses deterministic regex & keyword extraction.
 */
export async function triageClinicalNote(rawNote: string): Promise<{ data: ExtractedTriageData; source: 'GEMINI_AI' | 'HEURISTIC_RULE_FALLBACK' }> {
  const client = getClient();

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an emergency hospital transfusion triage assistant. Extract the following JSON from this clinical note:
Note: "${rawNote}"

Respond ONLY with valid JSON in this exact shape:
{
  "patientRef": "string",
  "bloodGroup": "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+",
  "unitsNeeded": number,
  "urgency": "CRITICAL" | "URGENT" | "STANDARD",
  "hospitalName": "string",
  "city": "string",
  "clinicalReason": "string",
  "contactPerson": "string",
  "contactPhone": "string"
}`,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          data: {
            patientRef: parsed.patientRef || 'Trauma Case Triage',
            bloodGroup: (['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].includes(parsed.bloodGroup) ? parsed.bloodGroup : 'O-') as BloodGroup,
            unitsNeeded: Number(parsed.unitsNeeded) || 2,
            urgency: (['CRITICAL', 'URGENT', 'STANDARD'].includes(parsed.urgency) ? parsed.urgency : 'URGENT') as RequestUrgency,
            hospitalName: parsed.hospitalName || 'Harborview Medical Center',
            city: parsed.city || 'Seattle',
            clinicalReason: parsed.clinicalReason || rawNote.slice(0, 100),
            contactPerson: parsed.contactPerson || 'Transfusion Desk',
            contactPhone: parsed.contactPhone || '+1 (206) 555-0100',
          },
          source: 'GEMINI_AI',
        };
      }
    } catch (err) {
      console.warn('Gemini extraction error, falling back to rule parser:', err);
    }
  }

  // Deterministic rule-based fallback
  return {
    data: heuristicTriageExtraction(rawNote),
    source: 'HEURISTIC_RULE_FALLBACK',
  };
}

function heuristicTriageExtraction(rawNote: string): ExtractedTriageData {
  const noteLower = rawNote.toLowerCase();

  // Blood group detection
  let bloodGroup: BloodGroup = 'O-';
  const bgRegex = /\b(ab\+|ab-|a\+|a-|b\+|b-|o\+|o-|ab pos|ab neg|a pos|a neg|b pos|b neg|o pos|o neg)\b/i;
  const bgMatch = rawNote.match(bgRegex);
  if (bgMatch) {
    const rawBg = bgMatch[0].toUpperCase();
    if (rawBg.includes('AB')) bloodGroup = rawBg.includes('-') || rawBg.includes('NEG') ? 'AB-' : 'AB+';
    else if (rawBg.startsWith('A')) bloodGroup = rawBg.includes('-') || rawBg.includes('NEG') ? 'A-' : 'A+';
    else if (rawBg.startsWith('B')) bloodGroup = rawBg.includes('-') || rawBg.includes('NEG') ? 'B-' : 'B+';
    else if (rawBg.startsWith('O')) bloodGroup = rawBg.includes('-') || rawBg.includes('NEG') ? 'O-' : 'O+';
  }

  // Units needed
  let units = 2;
  const unitMatch = rawNote.match(/(\d+)\s*(units?|pints?|bags?)/i);
  if (unitMatch) {
    units = Math.max(1, Math.min(10, parseInt(unitMatch[1], 10)));
  }

  // Urgency
  let urgency: RequestUrgency = 'STANDARD';
  if (
    noteLower.includes('stat') ||
    noteLower.includes('massive') ||
    noteLower.includes('trauma') ||
    noteLower.includes('hemorrhage') ||
    noteLower.includes('critical') ||
    noteLower.includes('code red')
  ) {
    urgency = 'CRITICAL';
  } else if (
    noteLower.includes('urgent') ||
    noteLower.includes('surgery') ||
    noteLower.includes('anemia') ||
    noteLower.includes('asap')
  ) {
    urgency = 'URGENT';
  }

  // Hospital detection
  let hospital = 'Metro Regional Hospital';
  if (noteLower.includes('harborview')) hospital = 'Harborview Medical Center';
  else if (noteLower.includes('swedish')) hospital = 'Swedish Medical Center First Hill';
  else if (noteLower.includes('children')) hospital = 'Seattle Children’s Hospital';
  else if (noteLower.includes('overlake')) hospital = 'Overlake Medical Center';
  else if (noteLower.includes('virginia mason')) hospital = 'Virginia Mason Hospital';

  // City detection
  let city = 'Seattle';
  if (noteLower.includes('bellevue')) city = 'Bellevue';
  else if (noteLower.includes('tacoma')) city = 'Tacoma';
  else if (noteLower.includes('portland')) city = 'Portland';

  // Contact phone extraction
  const phoneMatch = rawNote.match(/(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{3}[-.\s]\d{4}\b)/);
  const contactPhone = phoneMatch ? phoneMatch[0] : '+1 (206) 555-9900';

  return {
    patientRef: `Case #${Math.floor(4000 + Math.random() * 999)} (Triage Extract)`,
    bloodGroup,
    unitsNeeded: units,
    urgency,
    hospitalName: hospital,
    city,
    clinicalReason: rawNote.slice(0, 160).trim() || 'Urgent transfusion evaluation per clinical assessment.',
    contactPerson: 'Attending Physician Desk',
    contactPhone,
  };
}

/**
 * AI-powered alert message customizer (or template fallback)
 */
export async function generateSmartOutreachMessage(
  donor: Donor,
  request: BloodRequest,
  tone: 'EMERGENCY' | 'WARM_PERSONAL' | 'FORMAL_CLINICAL'
): Promise<{ message: string; isAiGenerated: boolean }> {
  const client = getClient();

  if (client) {
    try {
      const prompt = `Write a short SMS/WhatsApp alert message (under 300 characters) to blood donor ${donor.fullName} (${donor.bloodGroup}).
Hospital: ${request.hospitalName} in ${request.city}.
Patient Need: ${request.unitsNeeded} units of ${request.bloodGroup} (${request.urgency} urgency).
Tone: ${tone}.
Include coordinator phone: ${request.contactPhone}.
Make it polite, clear, and action-oriented. No hashtags.`;

      const res = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (res.text) {
        return { message: res.text.trim(), isAiGenerated: true };
      }
    } catch (e) {
      console.warn('Gemini outreach generation error:', e);
    }
  }

  // Smart fallback template
  if (tone === 'EMERGENCY') {
    return {
      message: `🚨 LIFE-THREATENING EMERGENCY: ${request.hospitalName} urgently requires ${request.unitsNeeded} unit(s) of ${request.bloodGroup} blood. Dear ${donor.fullName}, your donation can save a life right now. Please call ${request.contactPhone} immediately or reply YES.`,
      isAiGenerated: false,
    };
  }

  if (tone === 'WARM_PERSONAL') {
    return {
      message: `Hi ${donor.fullName}! ${request.hospitalName} is in need of ${request.bloodGroup} blood for an urgent case. As a valued lifesaver in ${donor.city}, are you available to donate? Every unit matters! Call ${request.contactPhone} to coordinate. Thank you!`,
      isAiGenerated: false,
    };
  }

  return {
    message: `LifeLink Notice: ${request.hospitalName} (${request.city}) requests ${request.unitsNeeded} units of ${request.bloodGroup} blood (${request.urgency}). Eligible donor ${donor.fullName} is invited to contact ${request.contactPerson} at ${request.contactPhone}.`,
    isAiGenerated: false,
  };
}
