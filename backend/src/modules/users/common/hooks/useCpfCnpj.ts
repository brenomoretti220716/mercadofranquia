import { validateCNPJ } from '../utils/validateCnpj';
import { validateCPF } from '../utils/validateCpf';

// Function to validate CPF or CNPJ
export const validateCPFOrCNPJ = (document: string): boolean => {
  const cleanDocument = document.replace(/\D/g, '');

  if (cleanDocument.length === 11) {
    return validateCPF(document);
  } else if (cleanDocument.length === 14) {
    return validateCNPJ(document);
  }

  return false;
};
