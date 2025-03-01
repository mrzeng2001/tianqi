import * as echarts from "../../components/ec-canvas/echarts";

Page({
  data: {
    ec: {
        lazyLoad: true // 防止界面卡顿
    },
    holdings: [] // 存储持仓数据
  },

  onLoad() {
    this.fetchHoldings();
  },

  fetchHoldings() {
    wx.request({
      url: "http://30128g05c0.oicp.vip/api/holdings/all", // **持仓 API**
      method: "GET",
      success: (res) => {
        if (res.data) {
          this.setData({ holdings: res.data }, () => {
            this.initChart(); // **数据加载后绘制饼状图**
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
    this.selectComponent("#holdingsChart").init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });

      const data = this.data.holdings.map(item => ({
        name: item.fund_name,
        value: item.amount
      }));

      const option = {
        title: { 
          text: "持仓比例",
          left: "center",
          top: "top",
          textStyle: {
            fontSize: 20,
            fontWeight: "bold"
          },
          show:false
        },
        tooltip: {
            show: true,
            confine: true, // **确保 tooltip 不会超出边界**
            position: function (point, params, dom, rect, size) {
                // **自动调整 tooltip 位置**
                let x = point[0];
                let y = point[1];

                // **防止 tooltip 过界**
                let boxWidth = size.contentSize[0];
                let boxHeight = size.contentSize[1];

                if (x + boxWidth > size.viewSize[0]) {
                    x -= boxWidth; // **如果超出右侧，则向左调整**
                }
                if (y + boxHeight > size.viewSize[1]) {
                    y -= boxHeight; // **如果超出底部，则向上调整**
                }

                return [x, y];
            }
        },
        legend: {
          orient: "vertical",
          left: "left",
          data: this.data.holdings.map(item => item.fund_name),
        },
        series: [{
          name: "持仓金额",
          type: "pie",
          radius: "60%",
          center: ["50%","65%"],
          data: data,
          label: {
            show: false // **隐藏饼图上的文字**
        },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          }
        }]
      };

      chart.setOption(option);
      return chart;
    });
  }
});
