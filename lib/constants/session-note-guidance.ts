/**
 * Guías de los CASP Session Note Templates.
 *
 * Cada narrative de los templates trae un bloque "Guidance" (y a veces "Example")
 * en itálica que le dice al provider qué escribir. Acá viven esos textos para
 * mostrarlos como placeholder dentro del textarea: se ven mientras el campo está
 * vacío y sin foco, y desaparecen al hacer click.
 *
 * Fuente (transcripción literal, no parafrasear sin revisar el PDF):
 * - `97153 Session Template_1.07.pdf`
 * - `97155 Session Template_1.04.pdf`
 * - `97156 Session Template_1.03.pdf`
 *
 * Pendientes: 97151, 97152 y 97154 todavía no tienen formulario en el front.
 */

import type { FieldGuidance } from "./field-guidance"

export type { FieldGuidance, GuidanceBullet } from "./field-guidance"

// ============================================
// 97153 — Adaptive Behavior Treatment by Protocol
// ============================================

const SESSION_SUMMARY_97153: FieldGuidance = {
  bullets: [
    {
      text: "The purpose of this narrative section is to provide information on what the rendering provider did specific to delivering interventions and the response of the client.",
    },
    {
      text: "Any information included here needs to be:",
      children: [
        "Objective.",
        "Relevant to the service.",
        "Appropriate for a medical record.",
        "Specific to what occurred during the session.",
      ],
    },
    {
      text: "Do NOT use this section to provide information already contained elsewhere in the session note.",
    },
    {
      text: "Examples of pertinent information that may be included here:",
      children: [
        "Any events discovered/reported at the start of the session that may impact the outcome of the session (e.g., a medication change, a poor night’s sleep, a change in the environment, etc.).",
        "Any interfering behaviors observed during the session or environmental factors that impacted the delivery of the service and/or the client’s response.",
        "A new independent behavior that was observed and not included in the data above (e.g., an independent request for a new item, spontaneous imitation).",
        "A description of the client's response to a behavior reduction plan, including any variation in responding, or relevant antecedent or consequent variables.",
        "A description of the client's response to procedures meant to build or strengthen adaptive skills.",
        "Significant information or additional details related to ABC data.",
        "Any variation in the topography, magnitude, frequency, or duration of existing behavior targeted for skill acquisition or reduction.",
        "Discussing treatment targets (e.g., acquired skills), programs (e.g., specific treatment protocols), or goals (e.g., client met mastery criteria) that require QHP attention.",
      ],
    },
  ],
}

// ============================================
// 97155 — Adaptive Behavior Treatment with Protocol Modification
// ============================================

const FACE_TO_FACE_PROTOCOL_97155: FieldGuidance = {
  bullets: [
    { text: "Identify the names of the programs/protocol components observed for which no changes were indicated." },
    { text: "Identify the names of the programs/protocol components observed for which changes were indicated." },
  ],
  examplesLabel: "Example:",
  examples: [
    "“Receptive Labeling of Actions and Expressive Labeling of Objects were observed, and no adjustments were indicated. Adjustments are needed for Observational Learning protocol.”",
  ],
}

const PROTOCOL_ADJUSTMENTS_97155: FieldGuidance = {
  bullets: [
    {
      text: "The emphasis of this narrative should be placed on what was done and an analysis of why action was taken, as opposed to detailing specific adjustments made to components of the protocol.",
    },
    {
      text: "If additional information regarding the protocol adjustment is detailed in other documentation, it can be noted in the “Other” section (e.g., \"Additional details are available upon request\").",
    },
  ],
  examplesLabel: "Examples:",
  examples: [
    "“Manding: Five highly preferred targets were added due to mastery of current targets; positional prompts were removed as the need for prompts correlated only with less preferred items.”",
    "“Turn taking: Mastered SD1 with prompts. Begin SD2, which requires five turns without prompts.”",
  ],
}

