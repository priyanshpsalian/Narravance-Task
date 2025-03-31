import React from "react";

const SummaryCard = ({ filteredData }) => {
  const totalRecords = filteredData.length;
  const uniqueMakes = [...new Set(filteredData.map((d) => d.make))].length;
  const uniqueYears = [...new Set(filteredData.map((d) => d.year))].length;

  return (
    <div className="row mb-4">
      <div className="col-md-4">
        <div className="card text-center shadow">
          <div className="card-body">
            <h5 className="card-title">Total Records</h5>
            <p className="card-text fs-3">{totalRecords}</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card text-center shadow">
          <div className="card-body">
            <h5 className="card-title">Unique Makes</h5>
            <p className="card-text fs-3">{uniqueMakes}</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card text-center shadow">
          <div className="card-body">
            <h5 className="card-title">Unique Years</h5>
            <p className="card-text fs-3">{uniqueYears}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
