import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country: string;
  className?: string;
  id?: string;
}

// Country code mapping
const COUNTRY_CODES: Record<string, { code: string; flag: string }> = {
  Kenya: { code: "+254", flag: "🇰🇪" },
  Uganda: { code: "+256", flag: "🇺🇬" },
  Tanzania: { code: "+255", flag: "🇹🇿" },
  Rwanda: { code: "+250", flag: "🇷🇼" },
  Burundi: { code: "+257", flag: "🇧🇮" },
  "South Sudan": { code: "+211", flag: "🇸🇸" },
  Ethiopia: { code: "+251", flag: "🇪🇹" },
  Somalia: { code: "+252", flag: "🇸🇴" },
  Nigeria: { code: "+234", flag: "🇳🇬" },
  Ghana: { code: "+233", flag: "🇬🇭" },
  "South Africa": { code: "+27", flag: "🇿🇦" },
  Egypt: { code: "+20", flag: "🇪🇬" },
  Morocco: { code: "+212", flag: "🇲🇦" },
  Algeria: { code: "+213", flag: "🇩🇿" },
  Tunisia: { code: "+216", flag: "🇹🇳" },
  Zimbabwe: { code: "+263", flag: "🇿🇼" },
  Zambia: { code: "+260", flag: "🇿🇲" },
  Botswana: { code: "+267", flag: "🇧🇼" },
  Mozambique: { code: "+258", flag: "🇲🇿" },
  Malawi: { code: "+265", flag: "🇲🇼" },
};

export const PhoneInput = ({ value, onChange, country, className, id }: PhoneInputProps) => {
  const countryInfo = COUNTRY_CODES[country] || { code: "", flag: "🌍" };
  
  // Extract the number part (without country code)
  const getNumberWithoutCode = (fullNumber: string) => {
    if (!fullNumber) return "";
    // If number starts with the country code, remove it
    if (countryInfo.code && fullNumber.startsWith(countryInfo.code)) {
      return fullNumber.slice(countryInfo.code.length);
    }
    // If number starts with +, try to find and remove any country code
    if (fullNumber.startsWith("+")) {
      const possibleCode = Object.values(COUNTRY_CODES).find(c => fullNumber.startsWith(c.code));
      if (possibleCode) {
        return fullNumber.slice(possibleCode.code.length);
      }
    }
    return fullNumber.replace(/^\+/, "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^\d]/g, ""); // Only allow digits
    const fullNumber = countryInfo.code ? `${countryInfo.code}${input}` : `+${input}`;
    onChange(fullNumber);
  };

  return (
    <div className="relative flex items-center gap-2">
      {country && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border border-input h-10">
          <span className="text-2xl leading-none">{countryInfo.flag}</span>
          <span className="text-sm font-medium text-muted-foreground">{countryInfo.code}</span>
        </div>
      )}
      <Input
        id={id}
        type="tel"
        value={getNumberWithoutCode(value)}
        onChange={handleChange}
        placeholder={country ? "712345678" : "+254712345678"}
        className={className}
      />
    </div>
  );
};
