import { useState } from 'react'
import { Input } from './Input'
import { Button } from './Button'
import { Copy, Check } from 'lucide-react'

export function JoinCodeInput({ code, onJoin }) {
  const [copied, setCopied] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleJoin = () => {
    if (inputValue.trim() && onJoin) {
      onJoin(inputValue.trim().toUpperCase())
    }
  }

  if (code) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-md border">
          <span className="text-sm font-mono font-medium text-gray-700">{code}</span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Enter code"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
        className="w-32 text-sm font-mono"
        maxLength={10}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
      />
      <Button size="sm" onClick={handleJoin} disabled={!inputValue.trim()}>
        Join
      </Button>
    </div>
  )
}
