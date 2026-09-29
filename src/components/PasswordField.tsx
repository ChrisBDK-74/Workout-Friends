import { useState } from 'react';
import { EyeIcon } from './Icons';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  describedBy?: string;
  invalid?: boolean;
}

/** Password input with a show/hide button (easier than typing blind on a phone). */
export default function PasswordField({ id, label, value, onChange, autoComplete, describedBy, invalid }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="password-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input"
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <EyeIcon />
        </button>
      </div>
    </div>
  );
}
