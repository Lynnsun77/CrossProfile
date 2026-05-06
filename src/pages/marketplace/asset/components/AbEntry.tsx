interface AbEntryProps {
  onCreate: () => void;
}

export function AbEntry({ onCreate }: AbEntryProps) {
  return (
    <button type="button" onClick={onCreate} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2">
      创建 AB 实验
    </button>
  );
}
