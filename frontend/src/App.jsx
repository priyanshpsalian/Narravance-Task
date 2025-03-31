import React, { useState, useEffect } from "react";
import axios from "axios";
import * as d3 from "d3";

const App = () => {
  const [startYear, setStartYear] = useState(2014);
  const [endYear, setEndYear] = useState(2022);
  const [models, setModels] = useState("NISSAN,MITSUBISHI");
  const [region, setRegion] = useState("Mumbai");
  const [size, setSize] = useState("SUBCOMPACT");


  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);


  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMake, setSelectedMake] = useState("All");


  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);


  const createTask = async () => {
    setLoading(true);
    const json = {
      startYear,
      endYear,
      models: models.split(",").map((m) => m.trim()),
      region,
      size,
    };
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/create_task",
        json
      );
      setTaskId(response.data.task_id);
      setTaskStatus("pending");
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };


  useEffect(() => {
    if (taskId) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(
            `http://127.0.0.1:5000/tasks/${taskId}`
          );
          setTaskStatus(response.data.status);
          if (response.data.status === "completed") {
            setData(response.data.data);
            setFilteredData(response.data.data);
            setLoading(false);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error polling task:", error);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [taskId]);


  useEffect(() => {
    let newData = data;
    if (selectedYear !== "All") {
      newData = newData.filter((d) => d.year === parseInt(selectedYear));
    }
    if (selectedMake !== "All") {
      newData = newData.filter((d) => d.make === selectedMake);
    }
    setFilteredData(newData);
    drawCharts(newData);
  }, [selectedYear, selectedMake, data]);


  const exportCSV = () => {
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


  const drawCharts = (dataset) => {

    [
      "lineChart",
      "areaChart",
      "barChart",
      "pieChart",
      "scatterChart",
      "bubbleChart",
    ].forEach((id) => d3.select(`#${id}`).selectAll("*").remove());


    const yearCounts = d3.rollups(
      dataset,
      (v) => v.length,
      (d) => d.year
    );
    const makeCounts = d3.rollups(
      dataset,
      (v) => v.length,
      (d) => d.make
    );


    const years = dataset.map((d) => d.year);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    const yearTicks = d3.range(minYear, maxYear + 1);


    const xScale = d3.scaleLinear().domain([minYear, maxYear]).range([50, 350]);
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(yearCounts, (d) => d[1])])
      .range([250, 50]);


    const lineSvg = d3
      .select("#lineChart")
      .append("svg")
      .attr("width", 700)
      .attr("height", 300);
    lineSvg
      .append("g")
      .attr("transform", "translate(0,250)")
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(yearTicks)
          .tickFormat(d3.format("d"))
          .tickPadding(10)
      )
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");
    lineSvg
      .append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(yScale));
    const line = d3
      .line()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);
    lineSvg
      .append("path")
      .datum(yearCounts)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 2)
      .attr("d", line);


    const areaSvg = d3
      .select("#areaChart")
      .append("svg")
      .attr("width", 400)
      .attr("height", 300);
    const area = d3
      .area()
      .x((d) => xScale(d[0]))
      .y0(250)
      .y1((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);
    areaSvg
      .append("path")
      .datum(yearCounts)
      .attr("fill", "lightblue")
      .attr("d", area);


    const barSvg = d3
      .select("#barChart")
      .append("svg")
      .attr("width", 400)
      .attr("height", 300);
    const xBar = d3
      .scaleBand()
      .domain(makeCounts.map((d) => d[0]))
      .range([50, 350])
      .padding(0.2);
    const yBar = d3
      .scaleLinear()
      .domain([0, d3.max(makeCounts, (d) => d[1])])
      .range([250, 50]);
    barSvg
      .append("g")
      .attr("transform", "translate(0,250)")
      .call(d3.axisBottom(xBar));
    barSvg
      .append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(yBar));
    barSvg
      .selectAll("rect")
      .data(makeCounts)
      .enter()
      .append("rect")
      .attr("x", (d) => xBar(d[0]))
      .attr("y", (d) => yBar(d[1]))
      .attr("width", xBar.bandwidth())
      .attr("height", (d) => 250 - yBar(d[1]))
      .attr("fill", "orange")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "darkorange");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("fill", "orange");
      });


    const pieSvg = d3
      .select("#pieChart")
      .append("svg")
      .attr("width", 400)
      .attr("height", 300)
      .append("g")
      .attr("transform", "translate(200,150)");
    const pieData = d3.pie().value((d) => d[1])(makeCounts);
    const arc = d3.arc().innerRadius(0).outerRadius(100);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    pieSvg
      .selectAll("path")
      .data(pieData)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => color(i))
      .append("title")
      .text((d) => `${d.data[0]}: ${d.data[1]}`);


    const scatterSvg = d3
      .select("#scatterChart")
      .append("svg")
      .attr("width", 400)
      .attr("height", 300);
    scatterSvg
      .append("g")
      .attr("transform", "translate(0,250)")
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(yearTicks)
          .tickFormat(d3.format("d"))
          .tickPadding(10)
      );
    scatterSvg
      .append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(yScale));
    scatterSvg
      .selectAll("circle")
      .data(yearCounts)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d[0]))
      .attr("cy", (d) => yScale(d[1]))
      .attr("r", 5)
      .attr("fill", "red")
      .append("title")
      .text((d) => `Year: ${d[0]}, Count: ${d[1]}`);


    const bubbleSvg = d3
      .select("#bubbleChart")
      .append("svg")
      .attr("width", 400)
      .attr("height", 300);
    const bubbleX = d3
      .scaleLinear()
      .domain([minYear, maxYear])
      .range([50, 350]);
    const bubbleY = d3
      .scaleLinear()
      .domain([0, d3.max(yearCounts, (d) => d[1])])
      .range([250, 50]);
    bubbleSvg
      .append("g")
      .attr("transform", "translate(0,250)")
      .call(
        d3
          .axisBottom(bubbleX)
          .tickValues(yearTicks)
          .tickFormat(d3.format("d"))
          .tickPadding(10)
      );
    bubbleSvg
      .append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(bubbleY));
    bubbleSvg
      .selectAll("circle")
      .data(yearCounts)
      .enter()
      .append("circle")
      .attr("cx", (d) => bubbleX(d[0]))
      .attr("cy", (d) => bubbleY(d[1]))
      .attr("r", (d) => d[1] * 2) 
      .attr("fill", "purple")
      .attr("opacity", 0.6)
      .append("title")
      .text((d) => `Year: ${d[0]}, Count: ${d[1]}`);
  };


  const totalRecords = filteredData.length;
  const uniqueMakes = [...new Set(filteredData.map((d) => d.make))].length;
  const uniqueYears = [...new Set(filteredData.map((d) => d.year))].length;

  return (
    <div
      className={`${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}
    >

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <a className="navbar-brand" href="/">
            Car Data Dashboard
          </a>
          <button
            className="btn btn-outline-light"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </nav>

      <div className="container my-4">
        {/* Summary Card */}
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


        <div className="card mb-4 shadow">
          <div className="card-body">
            <h2 className="card-title">Filter Car Data</h2>
            <div className="row g-3">
              <div className="col-md-2">
                <label className="form-label">Start Year</label>
                <input
                  type="number"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">End Year</label>
                <input
                  type="number"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Brand</label>
                <input
                  type="text"
                  value={models}
                  onChange={(e) => setModels(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Size</label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Region</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-md-12">
                <button
                  onClick={createTask}
                  className="btn btn-primary mt-2 me-2"
                >
                  Fetch Data
                </button>
                <button onClick={exportCSV} className="btn btn-success mt-2">
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading && <p className="text-center fs-4">Loading...</p>}


        <div className="mb-4 d-flex justify-content-around">
          <select
            onChange={(e) => setSelectedYear(e.target.value)}
            className="form-select w-auto"
          >
            <option value="All">All Years</option>
            {[...new Set(data.map((d) => d.year))].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => setSelectedMake(e.target.value)}
            className="form-select w-auto ms-3"
          >
            <option value="All">All Makes</option>
            {[...new Set(data.map((d) => d.make))].map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>


        <div className="row mb-4">
          <div className="col-md-6">
            <h5>Line Chart: Records vs. Year</h5>
            <div id="lineChart" className="border p-2"></div>
          </div>
          <div className="col-md-6">
            <h5>Bar Chart: Records vs. Brand</h5>
            <div id="barChart" className="border p-2"></div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-md-6">
            <h5>Area Chart: Trend over Years</h5>
            <div id="areaChart" className="border p-2"></div>
          </div>
          <div className="col-md-6">
            <h5>Pie Chart: Car Make Distribution</h5>
            <div id="pieChart" className="border p-2"></div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-md-6">
            <h5>Scatter Chart: Year vs. Record Count</h5>
            <div id="scatterChart" className="border p-2"></div>
          </div>
          <div className="col-md-6">
            <h5>Bubble Chart: Visual Record Magnitude</h5>
            <div id="bubbleChart" className="border p-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
