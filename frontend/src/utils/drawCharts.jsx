import * as d3 from "d3";

export const drawCharts = (dataset) => {
  // Remove previous drawings from chart containers
  [
    "lineChart",
    "areaChart",
    "barChart",
    "pieChart",
    "scatterChart",
    "bubbleChart",
  ].forEach((id) => d3.select(`#${id}`).selectAll("*").remove());

  // --- Common Aggregations ---
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

  // --- Compute tick values based on dataset years ---
  const years = dataset.map((d) => d.year);
  const minYear = d3.min(years);
  const maxYear = d3.max(years);
  // Generate tick values for each integer year
  const yearTicks = d3.range(minYear, maxYear + 1);

  // --- Common scales for year-based charts ---
  const xScale = d3.scaleLinear().domain([minYear, maxYear]).range([50, 350]);
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(yearCounts, (d) => d[1])])
    .range([250, 50]);

  // --- Line Chart: Records vs. Year ---
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

  // --- Area Chart: Trend over Years ---
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

  // --- Bar Chart: Records vs. Brand ---
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

  // --- Pie Chart: Car Make Distribution ---
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

  // --- Scatter Chart: Year vs. Record Count ---
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

  // --- Bubble Chart: Visualizing Records (Bubble size based on count) ---
  const bubbleSvg = d3
    .select("#bubbleChart")
    .append("svg")
    .attr("width", 400)
    .attr("height", 300);
  const bubbleX = d3.scaleLinear().domain([minYear, maxYear]).range([50, 350]);
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
    .attr("r", (d) => d[1] * 2) // Bubble size scaled to count
    .attr("fill", "purple")
    .attr("opacity", 0.6)
    .append("title")
    .text((d) => `Year: ${d[0]}, Count: ${d[1]}`);
};