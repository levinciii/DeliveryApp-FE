const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/** The API sends money as 2-decimal strings ("150.00"); convert only for display. */
export function formatPeso(amount: string): string {
  return peso.format(Number(amount));
}

const dateTime = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