const ACTIVE_DIRECTION_97155: FieldGuidance = {
  intro:
    "The narrative should specifically address why this direction was necessary for the benefit of this client’s progress.",
  examplesLabel: "Example:",
  examples: [
    "“Turn taking: The QHP modeled how to run SD2 as the technician was inadvertently prompting when implementing the program and the client appeared to be relying on the prompts. After the QHP modeled the program correctly, the client responded with independence after a two-second delay.”",
  ],
}

const QHP_IMPLEMENTATION_97155: FieldGuidance = {
  bullets: [
    { text: "The narrative should include a description of what the QHP did, the client’s response, and implications." },
    { text: "The level of specificity provided should be based on the individual ABA Organization's system preferences." },
    { text: "Testing of the protocol may result in no change occurring." },
    {
      text: "The ABA organization should determine if they want their QHPs to include data collected during the session in this section or provide it separately upon request.",
    },
  ],
  examplesLabel: "Example(s):",
  examples: [
    "“The QHP ran three programs/protocols that had been identified as having met mastery criteria (i.e., manding, 2-step instructions, turn taking) and probed additional phases to determine next steps.”",
  ],
}

// ============================================
// 97156 — Family Adaptive Behavior Treatment Guidance
// ============================================

const SESSION_SUMMARY_97156: FieldGuidance = {
  bullets: [
    {
      text: "The purpose of this narrative section is to provide information on what the rendering provider did specific to delivering interventions and the response of the parent/caregiver.",
    },
    {
      text: "Any information included here needs to be:",
      children: [
        "Objective.",
        "Relevant to the service.",
        "Appropriate for a medical record.",
        "Specific to what occurred during the session.",
      ],
    },
    {
      text: "Do NOT use this section to provide information already contained elsewhere in the session note.",
    },
    {
      text: "Examples of pertinent information that may be included here:",
      children: [
        "Any events discovered/reported at the start of the session that may impact the outcome of the session (e.g., a medication change, a poor night's sleep, a change in the environment, etc.).",
        "Any interfering behaviors observed during the session or environmental factors that impacted the delivery of the service and/or the client's response.",
        "If the client was present, describe the client's response to a behavior reduction plan, including any variation in responding or relevant antecedent or consequent variables.",
        "Targets or goals that met mastery criteria during the session.",
        "Details of the training provided to the guardian(s)/caregiver(s) related to treatment goals.",
        "The guardian(s)/caregiver(s) report of how the client is responding to protocols implemented by them when performed outside the delivery of 97156 services. Example: \"Parent reports that the client complies with parent directions for using 'first/then' statements when the QHP is present but engages in verbal protest when the QHP is not present.\"",
        "New guardian/caregiver concerns that may necessitate future modification of treatment protocols implemented during 97153 services. (Any protocol modifications would be addressed during the QHP’s next 97155 visit.)",
        "Relevant client updates that might impact future caregiver guidance sessions. Example: “Parent reports that the client no longer engages in [a given maladaptive behavior] due to the behavior strategy being effective. QHP discontinues the related caregiver goal.”",
        "Brief documentation of information provided by the parent/caregiver if such information warrants a referral or change to the coordination of care. Example: “Parent states that the client seems more tired during direct treatment sessions but has recently started a new medication. QHP agrees to discuss the impact of the medication on ABA treatment with the client’s physician.”",
        "Notes of how the client responded to the caregiver if the client was present during 97156 services.",
        "Data related to the measurement of treatment fidelity as implemented by the caregiver.",
        "Data related to interobserver agreement between the caregiver and QHP for the measurement of treatment goals.",
      ],
    },
  ],
}

// ============================================
// Índice por billing code
// ============================================

export const SESSION_NOTE_GUIDANCE = {
  "97153": {
    sessionSummary: SESSION_SUMMARY_97153,
  },
  "97155": {
    faceToFaceProtocolNarrative: FACE_TO_FACE_PROTOCOL_97155,
    adjustmentsNarrative: PROTOCOL_ADJUSTMENTS_97155,
    activeDirectionNarrative: ACTIVE_DIRECTION_97155,
    qhpNarrative: QHP_IMPLEMENTATION_97155,
  },
  "97156": {
    sessionSummary: SESSION_SUMMARY_97156,
  },
} as const satisfies Record<string, Record<string, FieldGuidance>>
