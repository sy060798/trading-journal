/* =========================================================
   TRADING JOURNAL
   laporan.js
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let reportTransactions = [];
let reportCapital = {};

let profitChart = null;
let stockChart = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeReportPage();

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeReportPage() {

  setupReportEvents();

  setReportDate();

  await loadReportData();

}


/* =========================================================
   EVENTS
========================================================= */

function setupReportEvents() {

  const refreshButton =
    document.getElementById(
      "refreshReportButton"
    );


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      loadReportData
    );

  }


  const filter =
    document.getElementById(
      "reportPeriod"
    );


  if (filter) {

    filter.addEventListener(
      "change",
      renderReport
    );

  }


  const stockFilter =
    document.getElementById(
      "reportStock"
    );


  if (stockFilter) {

    stockFilter.addEventListener(
      "change",
      renderReport
    );

  }

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadReportData() {

  showReportLoading(
    true
  );


  try {

    /*
     * Ambil transaksi dan modal
     * secara bersamaan.
     */

    const [
      transactionResult,
      capitalResult
    ] = await Promise.all([
      getTransactions(),
      getCapital()
    ]);


    reportTransactions =
      Array.isArray(
        transactionResult
      )
        ? transactionResult
        : [];


    reportCapital =
      capitalResult || {};


    prepareStockFilter();

    renderReport();


  } catch (error) {

    console.error(
      "Report error:",
      error
    );


    showReportToast(
      "Gagal memuat laporan",
      getApiErrorMessage(error),
      "error"
    );


  } finally {

    showReportLoading(
      false
    );

  }

}


/* =========================================================
   RENDER REPORT
========================================================= */

function renderReport() {

  const filtered =
    getFilteredTransactions();


  const statistics =
    calculateStatistics(
      filtered
    );


  updateSummaryCards(
    statistics
  );


  updateCapitalSummary();

  renderProfitChart(
    filtered
  );

  renderStockChart(
    filtered
  );

  renderReportTable(
    filtered
  );

  updateReportDate();

}


/* =========================================================
   FILTER TRANSACTIONS
========================================================= */

function getFilteredTransactions() {

  let data =
    [...reportTransactions];


  const periodElement =
    document.getElementById(
      "reportPeriod"
    );


  const stockElement =
    document.getElementById(
      "reportStock"
    );


  const period =
    periodElement?.value ||
    "all";


  const stock =
    stockElement?.value ||
    "all";


  /*
   * Filter saham
   */

  if (
    stock !== "all"
  ) {

    data =
      data.filter(
        transaction =>
          String(
            transaction.saham || ""
          )
            .toUpperCase() ===
          String(stock)
            .toUpperCase()
      );

  }


  /*
   * Filter waktu
   */

  if (
    period !== "all"
  ) {

    const now =
      new Date();


    let startDate =
      new Date();


    if (
      period === "today"
    ) {

      startDate =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

    }


    if (
      period === "7"
    ) {

      startDate.setDate(
        now.getDate() - 6
      );

    }


    if (
      period === "30"
    ) {

      startDate.setDate(
        now.getDate() - 29
      );

    }


    if (
      period === "90"
    ) {

      startDate.setDate(
        now.getDate() - 89
      );

    }


    if (
      period === "year"
    ) {

      startDate =
        new Date(
          now.getFullYear(),
          0,
          1
        );

    }


    data =
      data.filter(
        transaction => {

          const date =
            parseTransactionDate(
              transaction.tanggal
            );


          return (
            date &&
            date >= startDate &&
            date <= now
          );

        }
      );

  }


  return data;

}


/* =========================================================
   CALCULATE STATISTICS
========================================================= */

function calculateStatistics(
  transactions
) {

  let profit =
    0;

  let loss =
    0;

  let profitCount =
    0;

  let lossCount =
    0;

  let totalNominal =
    0;


  transactions.forEach(
    transaction => {

      const amount =
        Number(
          transaction.nominal
        ) || 0;


      const result =
        normalizeReportResult(
          transaction.hasil
        );


      /*
       * Utamakan nominal.
       */

      totalNominal +=
        amount;


      if (
        result === "PROFIT" ||
        amount > 0
      ) {

        profit +=
          amount > 0
            ? amount
            : 0;

        profitCount++;

      }


      if (
        result === "RUGI" ||
        amount < 0
      ) {

        loss +=
          amount < 0
            ? Math.abs(amount)
            : 0;

        lossCount++;

      }

    }
  );


  /*
   * Jika hasil PROFIT/RUGI
   * ada tetapi nominal 0,
   * tetap dihitung jumlahnya.
   */

  const completedTrades =
    profitCount +
    lossCount;


  const winRate =
    completedTrades > 0
      ? (
          profitCount /
          completedTrades
        ) * 100
      : 0;


  const netProfit =
    profit -
    loss;


  return {

    totalTransactions:
      transactions.length,

    profit:
      profit,

    loss:
      loss,

    netProfit:
      netProfit,

    profitCount:
      profitCount,

    lossCount:
      lossCount,

    completedTrades:
      completedTrades,

    winRate:
      winRate

  };

}


