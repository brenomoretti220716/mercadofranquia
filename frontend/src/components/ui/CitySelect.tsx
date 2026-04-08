'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import LocationIcon from '../icons/locationIcon'

interface Municipio {
  id: number
  nome: string
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string
        nome: string
      }
    }
  } | null
}

interface CitySelectProps {
  value?: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  className?: string
  name?: string
}

// Função para remover acentos
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function CitySelect({
  value,
  onChange,
  error,
  placeholder = 'Digite sua cidade',
  className = '',
  name,
}: CitySelectProps) {
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isValidCity, setIsValidCity] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const validationTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)

  useEffect(() => {
    async function fetchMunicipios() {
      try {
        setLoading(true)
        const response = await fetch(
          'https://servicodados.ibge.gov.br/api/v1/localidades/municipios',
        )
        const data = await response.json()

        // Filtrar apenas municípios com dados completos e ordenar por nome
        const validMunicipios = data.filter(
          (municipio: Municipio) =>
            municipio.microrregiao &&
            municipio.microrregiao.mesorregiao &&
            municipio.microrregiao.mesorregiao.UF,
        )

        const sortedData = validMunicipios.sort((a: Municipio, b: Municipio) =>
          a.nome.localeCompare(b.nome),
        )

        setMunicipios(sortedData)
      } catch (error) {
        console.error('Erro ao buscar municípios:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMunicipios()
  }, [])

  // Atualizar inputValue quando value prop mudar (externamente)
  useEffect(() => {
    if (value) {
      setInputValue(value)
      setIsValidCity(true)
    } else if (!hasInteracted) {
      setInputValue('')
      setIsValidCity(false)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filtrar municípios com prioridade para nome da cidade
  const filteredMunicipios = municipios
    .filter((municipio) => {
      if (!municipio.microrregiao?.mesorregiao?.UF) return false
      if (!inputValue || inputValue.length < 2) return false

      const searchLower = removeAccents(inputValue.toLowerCase())
      const nomeLower = removeAccents(municipio.nome.toLowerCase())
      const estadoLower = removeAccents(
        municipio.microrregiao.mesorregiao.UF.sigla.toLowerCase(),
      )

      // Buscar tanto no nome da cidade quanto na sigla do estado
      return (
        nomeLower.includes(searchLower) || estadoLower.includes(searchLower)
      )
    })
    .sort((a, b) => {
      // Ordenar por relevância: cidades que começam com o termo primeiro
      const searchLower = removeAccents(inputValue.toLowerCase())
      const aStartsWith = removeAccents(a.nome.toLowerCase()).startsWith(
        searchLower,
      )
      const bStartsWith = removeAccents(b.nome.toLowerCase()).startsWith(
        searchLower,
      )

      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      return a.nome.localeCompare(b.nome)
    })
    .slice(0, 10)

  // Validação com debounce para melhor performance
  const validateCity = useCallback(
    (cityName: string) => {
      if (cityName.length < 2) {
        setIsValidCity(false)
        onChange('')
        return
      }

      // Verificar se é um valor completo no formato "cidade-estado"
      const isValidComplete = municipios.some((municipio) => {
        const cityValue = `${municipio.nome}-${municipio.microrregiao!.mesorregiao.UF.sigla}`
        return (
          removeAccents(cityValue.toLowerCase()) ===
          removeAccents(cityName.toLowerCase())
        )
      })

      // Verificar se é apenas o nome da cidade
      const isValidNameOnly = filteredMunicipios.some(
        (municipio) =>
          removeAccents(municipio.nome.toLowerCase()) ===
          removeAccents(cityName.toLowerCase()),
      )

      const isValid = isValidComplete || isValidNameOnly
      setIsValidCity(isValid)

      if (!isValid) {
        onChange('')
      } else if (isValidComplete) {
        const cityNameOnly = cityName.split('-')[0].trim()
        onChange(cityNameOnly)
      }
    },
    [filteredMunicipios, municipios, onChange],
  )

  // Debounced validation
  useEffect(() => {
    // Só validar se o usuário interagiu com o campo
    if (!hasInteracted) return

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    validationTimeoutRef.current = setTimeout(() => {
      validateCity(inputValue)
    }, 500) // 500ms delay

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [inputValue, validateCity, hasInteracted])

  // Scroll automático para o item selecionado
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[
        selectedIndex
      ] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [selectedIndex])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
    setIsOpen(newValue.length >= 2)
    setSelectedIndex(-1)
    setHasInteracted(true) // Marcar que o usuário interagiu
  }

  const handleSelectCity = (municipio: Municipio) => {
    const displayValue = `${municipio.nome}-${municipio.microrregiao!.mesorregiao.UF.sigla}`
    setInputValue(displayValue)
    setIsOpen(false)
    setSelectedIndex(-1)
    setIsValidCity(true)
    onChange(municipio.nome)
  }

  const handleInputFocus = () => {
    if (inputValue.length >= 2) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay para permitir clique nas opções
    setTimeout(() => {
      setIsOpen(false)
      setSelectedIndex(-1)
    }, 200)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredMunicipios.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex((prev) => {
          const newIndex = prev < filteredMunicipios.length - 1 ? prev + 1 : 0
          return newIndex
        })
        break

      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : filteredMunicipios.length - 1
          return newIndex
        })
        break

      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredMunicipios.length) {
          handleSelectCity(filteredMunicipios[selectedIndex])
        }
        break

      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  if (loading) {
    return (
      <div
        className={`w-full px-3 py-2 border border-[#747473] rounded-md bg-gray-100 ${className}`}
      >
        <div className="flex items-center">
          <LocationIcon width={20} height={20} color="#747473" />
          <span className="text-gray-500 ml-2">Carregando cidades...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Campo hidden para react-hook-form */}
      <input type="hidden" name={name} value={value || ''} readOnly />

      {/* Container do input com ícone */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <LocationIcon width={20} height={20} color="#747473" />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pl-10 border border-[#747473] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E25E3E] focus:border-[#E25E3E] ${className} ${!isValidCity && inputValue.length >= 2 && hasInteracted ? 'border-red-500' : ''}`}
          autoComplete="off"
          spellCheck="false"
          tabIndex={0}
        />
      </div>

      {/* Dropdown com resultados */}
      {isOpen && filteredMunicipios.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto pb-2"
        >
          {filteredMunicipios.map((municipio, index) => (
            <div
              key={municipio.id}
              onClick={() => handleSelectCity(municipio)}
              className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-[#E25E3E] text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-sm">
                <span className="font-medium">{municipio.nome}</span>
                <span
                  className={`${index === selectedIndex ? 'text-gray-200' : 'text-gray-500'}`}
                >
                  -{municipio.microrregiao!.mesorregiao.UF.sigla}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem quando não encontra resultados */}
      {isOpen && inputValue.length >= 2 && filteredMunicipios.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-3 py-2 text-gray-500 text-sm">
            Nenhuma cidade encontrada para &quot;{inputValue}&quot;
          </div>
        </div>
      )}

      {/* Mensagem para digitar mais caracteres */}
      {isOpen && inputValue.length > 0 && inputValue.length < 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-3 py-2 text-gray-500 text-sm">
            Digite pelo menos 2 caracteres para buscar
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && <div className="text-red-500 text-sm mt-1 ml-1">{error}</div>}

      {/* Mensagem de cidade inválida - só mostra após 2 caracteres e com delay */}
      {!isValidCity && inputValue.length >= 2 && hasInteracted && (
        <div className="text-red-500 text-sm mt-1 ml-1">
          Por favor, selecione uma cidade válida da lista
        </div>
      )}
    </div>
  )
}
