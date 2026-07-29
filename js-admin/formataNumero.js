function formatarNumero(numero) {
    numero = numero.toString().replace(/\D/g, "");

    if (numero.length !== 11) {
        return "Número inválido";
    }

    return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}

export { formatarNumero }