/* =========================================================
   SUMMARY CARDS
========================================================= */

function updateSummaryCards(
  statistics
) {

  setReportText(
    "totalTransactions",
    formatReportNumber(
      statistics.totalTransactions
    )
  );


  setReportText(
    "totalProfit",
    formatReportSignedRupiah(
      statistics.profit
    )
  );


  setReportText(
    "totalLoss",
    formatReportSignedRupiah(
      -statistics.loss
    )
  );


  setReportText(
    "netProfit",
    formatReportSignedRupiah(
      statistics.netProfit
    )
  );


  setReportText(
    "winRate",
    `${statistics.winRate.toFixed(1)}%`
  );


  setReportText(
    "profitCount",
    formatReportNumber(
      statistics.profitCount
    )
  );


  setReportText(
    "lossCount",
    formatReportNumber(
      statistics.lossCount
    )
  );


  /*
   * Tambahan ID alternatif
   */

  setReportText(
    "totalTrades",
    formatReportNumber(
      statistics.totalTransactions
    )
  );


  setReportText(
    "profitValue",
    formatReportSignedRupiah(
      statistics.profit
    )
  );


  setReportText(
    "lossValue",
    formatReportSignedRupiah(
      -statistics.loss
    )
  );


  setReportText(
    "netValue",
    formatReportSignedRupiah(
      statistics.netProfit
    )
  );

}


/* =========================================================
   CAPITAL SUMMARY
========================================================= */

function updateCapitalSummary() {

  const initial =
    getReportCapitalValue(
      [
        "modalAwal",
        "modal_awal",
        "initialCapital",
        "initial",
        "modal"
      ]
    );


  const added =
    getReportCapitalValue(
      [
        "tambahModal",
        "tambah_modal",
        "addedCapital",
        "added"
      ]
    );


  const withdrawn =
    getReportCapitalValue(
      [
        "tarikModal",
        "tarik_modal",
        "withdrawnCapital",
        "withdrawn"
      ]
    );


  const current =
    getReportCapitalValue(
      [
        "modalSekarang",
        "modal_sekarang",
        "currentCapital",
        "current",
        "saldo"
      ]
    );


  const calculatedCurrent =
    current !== null
      ? current
      : initial +
        added -
        withdrawn;


  setReportText(
    "reportInitialCapital",
    formatReportRupiah(
      initial
    )
  );


  setReportText(
    "reportAddedCapital",
    formatReportRupiah(
      added
    )
  );


  setReportText(
    "reportWithdrawnCapital",
    formatReportRupiah(
      withdrawn
    )
  );


  setReportText(
    "reportCurrentCapital",
    formatReportRupiah(
      calculatedCurrent
    )
  );


  /*
   * ID alternatif
   */

  setReportText(
    "initialCapital",
    formatReportRupiah(
      initial
    )
  );


  setReportText(
    "currentCapital",
    formatReportRupiah(
      calculatedCurrent
    )
  );

}


/* =========================================================
   PROFIT CHART
========================================================= */

