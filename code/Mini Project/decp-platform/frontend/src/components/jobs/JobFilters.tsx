import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Search, LocationOn } from '@mui/icons-material';
import { JOB_TYPES } from '@utils';

interface JobFiltersProps {
  filters: {
    search: string;
    type: string;
    location: string;
  };
  onFilterChange: (filters: { search: string; type: string; location: string }) => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <Box className="flex flex-col sm:flex-row gap-3 mb-6">
      <TextField
        fullWidth
        placeholder="Search jobs..."
        value={filters.search}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search className="text-gray-400" />
            </InputAdornment>
          ),
        }}
        className="flex-1"
      />
      
      <TextField
        select
        value={filters.type}
        onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
        className="sm:w-40"
        SelectProps={{ displayEmpty: true }}
      >
        <MenuItem value="">All Types</MenuItem>
        {JOB_TYPES.map((type) => (
          <MenuItem key={type.value} value={type.value}>
            {type.label}
          </MenuItem>
        ))}
      </TextField>
      
      <TextField
        placeholder="Location"
        value={filters.location}
        onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationOn className="text-gray-400" />
            </InputAdornment>
          ),
        }}
        className="sm:w-48"
      />
    </Box>
  );
};

export default JobFilters;
