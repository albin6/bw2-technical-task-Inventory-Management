import type React from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="w-full md:w-1/2">
      <Input
        placeholder="Search by name or description..."
        prefix={<SearchOutlined className="text-gray-400" />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
        size="large"
        allowClear
      />
    </div>
  );
};
