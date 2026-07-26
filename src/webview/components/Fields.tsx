import { useEffect, useState } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onCommit(value: string): void;
}

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onCommit(value: number): void;
}

export function TextField({ label, value, onCommit }: TextFieldProps) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <label className="form-label text-secondary-emphasis m-0">
      {label}
      <input
        className="form-control form-control-sm"
        value={draftValue}
        onChange={(event) => setDraftValue(event.currentTarget.value)}
        onBlur={() => onCommit(draftValue)}
      />
    </label>
  );
}

export function NumberField({ label, value, min, max, onCommit }: NumberFieldProps) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  return (
    <label className="form-label text-secondary-emphasis m-0">
      {label}
      <input
        className="form-control form-control-sm"
        type="number"
        min={min}
        max={max}
        value={draftValue}
        onChange={(event) => setDraftValue(event.currentTarget.value)}
        onBlur={() => onCommit(Number(draftValue))}
      />
    </label>
  );
}
