import { useCallback, useEffect } from 'react'
import { FiX } from 'react-icons/fi'

// Modal Component
export const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose()
    }
  }, [closeOnEscape, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }[size]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div 
        className={`
          relative w-full ${sizeClasses} 
          bg-gray-900 rounded-lg shadow-2xl
          animate-scale-in
          max-h-[90vh] overflow-hidden
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            {title && (
              <h2 id="modal-title" className="text-xl font-bold text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Confirmation Modal
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-netflix-red hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${variantClasses[variant]}`}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Image Modal (for viewing posters/backdrops)
export const ImageModal = ({
  isOpen,
  onClose,
  src,
  alt = 'Image',
  closeOnOverlayClick = true,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={true}
      closeOnOverlayClick={closeOnOverlayClick}
      className="bg-transparent shadow-none"
    >
      <div className="flex items-center justify-center h-full">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Modal>
  )
}

// Video Modal (for trailers)
export const VideoModal = ({
  isOpen,
  onClose,
  videoId,
  title,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton={true}
      className="bg-black"
    >
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title || 'Video'}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </Modal>
  )
}

export default Modal

