"use client";

import { Input } from "@/components/ui/input";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  return (
    <Input
      placeholder={placeholder || "Search..."}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-xs"
    />
  );
}
