import { useEffect } from 'react';

/**
 * Reusable Modal Component
 */
const Modal = ({ isOpen, onClose, title, children, footer, size = 'medium' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        small: 'modal-small',
        medium: 'modal-medium',
        large: 'modal-large'
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-container ${sizeClasses[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Confirm Modal - for yes/no confirmations
 */
export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message,
    confirmText = 'Ya',
    cancelText = 'Batal',
    confirmStyle = 'danger' // 'danger' | 'primary' | 'success'
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="small"
            footer={
                <>
                    <button className="btn btn-outline" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn btn-${confirmStyle}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </>
            }
        >
            <p className="modal-message">{message}</p>
        </Modal>
    );
};

/**
 * Alert Modal - for notifications
 */
export const AlertModal = ({
    isOpen,
    onClose,
    title = 'Notifikasi',
    message,
    type = 'info', // 'info' | 'success' | 'error' | 'warning'
    buttonText = 'OK',
    actionButton = null, // Optional action button { text, onClick, className }
    showPrintButton = false,
    onPrint = null
}) => {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="small"
            footer={
                <>
                    {(showPrintButton && onPrint) && (
                        <button
                            className="btn btn-success"
                            onClick={onPrint}
                        >
                            🖨️ Cetak Struk
                        </button>
                    )}
                    {actionButton && (
                        <button
                            className={actionButton.className || 'btn btn-primary'}
                            onClick={() => {
                                actionButton.onClick();
                                onClose();
                            }}
                        >
                            {actionButton.text}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={onClose}>
                        {buttonText}
                    </button>
                </>
            }
        >
            <div className={`alert-content alert-${type}`}>
                <span className="alert-icon">{icons[type]}</span>
                <p className="modal-message">{message}</p>
            </div>
        </Modal>
    );
};

export default Modal;
