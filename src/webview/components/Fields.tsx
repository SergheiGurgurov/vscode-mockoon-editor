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
  return (
    <label className="form-label text-secondary-emphasis m-0">
      {label}
      <input className="form-control form-control-sm" defaultValue={value} onBlur={(event) => onCommit(event.currentTarget.value)} />
    </label>
  );
}

export function NumberField({ label, value, min, max, onCommit }: NumberFieldProps) {
  return (
    <label className="form-label text-secondary-emphasis m-0">
      {label}
      <input
        className="form-control form-control-sm"
        type="number"
        min={min}
        max={max}
        defaultValue={value}
        onBlur={(event) => onCommit(Number(event.currentTarget.value))}
      />
    </label>
  );
}
