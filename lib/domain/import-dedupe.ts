export type DuplicateCheckDraft = {
  cultivarName: string;
  quantity: number;
  fieldLocation: string;
  infrastructureType: string;
  datePlanted: Date | string;
};

export type ExistingBatchForDuplicateCheck = {
  id: string;
  startingQuantity: number;
  fieldLocation: string;
  infrastructureType: string;
  datePlanted: Date;
  category: {
    cultivarName: string;
  };
};

export function buildDraftDuplicateKey(draft: DuplicateCheckDraft) {
  return [
    normalizeKeyPart(draft.cultivarName),
    draft.quantity,
    normalizeKeyPart(draft.fieldLocation),
    normalizeKeyPart(draft.infrastructureType),
    normalizeDateKey(draft.datePlanted),
  ].join("|");
}

export function buildExistingBatchDuplicateKey(batch: ExistingBatchForDuplicateCheck) {
  return [
    normalizeKeyPart(batch.category.cultivarName),
    batch.startingQuantity,
    normalizeKeyPart(batch.fieldLocation),
    normalizeKeyPart(batch.infrastructureType),
    normalizeDateKey(batch.datePlanted),
  ].join("|");
}

function normalizeKeyPart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}
