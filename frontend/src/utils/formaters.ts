/**
 * Removes all non-digit characters from a string
 * Useful for extracting raw digits from formatted phone numbers, CPF, CNPJ, etc.
 */
export const stripNonDigits = (value: string | null | undefined): string => {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

// Formata telefone: (00) 00000-0000 ou (00) 0000-0000
export const formatPhone = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11)

  if (cleanValue.length <= 2) {
    return cleanValue
  } else if (cleanValue.length <= 6) {
    return cleanValue.replace(/(\d{2})(\d)/, '($1) $2')
  } else if (cleanValue.length <= 10) {
    // Formato: (00) 0000-0000
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    // Formato: (00) 00000-0000
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
}

// Formata CPF: 000.000.000-00
export const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11)

  if (cleanValue.length <= 3) {
    return cleanValue
  } else if (cleanValue.length <= 6) {
    return cleanValue.replace(/(\d{3})(\d)/, '$1.$2')
  } else if (cleanValue.length <= 9) {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
  } else {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
  }
}

// Formata CNPJ: 00.000.000/0000-00
export const formatCNPJ = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 14)

  if (cleanValue.length <= 2) {
    return cleanValue
  } else if (cleanValue.length <= 5) {
    return cleanValue.replace(/(\d{2})(\d)/, '$1.$2')
  } else if (cleanValue.length <= 8) {
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
  } else if (cleanValue.length <= 12) {
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
  } else {
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
  }
}

// Formata CPF ou CNPJ automaticamente baseado no tamanho
export const formatCpfCnpj = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '')

  if (cleanValue.length <= 11) {
    return formatCPF(value)
  } else {
    return formatCNPJ(value)
  }
}

// Legacy handler - usar formatCPF diretamente é preferível
export const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value.replace(/\D/g, '')

  if (value.length <= 11) {
    value = value.replace(/(\d{3})(\d)/, '$1.$2')
    value = value.replace(/(\d{3})(\d)/, '$1.$2')
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  e.target.value = value
}

// Valida CPF
export const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')

  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cleanCPF.charAt(10))
}

// Valida CNPJ
export const isValidCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '')

  if (cleanCNPJ.length !== 14 || /^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false
  }

  // Valida primeiro dígito verificador
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false

  // Valida segundo dígito verificador
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  return digit2 === parseInt(cleanCNPJ.charAt(13))
}

/**
 * Formats a number string as Brazilian currency (R$ 50.000)
 * @param value - String containing only digits
 * @returns Formatted currency string
 */
export const formatCurrencyInput = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '')
  if (!cleanValue) return ''

  // Format with thousand separators (dots)
  const formatted = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return formatted
}

/**
 * Removes all formatting from currency string, returning only digits
 * @param value - Formatted currency string
 * @returns String with only digits
 */
export const unformatCurrency = (value: string): string => {
  return value.replace(/\D/g, '')
}
