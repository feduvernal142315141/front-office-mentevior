import type { AssessmentPdfTexts } from "@/lib/types/assessment.types"

/**
 * Textos estándar de las narrativas del PDF del Assessment, copiados del
 * documento de backend "Assessment Editable PDF Default Texts" (2026-08-18).
 * Son los mismos que el backend guarda cuando un campo llega `null` en el POST;
 * el formulario los precarga en create para que el usuario los vea y edite en
 * lugar de partir de campos vacíos.
 *
 * ⚠️ Mantener sincronizados con backend: si cambian allá, cambiarlos acá.
 */
export const ASSESSMENT_PDF_DEFAULT_TEXTS: AssessmentPdfTexts = {
  coordinationCare: `With appropriate authorization and caregiver consent, the behavior analyst will coordinate care with relevant providers and stakeholders, including caregivers, physicians, educators, therapists, and other treatment professionals. Coordination may include sharing clinically relevant information, reviewing recommendations, clarifying provider roles, and aligning treatment goals to promote consistency and continuity of care across settings. All communication will comply with applicable privacy requirements and will be documented in the clinical record. Treatment recommendations will remain within the behavior analyst's scope of competence, and referrals will be made when needs fall outside the scope of ABA services.`,

  medicalNecessity: `Applied Behavior Analysis (ABA) services are medically necessary for the member due to clinically significant behavioral deficits and/or excesses that interfere with the member's safety, independence, communication, social functioning, adaptive functioning, and meaningful participation in everyday activities. Without medically necessary behavioral intervention, the member may be at risk for continued or worsening functional impairment and reduced access to developmentally appropriate activities in the home and community.

The recommended program uses individualized, assessment-based procedures derived from the established scientific literature in behavior analysis, including the work of Drs. Brian Iwata, Mark Sundberg, Vincent Carbone, G. "Gli" Espinosa, Patrick McGreevy, and Gregory Hanley. Applicable procedures are selected according to the member's assessed needs and the identified function of behavior rather than solely because of their association with a particular researcher. Treatment may include functional assessment, antecedent interventions, reinforcement-based procedures, functional communication training, skill acquisition, generalization, and caregiver training, as clinically indicated.

The recommended type, intensity, frequency, duration, and setting of services reflect the level of care that can be safely and effectively furnished based on the member's current clinical presentation and individualized treatment needs. The requested services are not primarily for the convenience of the provider, caregivers, family, school, or other involved parties. Treatment recommendations are based on the member's clinical needs, documented functional impairments, treatment goals, response to intervention, and the level of support required to produce meaningful and sustainable improvement.

Based on the available clinical information and individualized assessment, no equally effective, more conservative, or less costly service has been identified that would adequately address the member's assessed behavioral needs and functional impairments. Less intensive or non behavioral services alone would not be expected to provide the same individualized functional assessment, direct measurement, data-based clinical decision-making, caregiver training, and systematic acquisition and generalization of replacement skills. The continued necessity and intensity of ABA services will be reviewed using objective treatment data, caregiver input, progress toward measurable goals, barriers to treatment, and the member's response to intervention.

Intervention will be delivered in the member's natural environment when clinically appropriate because this is where the target behaviors and relevant replacement skills naturally occur. Providing treatment in natural contexts allows the clinical team to assess environmental variables, teach functionally relevant skills, support generalization across people and activities, and evaluate whether improvements are maintained under typical daily conditions.

The social validity and acceptability of the program will be evaluated through ongoing consultation with the member's caregivers and, when appropriate, the member. Caregiver priorities, cultural and family considerations, treatment feasibility, and the meaningfulness of targeted outcomes will be considered throughout treatment. Caregiver input will supplement, but not replace, objective clinical data and professional judgment.

Treatment will employ the least restrictive and least intrusive effective procedures appropriate to the member's needs. Progress will be monitored through direct and objective data collection. The treatment plan will be modified when clinically indicated, and services will be reduced, transitioned, or discontinued when the member demonstrates sustained progress, treatment goals have been achieved, a less intensive level of care can safely meet the member's needs, or the data indicate that the current intervention is no longer medically necessary or effective.`,

  caregiverTraining: `Training will be provided in relevant context/routines to caregivers supporting Aaliyah Rios. During visits where the caregivers are being trained on the behavior plan, the behavior analyst will describe, model, and/or prompt use of the procedures, making sure that the interventions fit well and are feasible within existing routines. The expectation is that the caregivers/family members will initially be implementing the plan with the assistance and support of behavior assistant. Simplified versions of the behavior and teaching plans may be provided to facilitate implementation. The analyst will observe caregivers and provide feedback, gradually fading the assistance they provide. Caregiver training will be officially scheduled bi-weekly at least once and should be led by Lead Analyst/BCaBA but modeling of appropriate interventions and procedures will occur daily by RBT/BCaBA, depending on who is providing the service. Fidelity procedures and data will be implemented, collected, and analyzed by the Lead analyst. Revisions to the program will be made as warranted. Ongoing training and monitoring should continue to occur on a weekly basis in order to ensure proper implementation of the behavior program. Monthly competency checks of the caregivers will be conducted to ensure proper program implementation. Graphs will be displayed depicting the results of the competency checks on monthly progress reports.

The expectation is that the caregivers/family members will initially be implementing the plan with the assistance and support of behavior assistant. Simplified versions of the behavior and teaching plans may be provided to facilitate implementation. The analyst will observe caregivers and provide feedback, gradually fading the assistance they provide. Caregiver training will be officially scheduled bi-weekly at least once and should be led by Lead Analyst/BCaBA but modeling of appropriate interventions and procedures will occur daily by RBT/BCaBA, depending on who is providing the service. Fidelity procedures and data will be implemented, collected, and analyzed by the Lead analyst. Revisions to the program will be made as warranted. Ongoing training and monitoring should continue to occur on a weekly basis in order to ensure proper implementation of the behavior program. Monthly competency checks of the caregivers will be conducted to ensure proper program implementation. Graphs will be displayed depicting the results of the competency checks on monthly progress reports.

Teaching Methods: To develop the acquisition skills and replacement behaviors, the Lead Analyst and caregivers will task analyze complex skills, develop routine-specific instructional plans, and use appropriate chaining, shaping, and prompting methods. Specifically, these will include verbal behavior training, natural environment training, incidental, or milieu teaching, peer mediated instruction, and play-based intervention.

Teaching plans will be developed for complex skills and will include the environments in which the instruction is taking place. These teaching plans will include the specific skills or skill sequences to be taught, environmental arrangements to promote skill use (e.g., social stories, videos, token boards, timers, visual schedules), and other specific instructional procedures. Routines and skills targeted for instruction will be prioritized by the caregivers, addressing the most essential areas first.

Caregivers will be taught a variety of behavior interventions throughout the session. This will allow parents to successfully work with Aaliyah Rios and any of their problem behaviors when the behavior assistant and analyst are not present.`,

  generalizationTraining: `Generalization training will be implemented to promote the member's independent use of acquired skills across people, settings, materials, activities, and naturally occurring situations. Caregivers and other relevant providers will be trained to create opportunities for practice and reinforce appropriate responding outside direct treatment sessions. Generalization will be programmed systematically, monitored through direct data collection, and adjusted according to the member's performance to support durable, functional improvements in daily life.`,

  fadingTransitionPlan: `ABA services will be faded gradually based on the member's clinical progress and continued medical necessity rather than according to a predetermined date. The behavior analyst will review objective data to determine whether the member has demonstrated sustained reductions in target behaviors, acquisition and maintenance of replacement skills, generalization across caregivers and relevant settings, decreased dependence on prompts, and increased caregiver ability to implement recommended procedures accurately and independently.

When these criteria remain stable across clinically appropriate observation periods, the behavior analyst may gradually reduce direct treatment, protocol-modification, and/or caregiver-training hours. Services may be reduced by decreasing session frequency, session duration, level of prompting, provider involvement, or support within specific routines and settings. Caregiver training and periodic clinical monitoring may continue during the transition to support maintenance and generalization.

Following each reduction, the member's progress will be monitored to determine whether treatment gains are maintained. Further fading will occur only when the available data indicate that the reduced level of care continues to meet the member's clinical needs safely and effectively. If clinically significant regression, loss of skills, increased target behavior, reduced caregiver implementation, or new safety concerns occur, fading may be paused and the treatment intensity reassessed. Services may be temporarily increased when supported by clinical data and medical necessity.

Discharge may be considered when treatment goals have been substantially achieved, clinically significant gains are maintained and generalized, caregivers can support the member's needs with minimal clinical assistance, and the member no longer requires the current level of ABA services. All fading and discharge decisions will be individualized, documented, reviewed with the member and/or authorized representative, and coordinated with other involved providers when appropriate.`,

  crisisProcedures: `If the member's behavior presents an immediate risk of harm to self or others, caregivers and providers will prioritize safety by remaining calm, reducing environmental hazards, limiting unnecessary verbal interaction, and following the organization's approved crisis-response procedures. Emergency services will be contacted when the level of risk cannot be safely managed by trained individuals. Following any crisis, the supervising behavior analyst will review the event, document relevant data, assess contributing variables, and modify the treatment or safety plan as clinically indicated. Only trained and authorized individuals may implement restrictive or emergency procedures in accordance with applicable laws, professional standards, and payer requirements.`,

  dischargeCriteria: `Discharge from ABA services will be based on the member's individualized clinical needs, objective treatment data, progress toward goals, safety, and continued medical necessity. Discharge planning will be discussed with the member and/or authorized representative and coordinated with other involved providers when clinically appropriate.

Discharge may be considered when one or more of the following criteria are met:

The member has substantially achieved the treatment goals, and clinically significant improvements are maintained and generalized across relevant people, activities, and settings.
Target behaviors have decreased to a level that can be safely managed without the current intensity of ABA services.
Replacement, communication, adaptive, and coping skills are sufficiently established and maintained with natural supports.
Caregivers demonstrate the ability to implement recommended strategies with minimal clinical assistance.
Objective data indicate that ABA services are no longer medically necessary or that the member's needs can be safely addressed through a less intensive level of care.
The member is not demonstrating meaningful progress despite adequate implementation, ongoing assessment, appropriate treatment modifications, and efforts to address barriers.
The member requires a different service, provider, setting, or level of care that is better suited to the member's clinical needs.
The member and/or authorized representative requests discontinuation or withdraws consent for treatment.
Persistent barriers prevent services from being delivered safely, consistently, or according to the treatment plan, after reasonable attempts have been made to resolve those barriers.
Eligibility, authorization, coverage, relocation, or another administrative circumstance prevents the continuation of services.

Whenever clinically appropriate, discharge will follow a gradual transition rather than an abrupt termination of services. The transition may include fading direct-service hours, increasing caregiver independence, monitoring maintenance and generalization, coordinating with other providers, and providing recommendations or referrals for continued support. A discharge summary will document the reason for discharge, the member's progress, current clinical status, remaining needs, caregiver recommendations, and any appropriate referrals or follow-up services.

If an immediate safety concern or another urgent clinical circumstance requires rapid discontinuation or transfer, the behavior analyst will follow applicable legal, ethical, payer, and organizational requirements to protect the member and support continuity of care.`,

  assessmentTreatmentConsent: `The member and/or authorized representative received information in understandable language regarding the purpose of ABA services, proposed assessment and treatment procedures, potential benefits and risks, available alternatives, confidentiality, data collection, and caregiver participation. An opportunity was provided to ask questions and participate in treatment planning.

Voluntary consent was provided for the clinical team to assess the member's needs, develop and implement an individualized treatment plan, collect and analyze data, provide caregiver training, and modify interventions based on clinical need and treatment response. Consent may be withdrawn at any time, subject to applicable requirements. Treatment will use the least restrictive and least intrusive effective procedures, and additional consent will be obtained when specifically required.`,

  noncontingentAttention: `Caregivers will provide the member with attention according to a fixed-time schedule, initially every five minutes or at another interval established from baseline data. At the end of each interval, the caregiver will approach the member and provide a brief social interaction lasting approximately 30 seconds. Attention will be provided independently of target behavior. Appropriate behavior observed during the interaction may also receive descriptive praise.

This procedure is intended to reduce the motivation to engage in attention-maintained behavior. Noncontingent attention should not be delayed solely because target behavior occurred, as doing so would make attention contingent on the absence of behavior rather than response independent.`,

  thinNoncontingentAttention: `The schedule of response-independent attention may be gradually thinned when data demonstrate a sustained reduction in target behavior and maintenance of appropriate behavior. For example, the interval may be increased from 5 minutes to 10 minutes and then to 15 minutes. Schedule changes will be determined by the behavior analyst using objective treatment data. If target behavior increases following a schedule change, the previous effective interval may be reinstated and thinning may proceed more gradually.`,

  independentBreaks: `When assessment results indicate that target behavior is related to escape from or avoidance of demands, the member will receive scheduled breaks during nonpreferred or effortful activities. The initial schedule will be based on the member's current ability to participate before target behavior typically occurs. Breaks will be scheduled frequently enough to reduce the motivation to escape and may be gradually thinned as the member develops greater tolerance and independently requests breaks.`,

  visualSupports: `Visual supports may be used to clarify expectations and signal appropriate responses. The member may be taught the meaning of visual cues such as stop, wait, break, first/then, or a visual activity schedule. Visual supports should be introduced and practiced during calm periods rather than used only after target behavior begins.

When self-injurious behavior occurs, a previously taught stop cue may be presented as part of the member's individualized safety and response protocol. The visual cue will not replace immediate protective action when there is a risk of injury. Responses to self-injurious behavior must follow the member's approved behavior plan and applicable safety requirements.`,

  communicationTraining: `The member will be taught socially appropriate, functionally equivalent communication responses that produce the same outcome previously obtained through target behavior. Responses may include appropriately requesting attention, assistance, a break, access to an item or activity, additional time, or termination of an activity. The communication form will be selected according to the member's abilities and may include speech, signs, gestures, pictures, or an augmentative communication device.

Initially, appropriate communication will be prompted and reinforced consistently. Prompts and reinforcement will be systematically faded as the member demonstrates independent and generalized use of the response.`,

  verbalBehaviorInstruction: `The member may receive instruction targeting functional verbal operants, including mands, tacts, echoics, intraverbals, and listener responding, as clinically indicated. Instruction may include concentrated teaching opportunities to establish new skills, interspersed practice to promote discrimination and retention, and planned opportunities for generalization.

Teaching will occur within structured activities and natural routines so the member can use acquired communication skills across people, materials, activities, and environments.`,

  delayDenialTolerance: `When the member requests attention, an item, or an activity, the member may be taught to tolerate a brief, signaled delay before obtaining the requested reinforcer. The initial delay will be based on baseline data and the member's current tolerance. Delays will be increased gradually only when the member demonstrates success at the current interval.

When the requested reinforcer is unavailable, the member may be taught to accept no, select an available alternative, or engage in another activity. Successful waiting and appropriate acceptance of alternatives will receive descriptive praise and access to the requested or alternative reinforcer when available.`,

  premackPrinciple: `Access to a high-probability or preferred activity may be made contingent on completing a lower-probability or less-preferred activity. The contingency will be communicated clearly, such as, First complete the activity, then play the game. The selected preferred activity must be demonstrated through assessment or observation to function as an effective reinforcer for the member.`,

  promptFading: `Verbal, gestural, visual, model, positional, or physical prompts may be used to increase correct responding and support the acquisition of replacement skills. The least intrusive effective prompt will be selected according to the member's needs and the teaching procedure.

Correct responses will be reinforced, and prompts will be systematically delayed or faded to reduce prompt dependence and increase independent responding. Physical prompting will be used only when clinically justified, permitted, included in the authorized treatment plan, and implemented by appropriately trained individuals.`,

  shaping: `Shaping may be used to develop skills that are not currently present in the member's repertoire. Successive approximations that increasingly resemble the terminal behavior will be reinforced. Reinforcement criteria will be adjusted systematically based on the member's performance until the terminal behavior is achieved.`,

  highProbabilityRequests: `Before presenting a difficult or low-probability demand, the caregiver or RBT will present several brief instructions with which the member has a demonstrated history of compliance. Appropriate responses will receive immediate reinforcement, followed promptly by the more difficult instruction. The number and pace of requests will be individualized and adjusted according to the member's performance and treatment data.`,

  behavioralMomentum: `Behavioral momentum will be used to increase cooperation and reduce task refusal by establishing a pattern of successful responding and reinforcement before presenting a more difficult task. After the member responds successfully to several manageable instructions, the caregiver or RBT will promptly present the more challenging instruction and reinforce appropriate participation. Implementation will be individualized and monitored using objective treatment data.`,

  pairing: `Pairing is the process through which the therapist establishes a positive therapeutic relationship with the member by consistently associating their presence with preferred activities, items, attention, and other forms of reinforcement. During pairing, the therapist follows the member's interests, provides access to preferred experiences, limits unnecessary demands, and observes the member's preferences and communication. The purpose is to establish the therapist and treatment environment as conditioned reinforcers, increase engagement and cooperation, and prepare the member for effective skill acquisition. Pairing is an ongoing process that is revisited throughout treatment, particularly following changes in staff, settings, routines, or the member's willingness to participate.`,

  dra: `The member will be taught functionally equivalent and socially appropriate responses to replace target behaviors. Alternative responses may include:

- Appropriately requesting a break, attention, assistance, an item, or an activity
- Waiting appropriately for access to reinforcement
- Selecting an available alternative
- Using appropriate sensory alternatives
- Participating in leisure activities
- Cooperating with necessary routines and instructions

Initially, appropriate alternative responses may receive immediate reinforcement on a continuous schedule. Reinforcement may include attention, descriptive praise, preferred items, activities, breaks, or other functionally appropriate outcomes identified through preference and reinforcer assessments.

Reinforcers will be monitored and varied because their effectiveness may change over time.`,

  thinDra: `The reinforcement schedule will be thinned gradually after objective data demonstrate stable increases in independent replacement behavior and sustained reductions in target behavior. Thinning may involve increasing the number of responses required, increasing the delay to reinforcement, or transitioning from continuous to intermittent reinforcement.

The behavior analyst will establish individualized criteria and schedules rather than relying exclusively on generalized percentage increases or fixed-interval schedules. If replacement behavior decreases or target behavior increases, the previous effective schedule may be reinstated before attempting a more gradual reduction.`,

  dri: `The member will receive reinforcement for behavior that cannot occur simultaneously with the target behavior. The incompatible response must be safe, functional, socially appropriate, and relevant to the context. For example, the member may be reinforced for keeping hands engaged with an appropriate activity when that response is physically incompatible with unsafe hand behavior.`,

  dro: `Reinforcement will be provided when the specified target behavior does not occur during a predetermined interval. The initial interval will be based on baseline data and adjusted according to the member's performance.

If the target behavior does not occur during the interval, the member will receive the identified reinforcer. If the behavior occurs, the interval will be reset or the programmed procedure will be followed without reprimands or punitive consequences. This procedure will not be used in a manner that withholds access to essential needs, communication, regulation, or safety support.`,

  plannedIgnoring: `When assessment data indicate that a target behavior is maintained by social attention, caregivers and treatment providers may withhold attention following the behavior while continuing to monitor the member's safety. Attention will be provided promptly when the member demonstrates an appropriate alternative response, consistent with the DRA procedure.

Planned ignoring will not be used for self-injurious behavior, aggression, medical concerns, dangerous behavior, or any behavior requiring immediate protective intervention. It also does not mean leaving the member unattended or ignoring appropriate communication.`,

  alternativeRedirection: `When precursor behavior or target behavior occurs, the member may be redirected to a functionally equivalent and socially appropriate response. Whenever possible, redirection will occur when early precursors are observed. The replacement response will be prompted as needed and reinforced according to the treatment plan.

The timing of redirection will be individualized to avoid accidentally reinforcing target behavior or creating a response chain in which target behavior reliably precedes reinforcement. Safety-related behavior will be addressed immediately according to the approved safety protocol.`,

  stopRedirectReinforce: `When the member engages in a target behavior, the therapist or caregiver will briefly and neutrally signal the member to stop, redirect the member to a safe and appropriate alternative response, and provide reinforcement after the member engages in the alternative behavior. This procedure will be implemented consistently with the identified behavioral function and the member's approved treatment and safety protocols.`,

  matchingLawTreatment: `Treatment will arrange reinforcement contingencies so appropriate replacement behaviors produce relatively greater reinforcement than target behaviors. Reinforcement for replacement behaviors may be delivered more frequently, immediately, consistently, or at a higher quality than reinforcement associated with target behaviors. These arrangements are intended to increase the likelihood that the member will allocate responding toward appropriate alternatives. Reinforcement values and schedules will be individualized and adjusted using direct treatment data and ongoing preference assessment.`,
}
