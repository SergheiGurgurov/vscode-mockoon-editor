interface StatusToastProps {
  text?: string;
}

export function StatusToast({ text }: StatusToastProps) {
  if (!text) {
    return null;
  }

  return <div className="status-toast border rounded shadow-sm px-3 py-2">{text}</div>;
}