function renderProfitChart(
  transactions
) {

  const canvas =
    document.getElementById(
      "profitChart"
    );


  if (!canvas) {
    return;
  }


  if (
    typeof Chart ===
    "undefined"
  ) {

    console.error(
      "Chart.js belum dimuat."
    );

    return;

  }


  const dailyData =
    groupProfitByDate(
      transactions
    );


  const labels =
    Object.keys(
      dailyData
    ).sort();


  const values =
    labels.map(
      date =>
        dailyData[date]
    );


  if (profitChart) {

    profitChart.destroy();

  }


  const context =
    canvas.getContext(
      "2d"
    );


  profitChart =
    new Chart(
      context,
      {
        type: "line",

        data: {

          labels:
            labels.map(
              formatChartDate
            ),

          datasets: [

            {

              label:
                "Profit / Rugi",

              data:
                values,

              borderColor:
                "#4ade80",

              backgroundColor:
                "rgba(74, 222, 128, 0.10)",

              borderWidth:
                2,

              fill:
                true,

              tension:
                0.35,

              pointRadius:
                3,

              pointHoverRadius:
                5,

              pointBackgroundColor:
                "#4ade80"

            }

          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          interaction: {

            intersect:
              false,

            mode:
              "index"

          },

          plugins: {

            legend: {

              display:
                false

            },

            tooltip: {

              callbacks: {

                label:
                  context =>

                    formatReportRupiah(
                      context.raw
                    )

              }

            }

          },

          scales: {

            x: {

              grid: {

                display:
                  false

              }

            },

            y: {

              beginAtZero:
                true,

              ticks: {

                callback:
                  value =>
                    formatCompactRupiah(
                      value
                    )

              }

            }

          }

        }

      }
    );

}


/* =========================================================
   GROUP PROFIT BY DATE
========================================================= */

function groupProfitByDate(
  transactions
) {

  const result =
    {};


  transactions.forEach(
    transaction => {

      const date =
        parseTransactionDate(
          transaction.tanggal
        );


      if (!date) {
        return;
      }


      const key =
        date.toISOString()
          .slice(
            0,
            10
          );


      const amount =
        Number(
          transaction.nominal
        ) || 0;


      if (
        result[key] ===
        undefined
      ) {

        result[key] =
          0;

      }


      result[key] +=
        amount;

    }
  );


  return result;

}


/* =========================================================
   STOCK CHART
========================================================= */

function renderStockChart(
  transactions
) {

  const canvas =
    document.getElementById(
      "stockChart"
    );


  if (!canvas) {
    return;
  }


  if (
    typeof Chart ===
    "undefined"
  ) {

    return;

  }


  const stockData =
    {};


  transactions.forEach(
    transaction => {

      const stock =
        String(
          transaction.saham ||
          "UNKNOWN"
        )
          .toUpperCase();


      const amount =
        Number(
          transaction.nominal
        ) || 0;


      if (
        !stockData[stock]
      ) {

        stockData[stock] =
          0;

      }


      stockData[stock] +=
        amount;

    }
  );


  const sorted =
    Object.entries(
      stockData
    )
      .sort(
        (
          [, a],
          [, b]
        ) =>
          Math.abs(b) -
          Math.abs(a)
      )
      .slice(
        0,
        8
      );


  const labels =
    sorted.map(
      item =>
        item[0]
    );


  const values =
    sorted.map(
      item =>
        item[1]
    );


  if (stockChart) {

    stockChart.destroy();

  }


  const context =
    canvas.getContext(
      "2d"
    );


  stockChart =
    new Chart(
      context,
      {
        type: "bar",

        data: {

          labels:
            labels,

          datasets: [

            {

              label:
                "Profit / Rugi",

              data:
                values,

              backgroundColor:
                values.map(
                  value =>
                    value >= 0
                      ? "rgba(74,222,128,.75)"
                      : "rgba(248,113,113,.75)"
                ),

              borderRadius:
                6

            }

          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {

            legend: {

              display:
                false

            },

            tooltip: {

              callbacks: {

                label:
                  context =>

                    formatReportRupiah(
                      context.raw
                    )

              }

            }

          },

          scales: {

            x: {

              grid: {

                display:
                  false

              }

            },

            y: {

              beginAtZero:
                true,

              ticks: {

                callback:
                  value =>
                    formatCompactRupiah(
                      value
                    )

              }

            }

          }

        }

      }
    );

}


/* =========================================================
   REPORT TABLE
========================================================= */

function renderReportTable(
  transactions
) {

  const tbody =
    document.getElementById(
      "reportTableBody"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML =
    "";


  const sorted =
    [...transactions]
      .sort(
        (
          a,
          b
        ) => {

          const dateA =
            parseTransactionDate(
              a.tanggal
            );


          const dateB =
            parseTransactionDate(
              b.tanggal
            );


          return (
            (dateB?.getTime() || 0) -
            (dateA?.getTime() || 0)
          );

        }
      );


  if (
    sorted.length ===
    0
  ) {

    const row =
      document.createElement(
        "tr"
      );


    row.innerHTML = `

      <td
        colspan="8"
        style="text-align:center"
      >
        Belum ada data transaksi.
      </td>

    `;


    tbody.appendChild(
      row
    );


    return;

  }


  sorted.forEach(
    transaction => {

      const row =
        document.createElement(
          "tr"
        );


      const amount =
        Number(
          transaction.nominal
        ) || 0;


      const result =
        normalizeReportResult(
          transaction.hasil
        );


      row.innerHTML = `

        <td>
          ${escapeReportHtml(
            formatReportDate(
              transaction.tanggal
            )
          )}
        </td>

        <td>
          <strong>
            ${escapeReportHtml(
              transaction.saham ||
              "-"
            )}
          </strong>
        </td>

        <td>
          <span class="badge ${getReportActionClass(
            transaction.aksi
          )}">
            ${escapeReportHtml(
              transaction.aksi ||
              "-"
            )}
          </span>
        </td>

        <td>
          ${formatReportRupiah(
            transaction.harga
          )}
        </td>

        <td>
          ${formatReportNumber(
            transaction.lot
          )}
        </td>

        <td>
          ${
            result
              ? `
                <span class="badge ${getReportResultClass(result)}">
                  ${escapeReportHtml(result)}
                </span>
              `
              : "-"
          }
        </td>

        <td class="${getReportAmountClass(amount)}">
          ${
            amount
              ? formatReportSignedRupiah(
                  amount
                )
              : "-"
          }
        </td>

        <td>
          ${escapeReportHtml(
            transaction.catatan ||
            "-"
          )}
        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   STOCK FILTER
========================================================= */

function prepareStockFilter() {

  const select =
    document.getElementById(
      "reportStock"
    );


  if (!select) {
    return;
  }


  const currentValue =
    select.value;


  const stocks =
    [
      ...new Set(
        reportTransactions
          .map(
            transaction =>
              String(
                transaction.saham ||
                ""
              )
                .trim()
                .toUpperCase()
          )
          .filter(
            Boolean
          )
      )
    ]
      .sort();


  select.innerHTML = `

    <option value="all">
      Semua Saham
    </option>

  `;


  stocks.forEach(
    stock => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        stock;


      option.textContent =
        stock;


      select.appendChild(
        option
      );

    }
  );


  if (
    stocks.includes(
      currentValue
    )
  ) {

    select.value =
      currentValue;

  }

}


/* =========================================================
   DATE HEADER
========================================================= */

function setReportDate() {

  const element =
    document.getElementById(
      "reportToday"
    );


  if (!element) {
    return;
  }


  element.textContent =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        day:
          "2-digit",

        month:
          "long",

        year:
          "numeric"
      }
    ).format(
      new Date()
    );

}


/* =========================================================
   UPDATE REPORT DATE
========================================================= */

function updateReportDate() {

  const element =
    document.getElementById(
      "reportUpdated"
    );


  if (!element) {
    return;
  }


  const now =
    new Date();


  element.textContent =
    "Update " +
    new Intl.DateTimeFormat(
      "id-ID",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit"
      }
    ).format(
      now
    );

}


/* =========================================================
   PARSE DATE
========================================================= */

function parseTransactionDate(
  value
) {

  if (!value) {
    return null;
  }


  /*
   * Date object
   */

  if (
    value instanceof Date
  ) {

    return value;

  }


  const stringValue =
    String(value)
      .trim();


  /*
   * DD/MM/YYYY
   */

  let match =
    stringValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (match) {

    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1])
    );

  }


  /*
   * YYYY-MM-DD
   */

  match =
    stringValue.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );


  if (match) {

    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

  }


  const date =
    new Date(
      stringValue
    );


  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatReportDate(
  value
) {

  const date =
    parseTransactionDate(
      value
    );


  if (!date) {
    return String(
      value || "-"
    );
  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric"
    }
  ).format(
    date
  );

}


/* =========================================================
   FORMAT CHART DATE
========================================================= */

function formatChartDate(
  value
) {

  const date =
    parseTransactionDate(
      value
    );


  if (!date) {
    return value;
  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short"
    }
  ).format(
    date
  );

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatReportRupiah(
  value
) {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",

      currency:
        "IDR",

      maximumFractionDigits:
        0
    }
  ).format(
    Number(value) || 0
  );

}


/* =========================================================
   FORMAT SIGNED RUPIAH
========================================================= */

function formatReportSignedRupiah(
  value
) {

  const number =
    Number(value) || 0;


  if (
    number > 0
  ) {

    return "+" +
      formatReportRupiah(
        number
      );

  }


  if (
    number < 0
  ) {

    return "-" +
      formatReportRupiah(
        Math.abs(number)
      );

  }


  return formatReportRupiah(
    0
  );

}


/* =========================================================
   COMPACT RUPIAH
========================================================= */

function formatCompactRupiah(
  value
) {

  const number =
    Number(value) || 0;


  const absolute =
    Math.abs(number);


  if (
    absolute >= 1000000000
  ) {

    return (
      "Rp " +
      (number / 1000000000)
        .toFixed(1) +
      "M"
    );

  }


  if (
    absolute >= 1000000
  ) {

    return (
      "Rp " +
      (number / 1000000)
        .toFixed(1) +
      "jt"
    );

  }


  if (
    absolute >= 1000
  ) {

    return (
      "Rp " +
      (number / 1000)
        .toFixed(0) +
      "rb"
    );

  }


  return (
    "Rp " +
    number
  );

}


/* =========================================================
   NUMBER
========================================================= */

function formatReportNumber(
  value
) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(value) || 0
  );

}


/* =========================================================
   CAPITAL VALUE
========================================================= */

function getReportCapitalValue(
  keys
) {

  for (
    const key of keys
  ) {

    if (
      reportCapital &&
      reportCapital[key] !==
        undefined &&
      reportCapital[key] !==
        null &&
      reportCapital[key] !==
        ""
    ) {

      const value =
        Number(
          reportCapital[key]
        );


      if (
        Number.isFinite(
          value
        )
      ) {

        return value;

      }

    }

  }


  return 0;

}


/* =========================================================
   RESULT
========================================================= */

function normalizeReportResult(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  const result =
    String(value)
      .trim()
      .toUpperCase();


  if (
    result === "PROFIT" ||
    result === "WIN" ||
    result === "UNTUNG"
  ) {

    return "PROFIT";

  }


  if (
    result === "RUGI" ||
    result === "LOSS" ||
    result === "LOSE"
  ) {

    return "RUGI";

  }


  return result;

}


/* =========================================================
   ACTION CLASS
========================================================= */

function getReportActionClass(
  action
) {

  const value =
    String(
      action || ""
    ).toUpperCase();


  if (
    value === "BUY"
  ) {

    return "badge-buy";

  }


  if (
    value === "SELL"
  ) {

    return "badge-sell";

  }


  return "";

}


/* =========================================================
   RESULT CLASS
========================================================= */

function getReportResultClass(
  result
) {

  if (
    result === "PROFIT"
  ) {

    return "badge-profit";

  }


  if (
    result === "RUGI"
  ) {

    return "badge-loss";

  }


  return "";

}


/* =========================================================
   AMOUNT CLASS
========================================================= */

function getReportAmountClass(
  amount
) {

  const value =
    Number(amount) || 0;


  if (
    value > 0
  ) {

    return "text-profit";

  }


  if (
    value < 0
  ) {

    return "text-loss";

  }


  return "text-muted";

}


/* =========================================================
   SET TEXT
========================================================= */

function setReportText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


/* =========================================================
   LOADING
========================================================= */

function showReportLoading(
  show
) {

  const loading =
    document.getElementById(
      "reportLoading"
    );


  if (!loading) {
    return;
  }


  if (show) {

    loading.classList.remove(
      "hidden"
    );

  } else {

    loading.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   TOAST
========================================================= */

function showReportToast(
  title,
  message,
  type = "success"
) {

  /*
   * Jika trading.js juga tersedia,
   * gunakan toast yang sama.
   */

  if (
    typeof window.showToast ===
    "function"
  ) {

    window.showToast(
      title,
      message,
      type
    );

    return;

  }


  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    console.log(
      title,
      message
    );

    return;

  }


  const titleElement =
    document.getElementById(
      "toastTitle"
    );


  const messageElement =
    document.getElementById(
      "toastMessage"
    );


  if (titleElement) {

    titleElement.textContent =
      title;

  }


  if (messageElement) {

    messageElement.textContent =
      message;

  }


  toast.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {

      toast.classList.add(
        "hidden"
      );

    },
    3500
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeReportHtml(
  value
) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   PUBLIC API
========================================================= */

window.TradingReport = {

  reload:
    loadReportData,

  refresh:
    loadReportData,

  getStatistics:
    () =>
      calculateStatistics(
        getFilteredTransactions()
      )

};
