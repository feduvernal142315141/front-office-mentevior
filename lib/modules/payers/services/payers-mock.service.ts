import {
  PAYER_SOURCE,
  PLAN_TYPE_STATUS,
  type CreatePayerDto,
  type ListPayersQueryDto,
  type Payer,
  type PayerAddress,
  type PayerBaseFormFields,
  type PayerCatalogItem,
  type PayerPlanTypeItem,
  type UpdatePayerDto,
  type UpdatePayerPlanDto,
} from "@/lib/types/payer.types"
import type { PayersServiceContract } from "../types/payers-service.types"

const PLAN_TYPES: PayerPlanTypeItem[] = [
  { id: "pt-hmo", name: "HMO", status: PLAN_TYPE_STATUS.VALID },
  { id: "pt-ppo", name: "PPO", status: PLAN_TYPE_STATUS.VALID },
  { id: "pt-epo", name: "EPO", status: PLAN_TYPE_STATUS.VALID },
  { id: "pt-pos", name: "POS", status: PLAN_TYPE_STATUS.VALID },
  { id: "pt-indemnity", name: "Indemnity", status: PLAN_TYPE_STATUS.DEPRECATED },
  { id: "pt-capitated", name: "Capitated", status: PLAN_TYPE_STATUS.DEPRECATED },
]

const PRIVATE_INSURANCES: PayerCatalogItem[] = [
  { id: "pi-aetna", name: "Aetna Better Health", logoUrl: "AB" },
  { id: "pi-cigna", name: "Cigna", logoUrl: "CG" },
  { id: "pi-uhc", name: "UnitedHealthcare", logoUrl: "UH" },
  { id: "pi-humana", name: "Humana", logoUrl: "HM" },
  { id: "pi-flbc", name: "Florida Blue", logoUrl: "FB" },
  { id: "pi-molina", name: "Molina Healthcare", logoUrl: "MH" },
]

const FL_MEDICAID_INSURANCES: PayerCatalogItem[] = [
  { id: "fl-aetna", name: "Aetna Better Health of Florida", logoUrl: "AF" },
  { id: "fl-avenity", name: "Avenity Health", logoUrl: "AV" },
  { id: "fl-cms", name: "CMS Health Plan", logoUrl: "CM" },
  { id: "fl-clear", name: "Clear Health Alliance", logoUrl: "CL" },
  { id: "fl-community", name: "Community Care Plan", logoUrl: "CC" },
  { id: "fl-florida-community", name: "Florida Community Care", logoUrl: "FC" },
  { id: "fl-humana", name: "Humana Healthy Horizons", logoUrl: "HH" },
  { id: "fl-molina", name: "Molina Healthcare of Florida", logoUrl: "MF" },
  { id: "fl-simply", name: "Simply Healthcare Plans", logoUrl: "SH" },
  { id: "fl-sunshine", name: "Sunshine Health", logoUrl: "SN" },
  { id: "fl-uhc", name: "UnitedHealthcare Community Plan", logoUrl: "UC" },
  { id: "fl-wellcare", name: "WellCare of Florida", logoUrl: "WF" },
  { id: "fl-zing", name: "Zing Health of Florida", logoUrl: "ZH" },
]

const EMPTY_ADDRESS: PayerAddress = {
  line1: "",
  city: "",
  state: "",
  zipCode: "",
}

function getEmptyForm(name: string): PayerBaseFormFields {
  return {
    name,
    phone: "",
    email: "",
    memberId: "",
    groupNumber: "",
    address: { ...EMPTY_ADDRESS },
  }
}

const INITIAL_PAYERS: Payer[] = [
  {
    id: "payer-001",
    source: PAYER_SOURCE.CATALOG,
    sourceLabel: "Private Insurance",
    logoUrl: "AB",
    createdAt: new Date("2026-02-15").toISOString(),
    updatedAt: new Date("2026-02-20").toISOString(),
    planTypeId: "pt-ppo",
    planTypeName: "PPO",
    notes: "Prior auth required for long sessions.",
    form: {
      ...getEmptyForm("Aetna Better Health"),
      phone: "(305) 555-0142",
    },
  },
  {
    id: "payer-002",
    source: PAYER_SOURCE.FL_MEDICAID,
    sourceLabel: "FL Medicaid",
    logoUrl: "SH",
    createdAt: new Date("2026-02-16").toISOString(),
    updatedAt: new Date("2026-02-18").toISOString(),
    planTypeId: "pt-hmo",
    planTypeName: "HMO",
    notes: "State reporting every month.",
    form: {
      ...getEmptyForm("Simply Healthcare Plans"),
      phone: "(305) 555-0188",
    },
  },
]

