"use client";

import { Input } from "@/components/ui/input";

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

export function DateFilter({ startDate, endDate, onChange }: DateFilterProps) {
  return (
    <div className="flex gap-2 items-center">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
      />
      <span>to</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
      />
    </div>
  );
}
