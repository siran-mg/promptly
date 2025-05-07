"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateFormatter } from "@/hooks/use-date-formatter";

interface MonthData {
  month: string;
  count: number;
}

interface AppointmentsByMonthChartProps {
  data: MonthData[];
}

export function AppointmentsByMonthChart({ data }: AppointmentsByMonthChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const t = useTranslations();
  const { formatMonthYear } = useDateFormatter();

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    // Get container width for responsive sizing
    const containerWidth = svgRef.current.parentElement?.clientWidth || 600;
    const width = Math.min(600, containerWidth - margin.left - margin.right);
    const height = 300 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .nice()
      .range([height, 0]);

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

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5));

    // Add bars
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.month) || 0)
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.count))
      .attr("fill", "#6366f1")
      .style("opacity", 0.8)
      .on("mouseover", function(event, d) {
        d3.select(this).style("opacity", 1);
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(`${d.month}: ${d.count} ${t('dashboard.charts.appointments')}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", 0.8);
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add grid lines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width)
        .tickFormat(() => "")
      )
      .style("stroke-dasharray", "3,3")
      .style("stroke-opacity", 0.2);

    // Clean up tooltip on unmount
    return () => {
      d3.select("body").selectAll(".d3-tooltip").remove();
    };
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 md:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          {t('dashboard.charts.monthlyTrends')}
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {t('dashboard.charts.monthlyDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 md:pt-2">
        <div className="w-full overflow-x-auto pb-2">
          <svg ref={svgRef}></svg>
        </div>
      </CardContent>
    </Card>
  );
}