let payersDb: Payer[] = [...INITIAL_PAYERS]

function createPayerId(): string {
  return `payer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function findCatalogEntry(source: CreatePayerDto["source"], sourceReferenceId: string): PayerCatalogItem | null {
  if (source === PAYER_SOURCE.CATALOG) {
    return PRIVATE_INSURANCES.find((item) => item.id === sourceReferenceId) || null
  }

  if (source === PAYER_SOURCE.FL_MEDICAID) {
    return FL_MEDICAID_INSURANCES.find((item) => item.id === sourceReferenceId) || null
  }

  return null
}

function sourceToLabel(source: CreatePayerDto["source"]): string {
  if (source === PAYER_SOURCE.CATALOG) {
    return "Private Insurance"
  }

  if (source === PAYER_SOURCE.FL_MEDICAID) {
    return "FL Medicaid"
  }

  return "Manual"
}

function withLatency<T>(result: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), 180)
  })
}

export class MockPayersService implements PayersServiceContract {
  async list(query: ListPayersQueryDto): Promise<Payer[]> {
    const searchValue = query.search.trim().toLowerCase()

    const filtered = searchValue
      ? payersDb.filter((payer) => payer.form.name.toLowerCase().includes(searchValue))
      : payersDb

    return withLatency([...filtered])
  }

  async create(data: CreatePayerDto): Promise<Payer> {
    const catalogEntry = findCatalogEntry(data.source, data.sourceReferenceId)
    const nextPayer: Payer = {
      id: createPayerId(),
      source: data.source,
      sourceLabel: sourceToLabel(data.source),
      logoUrl: catalogEntry?.logoUrl || data.form.name.slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      planTypeId: "",
      planTypeName: "",
      notes: "",
      form: data.form,
    }

    payersDb = [nextPayer, ...payersDb]
    return withLatency(nextPayer)
  }

  async update(data: UpdatePayerDto): Promise<Payer> {
    const current = payersDb.find((payer) => payer.id === data.payerId)

    if (!current) {
      throw new Error("Payer not found")
    }

    const updatedPayer: Payer = {
      ...current,
      form: data.form,
      updatedAt: new Date().toISOString(),
    }

    payersDb = payersDb.map((payer) => (payer.id === data.payerId ? updatedPayer : payer))
    return withLatency(updatedPayer)
  }

  async updatePlan(data: UpdatePayerPlanDto): Promise<Payer> {
    const current = payersDb.find((payer) => payer.id === data.payerId)

    if (!current) {
      throw new Error("Payer not found")
    }

    const selectedPlanType = PLAN_TYPES.find((planType) => planType.id === data.planTypeId)

    if (!selectedPlanType) {
      throw new Error("Plan type not found")
    }

    const updatedPayer: Payer = {
      ...current,
      planTypeId: selectedPlanType.id,
      planTypeName: selectedPlanType.name,
      notes: data.notes,
      updatedAt: new Date().toISOString(),
    }

    payersDb = payersDb.map((payer) => (payer.id === data.payerId ? updatedPayer : payer))
    return withLatency(updatedPayer)
  }

  async getPrivateInsurancesCatalog(): Promise<PayerCatalogItem[]> {
    return withLatency([...PRIVATE_INSURANCES])
  }

  async getFlMedicaidCatalog(): Promise<PayerCatalogItem[]> {
    return withLatency([...FL_MEDICAID_INSURANCES])
  }

  async getPlanTypeCatalog(): Promise<PayerPlanTypeItem[]> {
    return withLatency([...PLAN_TYPES])
  }

  async refresh(): Promise<void> {
    await withLatency(undefined)
  }
}
