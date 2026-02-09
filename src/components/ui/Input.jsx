import { forwardRef } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

// Input Component
export const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onClear,
  error,
  disabled = false,
  readOnly = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            w-full bg-gray-800 text-white placeholder-gray-400
            border border-gray-700 rounded-md
            focus:border-netflix-red focus:outline-none focus:ring-2 focus:ring-red-500/20
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon || onClear ? 'pr-10' : 'pr-4'}
            py-2.5
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {(rightIcon || onClear) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {onClear && value ? (
              <button
                type="button"
                onClick={onClear}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={18} />
              </button>
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// Search Input Component
export const SearchInput = forwardRef(({
  value,
  onChange,
  onClear,
  onKeyDown,
  placeholder = 'Search movies, TV shows...',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      <FiSearch 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
        size={20}
      />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`
          w-full pl-12 pr-10 py-3
          bg-gray-800/90 backdrop-blur-sm
          text-white placeholder-gray-400
          border border-gray-700/50 rounded-full
          focus:border-netflix-red focus:outline-none focus:ring-2 focus:ring-red-500/20
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        >
          <FiX size={20} />
        </button>
      )}
    </div>
  )
})

SearchInput.displayName = 'SearchInput'

export default Input

