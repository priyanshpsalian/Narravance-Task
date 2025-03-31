import React from "react";

const Filters = ({
  startYear,
  endYear,
  models,
  region,
  size,
  setStartYear,
  setEndYear,
  setModels,
  setRegion,
  setSize,
  createTask,
}) => {
  return (
    <div className="card mb-4 shadow">
      <div className="card-body">
        <h2 className="card-title">Filter Car Data</h2>
        <div className="row g-3">
          <button onClick={createTask} className="btn btn-primary mt-2 me-2">
            Fetch Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
