import * as echarts from "../../components/ec-canvas/echarts";

Page({
  data: {
    ec: {
        lazyLoad: true // 延迟加载，防止界面卡顿
    },
    dataList: [] // 存储基金数据
  },

  onLoad() {
    this.fetchData();
  },

  fetchData() {
    wx.request({
      url: "http://30128g05c0.oicp.vip/api/fund/all",
      method: "GET",
      success: (res) => {
        if (res.data) {
          const sortedList = [...res.data].reverse(); // **倒序显示列表**
          const chartData = [...res.data].sort((a, b) => new Date(a.date) - new Date(b.date)); // **按时间排序（确保ECharts正确绘制）**
  
          this.setData({ 
            dataList: sortedList, // **数据列表倒序**
            chartData: chartData  // **ECharts数据保持时间正序**
          }, () => {
            this.initChart(); // **数据更新后再初始化图表**
          });
  
        } else {
          wx.showToast({
            title: "数据加载失败",
            icon: "none"
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: "网络请求失败",
          icon: "none"
        });
        console.error("请求失败", err);
      }
    });
  },  

  initChart() {
    this.selectComponent("#fundChart").init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });

        const fundDates = this.data.chartData.map(item => item.date);
        const fundValues = this.data.chartData.map(item => item.net_value);

        const minValue = Math.floor(Math.min(...fundValues) - 2);
        const maxValue = Math.ceil(Math.max(...fundValues) + 2);

        // **计算最新一天的涨跌幅**
        const latest = fundValues[fundValues.length - 1]; // 最新净值
        const latestDate = fundDates[fundDates.length - 1]; // 最新日期
        const previous = fundValues.length > 1 ? fundValues[fundValues.length - 2] : latest;
        const change = latest - previous;
        const percentageChange = ((change / previous) * 100).toFixed(2);
        const changeText = change >= 0 ? `📈 +${percentageChange}%` : `📉 ${percentageChange}%`;
        const changeColor = change >= 0 ? "#FF4500" : "#007500";

        const option = {
            title: { 
                text: `{title|天启指数} {date|(${latestDate})}\n{value|${latest.toFixed(2)}}  {change|${changeText}}`, 
                left: "center",
                top: "top",
                textStyle: {
                    fontSize: 20,
                    fontWeight: "bold",
                    rich: {
                        title: { color: "#333", fontSize: 22, fontWeight: "bold" }, // **"天启指数" 黑色**
                        date: { color: "#333", fontSize: 20 }, // **日期黑色，带括号**
                        value: { color: changeColor, fontSize: 20, fontWeight: "bold" }, // **净值，颜色与涨跌幅相同**
                        change: { color: changeColor, fontSize: 20, fontWeight: "bold" } // **涨跌幅，颜色与净值相同**
                    }
                }
            },
            tooltip: {
                trigger: "axis",
                confine: true, // **限制 tooltip 在图表区域内**
                position: function (point, params, dom, rect, size) {
                    let x = point[0];
                    let y = point[1];
            
                    // **获取 tooltip 尺寸**
                    let boxWidth = size.contentSize[0];
                    let boxHeight = size.contentSize[1];
            
                    // **调整 tooltip 位置，防止超出**
                    if (x + boxWidth > size.viewSize[0]) {
                        x -= boxWidth; // **如果超出右侧，则向左调整**
                    }
                    if (y + boxHeight > size.viewSize[1]) {
                        y -= boxHeight; // **如果超出底部，则向上调整**
                    }
            
                    return [x, y];
                }
            },
            xAxis: {
                type: "category",
                data: fundDates,
                axisLabel: { rotate: 45, interval: "auto" },
                axisTick: { alignWithLabel: true },
                axisLine: { lineStyle: { color: "#333" } }
            },
            yAxis: {
                type: "value",
                min: minValue,
                max: maxValue,
                splitNumber: 5,
                axisLabel: {
                    formatter: value => value.toFixed(0)
                },
                splitLine: { show: true, lineStyle: { type: "dashed" } }
            },
            series: [{
                name: "基金净值",
                type: "line",
                data: fundValues,
                smooth: true,
                itemStyle: { color: "#FF4500" },
                areaStyle: { color: "rgba(255, 69, 0, 0.3)" }
            }],
            grid: { 
                left: "10%",   
                right: "5%",  
                top: "12%",  // **顶部间距增加一点，避免标题被遮挡**
                bottom: "20%"
            }
        };        
        chart.setOption(option);
        return chart;
    });
  }
});
