'use client'

import { UseFormRegisterReturn } from 'react-hook-form'

interface RankingInputProps {
  label: string
  options: readonly string[]
  value: string[]
  onChange: (ordered: string[]) => void
  register?: UseFormRegisterReturn
  error?: string
  disabled?: boolean
  className?: string
}

export default function RankingInput({
  label,
  value,
  onChange,
  register,
  error,
  disabled = false,
  className = '',
}: RankingInputProps) {
  const move = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...value]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= newOrder.length) return
    ;[newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]]
    onChange(newOrder)
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {register && <input type="hidden" {...register} />}
      <label className="mb-2 font-medium text-sm sm:text-base">{label}</label>
      <p className="text-xs text-muted-foreground mb-2">
        Use as setas para ordenar (mais importante no topo)
      </p>
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li
            key={item}
            className="flex items-center gap-2 p-2.5 sm:p-3 border border-input rounded-md bg-background min-h-[44px]"
          >
            <span className="text-muted-foreground font-medium w-6 flex-shrink-0 text-sm">
              {index + 1}.
            </span>
            <span className="flex-1 min-w-0 text-sm break-words">{item}</span>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => move(index, 'up')}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Subir ${item}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                disabled={disabled || index === value.length - 1}
                onClick={() => move(index, 'down')}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Descer ${item}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  )
}
