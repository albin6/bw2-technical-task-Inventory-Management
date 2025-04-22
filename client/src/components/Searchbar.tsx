import type React from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useEffect, useCallback } from "react";
import _ from "lodash";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch?: () => void;
  debounceTime?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  debounceTime = 300,
}) => {
  const [inputValue, setInputValue] = useState(searchTerm);

  // Create a debounced function using lodash
  const debouncedSearch = useCallback(
    _.debounce((value: string) => {
      setSearchTerm(value);
      if (onSearch) {
        onSearch();
      }
    }, debounceTime),
    [debounceTime, setSearchTerm, onSearch]
  );

  // Update local input value when searchTerm prop changes
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  // Clean up the debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="w-full md:w-1/2">
      <Input
        placeholder="Search by name or description..."
        prefix={<SearchOutlined className="text-gray-400" />}
        value={inputValue}
        onChange={handleChange}
        className="w-full"
        size="large"
        allowClear
      />
    </div>
  );
};
