export type AddressSuggestion = {
  value: string;
  unrestrictedValue: string;
  postalCode?: string | null;
  city?: string | null;
  street?: string | null;
  house?: string | null;
};
