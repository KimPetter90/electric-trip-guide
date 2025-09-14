import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  className?: string;
}

export function AutocompleteInput({
  id,
  placeholder,
  value,
  onChange,
  suggestions,
  className
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value.length >= 1) { // Show suggestions after just 1 character
      const filtered = suggestions
        .filter(suggestion =>
          suggestion.toLowerCase().startsWith(value.toLowerCase()) // Use startsWith for faster matching
        )
        .slice(0, 8); // Limit to 8 suggestions for better performance
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0 && value.length > 0);
      setHighlightedIndex(-1);
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
    }
  }, [value, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click events on suggestions
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          if (filteredSuggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        className={className}
        autoComplete="off"
      />
      
      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-[100] w-full mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-xl max-h-48 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, index) => {
            // Highlight matching part
            const matchIndex = suggestion.toLowerCase().indexOf(value.toLowerCase());
            const beforeMatch = suggestion.substring(0, matchIndex);
            const match = suggestion.substring(matchIndex, matchIndex + value.length);
            const afterMatch = suggestion.substring(matchIndex + value.length);
            
            return (
              <li
                key={suggestion}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm capitalize transition-colors duration-150",
                  index === highlightedIndex
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/80 text-foreground"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span>
                  {beforeMatch}
                  <span className="font-semibold">{match}</span>
                  {afterMatch}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}