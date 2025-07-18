import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './BattleLobby.css';

interface BattleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BattleFormData) => Promise<void>;
}

export interface BattleFormData {
  battleType: 'Solo' | 'Duo' | 'Team';
  participantCount: number;
  language: 'JavaScript' | 'Python' | 'Java';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  aiHints: boolean;
}

const defaultForm: BattleFormData = {
  battleType: 'Solo',
  participantCount: 2,
  language: 'JavaScript',
  difficulty: 'Easy',
  aiHints: false,
};

const BattleFormModal: React.FC<BattleFormModalProps> = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState<BattleFormData>(defaultForm);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const validate = () => {
    const errs: { [k: string]: string } = {};
    if (!form.battleType) errs.battleType = 'Battle type required';
    if (!form.participantCount || form.participantCount < 2 || form.participantCount > 10) errs.participantCount = 'Participants must be 2-10';
    if (!form.language) errs.language = 'Language required';
    if (!form.difficulty) errs.difficulty = 'Difficulty required';
    // Solo: 2, Duo: 2, Team: 2-10
    if (form.battleType === 'Solo' && form.participantCount !== 2) errs.participantCount = 'Solo must have 2 participants';
    if (form.battleType === 'Duo' && form.participantCount !== 2) errs.participantCount = 'Duo must have 2 participants';
    if (form.battleType === 'Team' && (form.participantCount < 2 || form.participantCount > 10)) errs.participantCount = 'Team must have 2-10 participants';
    return errs;
  };

  const handleChange = (field: keyof BattleFormData, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => {
      const { [field]: _removed, ...rest } = e;
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      await onSubmit(form);
      setLoading(false);
      onClose();
      setForm(defaultForm);
      setSubmitted(false);
    } catch (err) {
      setLoading(false);
      setErrors({ api: 'Failed to create battle. Try again.' });
    }
  };

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <motion.div
        className="dashboard-modal battle-form-modal"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h2>Create Battle</h2>
        <form onSubmit={handleSubmit}>
          {/* Battle Type Dropdown */}
          <label>Battle Type</label>
          <select
            value={form.battleType}
            onChange={e => handleChange('battleType', e.target.value as BattleFormData['battleType'])}
            required
          >
            <option value="Solo">Solo</option>
            <option value="Duo">Duo</option>
            <option value="Team">Team</option>
          </select>
          {errors.battleType && <div className="form-error">{errors.battleType}</div>}

          {/* Participant Count Slider */}
          <label>Participants: {form.participantCount}</label>
          <input
            type="range"
            min={2}
            max={10}
            value={form.participantCount}
            onChange={e => handleChange('participantCount', Number(e.target.value))}
            step={1}
          />
          {errors.participantCount && <div className="form-error">{errors.participantCount}</div>}

          {/* Language Selector */}
          <label>Language</label>
          <div className="language-options">
            {(['JavaScript', 'Python', 'Java'] as const).map(lang => (
              <label key={lang} className={`language-option${form.language === lang ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="language"
                  value={lang}
                  checked={form.language === lang}
                  onChange={() => handleChange('language', lang)}
                />
                {lang}
              </label>
            ))}
          </div>
          {errors.language && <div className="form-error">{errors.language}</div>}

          {/* Difficulty Toggle */}
          <label>Difficulty</label>
          <div className="difficulty-toggle">
            {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
              <label key={diff} className={`difficulty-option${form.difficulty === diff ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="difficulty"
                  value={diff}
                  checked={form.difficulty === diff}
                  onChange={() => handleChange('difficulty', diff)}
                />
                {diff}
              </label>
            ))}
          </div>
          {errors.difficulty && <div className="form-error">{errors.difficulty}</div>}

          {/* Custom Rules Switch */}
          <label className="switch-label">
            <input
              type="checkbox"
              checked={form.aiHints}
              onChange={e => handleChange('aiHints', e.target.checked)}
            />
            Enable AI Hints
          </label>

          {errors.api && <div className="form-error">{errors.api}</div>}

          <button type="submit" className="modal-submit-btn" disabled={loading}>
            {loading ? <span className="loading-spinner" /> : 'Create Battle'}
          </button>
        </form>
        <button className="close-modal" onClick={onClose}>Close</button>
      </motion.div>
    </div>
  );
};

export default BattleFormModal; 