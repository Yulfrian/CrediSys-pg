import React, { useState } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import './PaymentModal.css';
import api from '../../services/api';

const PaymentModal = ({ onClose, cuota, prestamo, onPaymentSuccess }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Formato para mostrar la tarjeta gráficamente (simulacion)
  const displayCardNumber = cardNumber.padEnd(16, '•').replace(/(\w{4})/g, '$1 ').trim();
  const displayExpiry = expiry.length >= 2 ? `${expiry.substring(0, 2)}/${expiry.substring(2).padEnd(2, '•')}` : 'MM/YY';

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 16) setCardNumber(value);
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setExpiry(value);
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setCvv(value);
  };

  const formatearMoneda = (value) => {
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP',
    }).format(Number(value || 0));
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (cardNumber.length < 15 || expiry.length < 4 || cvv.length < 3 || !cardName) {
      setError('Por favor, complete todos los campos de la tarjeta correctamente.');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Simulamos un delay de pasarela de pago real para efecto de UI
      await new Promise(resolve => setTimeout(resolve, 1500));

      const payload = {
        prestamo_id: prestamo.id,
        cuota_id: cuota.id,
        monto_pagado: cuota.monto_cuota
      };

      await api.post('/pagos/en-linea', payload);
      
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al procesar el pago. Intente de nuevo.');
      setIsProcessing(false);
    }
  };

  if (!cuota || !prestamo) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        {success && (
          <div className="success-overlay">
            <CheckCircle size={64} className="success-icon-large" />
            <h2>¡Pago Exitoso!</h2>
            <p>Se ha procesado el pago de {formatearMoneda(cuota.monto_cuota)} a la cuota N° {cuota.numero_cuota}.</p>
          </div>
        )}

        <div className="payment-modal-header">
          <h3><Lock size={20} className="text-primary" /> Checkout Seguro</h3>
          <button className="payment-close-btn" onClick={onClose} disabled={isProcessing}>
            <X size={20} />
          </button>
        </div>

        <div className="payment-modal-body">
          <div className="payment-amount-display">
            <span>Total a Pagar</span>
            <h2>{formatearMoneda(cuota.monto_cuota)}</h2>
          </div>

          <div className="credit-card-ui">
            <div className="card-top">
              <div className="card-chip"></div>
              <div className="card-type">
                <Smartphone size={24} color="rgba(255,255,255,0.8)" />
              </div>
            </div>
            <div className="card-number-display">
              {displayCardNumber}
            </div>
            <div className="card-bottom">
              <div>
                <div className="card-label">Titular de la Tarjeta</div>
                <div className="card-value">{cardName.toUpperCase() || 'NOMBRE DEL TITULAR'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="card-label">Expira</div>
                <div className="card-value">{displayExpiry}</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form id="paymentForm" onSubmit={handlePay} className="payment-form-grid">
            <div className="payment-form-group full">
              <div className="payment-input-container">
                <CreditCard size={18} />
                <input 
                  type="text" 
                  className="payment-input" 
                  placeholder="Número de Tarjeta" 
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                />
              </div>
            </div>
            
            <div className="payment-form-group full">
               <input 
                  type="text" 
                  className="payment-input" 
                  placeholder="Nombre en la Tarjeta" 
                  style={{ paddingLeft: '1rem' }}
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
            </div>

            <div className="payment-form-group">
               <input 
                  type="text" 
                  className="payment-input" 
                  placeholder="MM/YY" 
                  style={{ paddingLeft: '1rem' }}
                  value={expiry}
                  onChange={handleExpiryChange}
                />
            </div>
            
            <div className="payment-form-group">
               <input 
                  type="password" 
                  className="payment-input" 
                  placeholder="CVV" 
                  style={{ paddingLeft: '1rem' }}
                  value={cvv}
                  onChange={handleCvvChange}
                  maxLength="4"
                />
            </div>
          </form>
        </div>

        <div className="payment-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isProcessing}>Cancelar</button>
          <button type="submit" form="paymentForm" className="btn-proceed" disabled={isProcessing}>
            {isProcessing ? 'Procesando...' : `Pagar ${formatearMoneda(cuota.monto_cuota)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
