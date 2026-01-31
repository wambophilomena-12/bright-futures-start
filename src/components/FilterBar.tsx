import React, { useState } from "react";
import { Search, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
};

export const FilterBar = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  return (
    /* max-w-4xl matches your SearchBarWithSuggestions */
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0">
      <div className="flex flex-row items-center bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden h-14 md:h-16">
        
        {/* WHERE SECTION */}
        <div className="flex flex-col flex-1 px-4 md:px-6 py-1 min-w-[100px]">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5" /> Where
          </label>
          <input 
            type="text" 
            placeholder="Destinations" 
            className="bg-transparent border-none p-0 text-sm md:text-base focus:ring-0 placeholder:text-slate-300 font-bold outline-none text-slate-700"
          />
        </div>

        <div className="w-[1px] h-8 bg-slate-100 self-center" />

        {/* FROM SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col px-4 md:px-6 py-1 cursor-pointer hover:bg-slate-50 transition-colors min-w-[80px] md:min-w-[120px]">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <CalendarIcon className="h-2.5 w-2.5" /> From
              </span>
              <span className={cn("text-sm md:text-base font-bold", !dateFrom ? "text-slate-300" : "text-slate-700")}>
                {dateFrom ? format(dateFrom, "MMM dd") : "Add"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="center">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="w-[1px] h-8 bg-slate-100 self-center" />

        {/* TO SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col px-4 md:px-6 py-1 cursor-pointer hover:bg-slate-50 transition-colors min-w-[80px] md:min-w-[120px]">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <CalendarIcon className="h-2.5 w-2.5" /> To
              </span>
              <span className={cn("text-sm md:text-base font-bold", !dateTo ? "text-slate-300" : "text-slate-700")}>
                {dateTo ? format(dateTo, "MMM dd") : "Add"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="center">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              disabled={(date) => (dateFrom ? date <= dateFrom : date < new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* SEARCH BUTTON - Rectangular and matching the bar height */}
        <div className="h-full">
          <button
            className="flex items-center justify-center gap-2 text-white h-full px-5 md:px-8 transition-all hover:brightness-110 active:scale-95 border-none"
            style={{ 
                background: `linear-gradient(135deg, ${COLORS.TEAL} 0%, #006666 100%)` 
            }}
          >
            <Search className="w-5 h-5 stroke-[3px]" />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};