import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Loader2, Building2 } from 'lucide-react';
import { useNorwegianAddresses } from '@/hooks/useNorwegianAddresses';
import { cn } from '@/lib/utils';

interface NorwegianAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const NorwegianAddressInput: React.FC<NorwegianAddressInputProps> = ({
  value,
  onChange,
  placeholder = "Søk etter adresse eller sted...",
  className,
  icon = <MapPin className="h-4 w-4" />
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const { suggestions, loading, searchAddresses, clearSuggestions } = useNorwegianAddresses();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.trim().length >= 2) {
      searchAddresses(newValue);
      setIsOpen(true);
    } else {
      clearSuggestions();
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    const selectedText = suggestion.displayText || 
      (suggestion.type === 'address' ? suggestion.adressetekst : suggestion.stedsnavn);
    setInputValue(selectedText);
    onChange(selectedText);
    setIsOpen(false);
    clearSuggestions();
  };

  const handleInputBlur = () => {
    // Delay to allow suggestion clicks
    setTimeout(() => {
      onChange(inputValue);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Enter' && suggestions.length === 1) {
      handleSuggestionClick(suggestions[0]);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            icon
          )}
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("pl-10 pr-4", className)}
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
              <Button
              key={index}
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50 border-0 rounded-none first:rounded-t-md last:rounded-b-md"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-2 w-full">
                {suggestion.type === 'place' ? (
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {suggestion.displayText || 
                      (suggestion.type === 'address' ? suggestion.adressetekst : suggestion.stedsnavn)}
                  </div>
                  {suggestion.kommunenavn && suggestion.fylkesnavn && (
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.kommunenavn}, {suggestion.fylkesnavn}
                    </div>
                  )}
                  {suggestion.type === 'place' && (suggestion as any).navnetype && (
                    <div className="text-xs text-muted-foreground capitalize">
                      {(suggestion as any).navnetype}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}

      {isOpen && !loading && suggestions.length === 0 && inputValue.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg p-3"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Search className="h-4 w-4" />
            Ingen adresser eller steder funnet for "{inputValue}"
          </div>
        </div>
      )}
    </div>
  );
};