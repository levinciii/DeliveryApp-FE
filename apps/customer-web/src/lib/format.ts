const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/** The API sends money as 2-decimal strings ("150.00"); convert only for display. */
export function formatPeso(amount: string): string {
  return peso.format(Number(amount));
}
