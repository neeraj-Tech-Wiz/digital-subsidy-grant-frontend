/**
 * Utility formater for Indian money (e.g. ₹50,00,000) 
 */
export function formatIndianCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return "₹0";
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
}
