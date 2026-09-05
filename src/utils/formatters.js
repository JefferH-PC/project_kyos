const numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export const formatMoney = (value) => numberFormatter.format(Number(value) || 0);
export const formatDecimal = (value) => numberFormatter.format(Number(value) || 0);
