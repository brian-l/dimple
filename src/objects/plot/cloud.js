    // Source: /src/objects/plot/cloud.js
    dimple.plot.cloud = {
        // By default the bar series is stacked if there are series categories
        stacked: false,
        // This is not a grouped plot meaning that one point is treated as one series value
        grouped: false,
        supportedAxes: ["z", "p"],

        // Draw the chart
        draw: function (chart, series, duration) {
            try {
                d3.layout.cloud();
            } catch (err) {
                console.error('d3.layout.cloud not found. dimple.plot.cloud has a hard dependency on d3-cloud.');
            }

            // Clear tool tips
            if (chart._tooltipGroup !== null && chart._tooltipGroup !== undefined) {
                chart._tooltipGroup.remove();
            }

            var chartData = series._positionData,
                cloud = d3.layout.cloud(),
                theseShapes = null,
                classes = ["dimple-series-" + chart.series.indexOf(series), "dimple-cloud"],
                updated,
                removed,
                sizeRange = [20, 72],
                sizeDomain = chartData.reduce(function(acc, cur) {
                    return [Math.min(acc[0], cur.zValue), Math.max(acc[1], cur.zValue)];
                }, [0, 0]),
                sizeScale = d3.scale.pow().clamp([true]).domain(sizeDomain).range(sizeRange),
                buildCloud = function(words) {
                    var transforms = words.reduce(function(acc, cur) {
                        acc[cur.key] = cur;
                        return acc;
                    }, {}),
                        applyCloud = function() {
                            this.attr('display', function(d) {
                                if (!transforms[d.key]) {
                                    return 'none';
                                }
                            });
                            this.attr('transform', function(d) {
                                if (transforms[d.key]) {
                                    var x = ((chart._xPixels() + chart._widthPixels()) / 2) + transforms[d.key].x,
                                        y = ((chart._yPixels() + chart._heightPixels()) / 2) + transforms[d.key].y;
                                    return 'translate(' + [x, y] + ')';
                                }
                            });
                        };

                    // Add
                    theseShapes.enter()
                        .append("text")
                        .attr("id", function (d) { return dimple._createClass([d.key]); })
                        .attr("class", function (d) {
                            var c = [];
                            c = c.concat(d.aggField);
                            c = c.concat(d.zField);
                            return classes.join(" ") + " " + dimple._createClass(c) + " " + dimple._helpers.css(d, chart);
                        })
                        .attr('text-anchor', 'middle')
                        .style('font-size', function(d) {
                            return sizeScale(d.zValue);
                        })
                        .text(function(d) {
                            return d.p;
                        })
                        .on("mouseover", function (e) {
                            var mouse = d3.mouse(this);
                            dimple._showBarTooltip(e, this, chart, series, {x: mouse[0], y: mouse[1]});
                        })
                        .on("mouseleave", function (e) { dimple._removeTooltip(e, this, chart, series); })
                        .call(function () {
                            if (!chart.noFormats) {
                                this.attr("opacity", function (d) { return dimple._helpers.opacity(d, chart, series); })
                                    .style("fill", function (d) { return dimple._helpers.fill(d, chart, series); })
                                    .style("stroke", function (d) { return dimple._helpers.stroke(d, chart, series); });
                            }
                        })
                        .call(applyCloud);

                    // Update
                    updated = chart._handleTransition(theseShapes, duration, chart, series)
                        .call(applyCloud);

                    // Remove
                    removed = chart._handleTransition(theseShapes.exit(), duration, chart, series);

                    dimple._postDrawHandling(series, updated, removed, duration);

                    // Save the shapes to the series array
                    series.shapes = theseShapes;
                };

            if (series.shapes === null || series.shapes === undefined) {
                theseShapes = series._group.selectAll("." + classes.join(".")).data(chartData);
            } else {
                theseShapes = series.shapes.data(chartData, function (d) { return d.key; });
            }

            cloud.size([chart._widthPixels(), chart._heightPixels()])
                .words(chartData.map(function(d) {
                    return {
                        text: d.p,
                        size: sizeScale(d.zValue),
                        value: d.zValue,
                        key: d.key
                    };
                }))
                .rotate(0)
                .padding(5)
                .font(series.fontFamily || 'sans-serif')
                .fontSize(function(d) {
                    return sizeScale(d.value);
                })
                .on('end', buildCloud)
                .start();
        }
    };
