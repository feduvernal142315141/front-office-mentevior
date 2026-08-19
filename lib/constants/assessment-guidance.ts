import type { FieldGuidance } from "./field-guidance"

/**
 * Guías de la sección Background Information del Assessment. Los textos son los
 * del template del PDF "Behavior Analysis Assessment and Support Plan"
 * (2026-08-18): se muestran dentro del campo vacío y desaparecen al escribir.
 */
export const ASSESSMENT_BACKGROUND_SUMMARY_GUIDANCE: FieldGuidance = {
  intro: "Describe the client. (Do not describe birth history unless relevant to current situation.) Include their:",
  bullets: [
    { text: "a) diagnosis" },
    { text: "b) family structure (and dynamics relevant to intervention), and" },
    { text: "c) living arrangements;" },
    {
      text: "If substance abuse, sexual activity, mental health challenges, relevant family medical or behavioral history, spiritual and/or cultural preferences (if there are no spiritual or cultural preferences please state so), or other similar factors could affect intervention, include those as well.",
    },
  ],
}

export const ASSESSMENT_BACKGROUND_GUIDANCE: Record<string, FieldGuidance> = {
  backgroundStrengths: {
    intro:
      "Highlight the individual's positive attributes, skills, and abilities that can be leveraged to support their behavior and overall well-being.",
  },
  backgroundWeaknesses: {
    intro: "Provide concise and pertinent details about the individual's challenges or areas where they may struggle.",
  },
  backgroundInterest: {
    intro: "Provide a brief overview of the individual's hobbies, passions, or activities they enjoy.",
  },
  backgroundCommunicationSkills: {
    intro: "Brief overview of the individual's abilities in expressing themselves and interacting with others.",
  },
  backgroundAcademicSkills: {
    intro:
      "Provide a concise overview of the individual's abilities in academic domains such as reading, writing, mathematics, and comprehension.",
  },
  backgroundSelfCareSkills: {
    intro:
      "Provide a brief overview of the individual's abilities in tasks related to personal care and daily living activities.",
  },
  backgroundSocialSkills: {
    intro:
      "Provide a concise overview of the individual's abilities in interacting with others, forming relationships, and navigating social situations.",
  },
  backgroundSafetySkills: {
    intro:
      "Provide a concise overview of the individual's ability to recognize and respond to potential safety hazards and emergencies.",
  },
  backgroundSelfAdvocacy: {
    intro:
      "Provide a brief overview of the individual's ability to express their needs, preferences, and rights effectively.",
  },
  backgroundSelfPreservationSkills: {
    intro:
      "Provide a concise overview of the individual's ability to protect themselves from harm and maintain their physical and emotional well-being.",
  },
  backgroundMotorSkills: {
    intro: "Provide an overview of the individual's abilities in both large and small muscle movements.",
  },
}
