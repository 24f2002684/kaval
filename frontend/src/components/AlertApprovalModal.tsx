import React, { useState } from 'react';
import { Alert } from '../types';
import { api } from '../services/api';
import { X, Check, AlertTriangle, ShieldCheck, Languages } from 'lucide-react';

interface AlertApprovalModalProps {
  alert: Alert | null;
  onClose: () => void;
  onApproved: (updatedAlert: Alert) => void;
  onRejected: (updatedAlert: Alert) => void;
}

export const AlertApprovalModal: React.FC<AlertApprovalModalProps> = ({
  alert,
  onClose,
  onApproved,
  onRejected
}) => {
  if (!alert) return null;

  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const handleApprove = async () => {
    try {
      setLoading(true);
      const updated = await api.approveAlert(alert.alert_id);
      onApproved(updated);
      onClose();
    } catch (err) {
      window.alert('Failed to approve alert: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const updated = await api.rejectAlert(alert.alert_id, rejectReason);
      onRejected(updated);
      onClose();
    } catch (err) {
      window.alert('Failed to reject alert: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-navy-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-warning/20 text-amber-warning flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Human Approval Gate</h3>
              <p className="text-xs text-slate-300">
                Disaster Officer Sign-Off (Protocol 4.2)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Metadata */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500">Alert ID:</span>{' '}
              <b className="font-mono text-navy-900">{alert.alert_id}</b>
            </div>
            <div>
              <span className="text-slate-500">Household:</span>{' '}
              <b className="font-mono text-navy-900">{alert.household_id}</b>
            </div>
            <div>
              <span className="text-slate-500">Recipient:</span>{' '}
              <b>{alert.recipient_phone}</b>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-teal" /> Dispatch Message Preview
              </label>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Language: {alert.language}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed shadow-inner">
              {alert.message_body}
            </div>
          </div>

          <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <b>Caution:</b> Authorizing this action logs your identity and transmits simulated SMS broadcasts across active emergency relays.
            </span>
          </div>

          {showRejectBox && (
            <div className="space-y-1.5 animate-in fade-in duration-100">
              <label className="text-xs font-bold text-slate-700">Rejection Reason</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Household confirmed evacuated already"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
              />
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!showRejectBox ? (
            <button
              onClick={() => setShowRejectBox(true)}
              className="text-xs text-red-600 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              Reject Alert
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={handleReject}
              className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
            >
              Confirm Rejection
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={handleApprove}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Approve & Dispatch
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
