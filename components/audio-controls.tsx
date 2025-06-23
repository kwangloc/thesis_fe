"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudioControlsProps {
  onSearch: (query: string) => void;
}

export function AudioControls({ onSearch }: AudioControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="text-gray-700">Play</div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="clinician">Clinician</SelectItem>
            <SelectItem value="patient">Patient</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-gray-700">Search</div>
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by keyword"
            className="pl-8"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
