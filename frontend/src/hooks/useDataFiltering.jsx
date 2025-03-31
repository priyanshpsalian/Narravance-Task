import { useState, useEffect } from "react";

export const useDataFiltering = (data) => {
  const [filteredData, setFilteredData] = useState(data);
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMake, setSelectedMake] = useState("All");

  useEffect(() => {
    let newData = data;
    if (selectedYear !== "All") {
      newData = newData.filter((d) => d.year === parseInt(selectedYear));
    }
    if (selectedMake !== "All") {
      newData = newData.filter((d) => d.make === selectedMake);
    }
    setFilteredData(newData);
  }, [selectedYear, selectedMake, data]);

  return {
    filteredData,
    setFilteredData,
    selectedYear,
    setSelectedYear,
    selectedMake,
    setSelectedMake,
  };
};
