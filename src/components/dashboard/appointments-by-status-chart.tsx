"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";

interface StatusData {
  status: string;
  count: number;
}

interface AppointmentsByStatusChartProps {
  data: StatusData[];
}

export function AppointmentsByStatusChart({ data }: AppointmentsByStatusChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = 300;
    const height = 300;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Set up colors
    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.status))
      .range([
        "#6366f1", // primary (scheduled)
        "#10b981", // green (completed)
        "#ef4444", // red (cancelled)
        "#6b7280", // gray (other)
      ]);

    // Create pie chart
    const pie = d3.pie<StatusData>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<StatusData>>()
      .innerRadius(radius * 0.5) // Donut chart
      .outerRadius(radius);

    // Add tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Draw arcs
    const arcs = svg.selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.status))
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0.8)
      .on("mouseover", function(event, d) {
        d3.select(this).style("opacity", 1);
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(`${d.data.status}: ${d.data.count} (${Math.round(d.data.count / d3.sum(data, d => d.count) * 100)}%)`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", 0.8);
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add labels
    const labelArc = d3.arc<d3.PieArcDatum<StatusData>>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);

    arcs.append("text")
      .attr("transform", d => `translate(${labelArc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .text(d => d.data.count > 0 ? d.data.status : "");

    // Add legend
    const legend = svg.selectAll(".legend")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(-${width/2 - 20}, ${height/2 - 120 + i * 20})`);

    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d => color(d.status));

    legend.append("text")
      .attr("x", 20)
      .attr("y", 10)
      .attr("font-size", "12px")
      .text(d => `${d.status} (${d.count})`);

    // Clean up tooltip on unmount
    return () => {
      d3.select("body").selectAll(".d3-tooltip").remove();
    };
  }, [data]);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-indigo-600" />
          Appointment Status
        </CardTitle>
        <CardDescription>
          See the breakdown of completed, scheduled, and canceled bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <svg ref={svgRef}></svg>
      </CardContent>
    </Card>
  );
}
