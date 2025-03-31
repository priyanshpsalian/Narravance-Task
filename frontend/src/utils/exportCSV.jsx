export const exportCSV = (filteredData) => {
  const csvRows = [];
  const headers = Object.keys(filteredData[0] || {});
  csvRows.push(headers.join(","));
  filteredData.forEach((row) => {
    csvRows.push(headers.map((header) => `"${row[header]}"`).join(","));
  });
  const csvData = csvRows.join("\n");
  const blob = new Blob([csvData], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", "filtered_data.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
