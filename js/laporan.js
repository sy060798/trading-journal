/* =========================================================
   TRADING JOURNAL
   laporan.js
   VERSION UPDATE
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let reportTransactions = [];
let reportCapital = {};

let profitChart = null;
let stockChart = null;

let reportLoading = false;


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

  setReportDate();

  setupReportEvents();

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
      () => loadReportData()
    );

  }


  const filter =
    document.getElementById(
      "reportPeriod"
    );


  if (filter) {

    filter.addEventListener(
      "change",
      () => renderReport()
    );

  }


  const stockFilter =
    document.getElementById(
      "reportStock"
    );


  if (stockFilter) {

    stockFilter.addEventListener(
      "change",
      () => renderReport()
    );

  }

}


/* =========================================================
   API HELPERS
========================================================= */

async function getReportTransactionsFromAPI() {

  /*
   * Prioritas:
   * TradingAPI dari api.js
   */

  if (
    window.TradingAPI &&
    typeof window.TradingAPI.getTransactions ===
      "function"
  ) {

    return await window.TradingAPI.getTransactions();

  }


  /*
   * Fallback untuk api.js lama
   */

  if (
    typeof window.getTransactions ===
    "function"
  ) {

    return await window.getTransactions();

  }


  throw new Error(
    "Fungsi getTransactions tidak ditemukan. Pastikan api.js sudah dimuat."
  );

}


async function getReportCapitalFromAPI() {

  /*
   * Prioritas:
   * TradingAPI dari api.js
   */

  if (
    window.TradingAPI &&
    typeof window.TradingAPI.getCapital ===
      "function"
  ) {

    return await window.TradingAPI.getCapital();

  }


  /*
   * Fallback untuk api.js lama
   */

  if (
    typeof window.getCapital ===
    "function"
  ) {

    return await window.getCapital();

  }


  throw new Error(
    "Fungsi getCapital tidak ditemukan. Pastikan api.js sudah dimuat."
  );

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadReportData() {

  if (reportLoading) {
    return;
  }


  reportLoading = true;


  showReportLoading(
    true
  );


  try {

    /*
     * Ambil transaksi + modal bersamaan.
     */

    const results =
      await Promise.all([
        getReportTransactionsFromAPI(),
        getReportCapitalFromAPI()
      ]);


    const transactionResult =
      results[0];


    const capitalResult =
      results[1];


    /*
     * Normalisasi transaksi.
     */

    if (
      Array.isArray(
        transactionResult
      )
    ) {

      reportTransactions =
        transactionResult;

    } else if (
      transactionResult &&
      Array.isArray(
        transactionResult.data
      )
    ) {

      reportTransactions =
        transactionResult.data;

    } else if (
      transactionResult &&
      Array.isArray(
        transactionResult.transactions
      )
    ) {

      reportTransactions =
        transactionResult.transactions;

    } else {

      reportTransactions =
        [];

    }


    /*
     * Normalisasi capital.
     */

    if (
      capitalResult &&
      capitalResult.data &&
      typeof capitalResult.data ===
        "object"
    ) {

      reportCapital =
        capitalResult.data;

    } else if (
      capitalResult &&
      capitalResult.capital &&
      typeof capitalResult.capital ===
        "object"
    ) {

      reportCapital =
        capitalResult.capital;

    } else if (
      capitalResult &&
      typeof capitalResult ===
        "object"
    ) {

      reportCapital =
        capitalResult;

    } else {

      reportCapital =
        {};

    }


    /*
     * Pastikan array valid.
     */

    if (
      !Array.isArray(
        reportTransactions
      )
    ) {

      reportTransactions =
        [];

    }


    prepareStockFilter();

    renderReport();


  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "REPORT LOAD ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );


    showReportToast(
      "Gagal memuat laporan",
      getReportErrorMessage(error),
      "error"
    );


    /*
     * Jangan biarkan halaman kosong
     * tanpa state yang jelas.
     */

    reportTransactions =
      [];

    reportCapital =
      {};

    renderReport();


  } finally {

    showReportLoading(
      false
    );

    reportLoading =
      false;

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
    Array.isArray(
      reportTransactions
    )
      ? [...reportTransactions]
      : [];


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
   * FILTER SAHAM
   */

  if (
    stock !== "all"
  ) {

    const selectedStock =
      String(stock)
        .trim()
        .toUpperCase();


    data =
      data.filter(
        transaction => {

          const transactionStock =
            String(
              transaction?.saham || ""
            )
              .trim()
              .toUpperCase();


          return (
            transactionStock ===
            selectedStock
          );

        }
      );

  }


  /*
   * FILTER PERIODE
   */

  if (
    period !== "all"
  ) {

    const now =
      new Date();


    const todayStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );


    let startDate =
      null;


    if (
      period === "today"
    ) {

      startDate =
        todayStart;

    }


    if (
      period === "7"
    ) {

      startDate =
        new Date(
          todayStart
        );

      startDate.setDate(
        startDate.getDate() - 6
      );

    }


    if (
      period === "30"
    ) {

      startDate =
        new Date(
          todayStart
        );

      startDate.setDate(
        startDate.getDate() - 29
      );

    }


    if (
      period === "90"
    ) {

      startDate =
        new Date(
          todayStart
        );

      startDate.setDate(
        startDate.getDate() - 89
      );

    }


    if (
      period === "year"
    ) {

      startDate =
        new Date(
          now.getFullYear(),
          0,
          1,
          0,
          0,
          0,
          0
        );

    }


    if (startDate) {

      const endDate =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );


      data =
        data.filter(
          transaction => {

            const date =
              parseTransactionDate(
                transaction?.tanggal
              );


            if (!date) {
              return false;
            }


            return (
              date >= startDate &&
              date <= endDate
            );

          }
        );

    }

  }


  return data;

}


/* =========================================================
   CALCULATE STATISTICS
========================================================= */

function calculateStatistics(
  data
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


  if (
    !Array.isArray(data)
  ) {

    data =
      [];

  }


  data.forEach(
    transaction => {

      const amount =
        parseReportNumber(
          transaction?.nominal
        );


      const result =
        normalizeReportResult(
          transaction?.hasil ??
          transaction?.profitRugi ??
          ""
        );


      totalNominal +=
        amount;


      /*
       * PROFIT
       */

      if (
        amount > 0
      ) {

        profit +=
          amount;

        profitCount++;

      } else if (
        result === "PROFIT"
      ) {

        profitCount++;

      }


      /*
       * RUGI
       */

      if (
        amount < 0
      ) {

        loss +=
          Math.abs(amount);

        lossCount++;

      } else if (
        result === "RUGI"
      ) {

        lossCount++;

      }

    }
  );


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
      data.length,

    totalNominal:
      totalNominal,

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
   * ID alternatif.
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
    getReportCapitalValueNullable(
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
   * ID alternatif.
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


  setReportText(
    "capitalValue",
    formatReportRupiah(
      calculatedCurrent
    )
  );

}


/* =========================================================
   PROFIT CHART
========================================================= */

function renderProfitChart(
  data
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

    console.warn(
      "Chart.js belum dimuat."
    );

    return;

  }


  if (profitChart) {

    try {

      profitChart.destroy();

    } catch (error) {

      console.warn(
        "Gagal destroy profit chart:",
        error
      );

    }


    profitChart =
      null;

  }


  const dailyData =
    groupProfitByDate(
      data
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


  /*
   * Jika kosong, tetap buat chart
   * dengan data 0 agar UI tidak rusak.
   */

  if (
    labels.length === 0
  ) {

    labels.push(
      formatLocalDateKey(
        new Date()
      )
    );

    values.push(
      0
    );

  }


  const context =
    canvas.getContext(
      "2d"
    );


  if (!context) {
    return;
  }


  profitChart =
    new Chart(
      context,
      {

        type:
          "line",

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
                "rgba(74,222,128,0.10)",

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
                  context => {

                    return formatReportRupiah(
                      context.raw
                    );

                  }

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
  data
) {

  const result =
    {};


  if (
    !Array.isArray(data)
  ) {

    return result;

  }


  data.forEach(
    transaction => {

      const date =
        parseTransactionDate(
          transaction?.tanggal
        );


      if (!date) {
        return;
      }


      const key =
        formatLocalDateKey(
          date
        );


      const amount =
        parseReportNumber(
          transaction?.nominal
        );


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
  data
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

    console.warn(
      "Chart.js belum dimuat."
    );

    return;

  }


  if (stockChart) {

    try {

      stockChart.destroy();

    } catch (error) {

      console.warn(
        "Gagal destroy stock chart:",
        error
      );

    }


    stockChart =
      null;

  }


  const stockData =
    {};


  if (
    Array.isArray(data)
  ) {

    data.forEach(
      transaction => {

        const stock =
          String(
            transaction?.saham ||
            "UNKNOWN"
          )
            .trim()
            .toUpperCase();


        const amount =
          parseReportNumber(
            transaction?.nominal
          );


        if (
          stockData[stock] ===
          undefined
        ) {

          stockData[stock] =
            0;

        }


        stockData[stock] +=
          amount;

      }
    );

  }


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


  let labels =
    sorted.map(
      item =>
        item[0]
    );


  let values =
    sorted.map(
      item =>
        item[1]
    );


  /*
   * Data kosong.
   */

  if (
    labels.length ===
    0
  ) {

    labels =
      ["Belum ada"];

    values =
      [0];

  }


  const context =
    canvas.getContext(
      "2d"
    );


  if (!context) {
    return;
  }


  stockChart =
    new Chart(
      context,
      {

        type:
          "bar",

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
                  context => {

                    return formatReportRupiah(
                      context.raw
                    );

                  }

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
  data
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
    Array.isArray(data)
      ? [...data].sort(
          (
            a,
            b
          ) => {

            const dateA =
              parseTransactionDate(
                a?.tanggal
              );


            const dateB =
              parseTransactionDate(
                b?.tanggal
              );


            return (
              (dateB?.getTime() || 0) -
              (dateA?.getTime() || 0)
            );

          }
        )
      : [];


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
        parseReportNumber(
          transaction?.nominal
        );


      const result =
        normalizeReportResult(
          transaction?.hasil ??
          transaction?.profitRugi ??
          ""
        );


      const stock =
        transaction?.saham ||
        "-";


      const action =
        String(
          transaction?.aksi ||
          "-"
        )
          .toUpperCase();


      const note =
        transaction?.catatan ||
        "-";


      row.innerHTML = `

        <td>
          ${escapeReportHtml(
            formatReportDate(
              transaction?.tanggal
            )
          )}
        </td>

        <td>
          <strong>
            ${escapeReportHtml(
              stock
            )}
          </strong>
        </td>

        <td>
          <span class="badge ${getReportActionClass(
            action
          )}">
            ${escapeReportHtml(
              action
            )}
          </span>
        </td>

        <td>
          ${formatReportRupiah(
            transaction?.harga
          )}
        </td>

        <td>
          ${formatReportNumber(
            transaction?.lot
          )}
        </td>

        <td>
          ${
            result
              ? `
                <span class="badge ${getReportResultClass(
                  result
                )}">
                  ${escapeReportHtml(
                    result
                  )}
                </span>
              `
              : "-"
          }
        </td>

        <td class="${getReportAmountClass(
          amount
        )}">
          ${
            amount !== 0
              ? formatReportSignedRupiah(
                  amount
                )
              : "-"
          }
        </td>

        <td>
          ${escapeReportHtml(
            note
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
    String(
      select.value ||
      "all"
    )
      .trim()
      .toUpperCase();


  const stocks =
    [
      ...new Set(
        (
          Array.isArray(
            reportTransactions
          )
            ? reportTransactions
            : []
        )
          .map(
            transaction =>
              String(
                transaction?.saham ||
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


  select.innerHTML = "";


  const allOption =
    document.createElement(
      "option"
    );


  allOption.value =
    "all";


  allOption.textContent =
    "Semua Saham";


  select.appendChild(
    allOption
  );


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
    currentValue ===
    "ALL"
  ) {

    select.value =
      "all";

  } else if (
    stocks.includes(
      currentValue
    )
  ) {

    select.value =
      currentValue;

  } else {

    select.value =
      "all";

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
      new Date()
    );

}


/* =========================================================
   PARSE TRANSACTION DATE
========================================================= */

function parseTransactionDate(
  value
) {

  if (!value) {
    return null;
  }


  if (
    value instanceof Date
  ) {

    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;

  }


  /*
   * Apps Script kadang mengirim
   * tanggal sebagai object/string.
   */

  if (
    typeof value ===
    "object"
  ) {

    if (
      value.$date
    ) {

      value =
        value.$date;

    } else {

      value =
        String(value);

    }

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
      Number(match[1]),
      12,
      0,
      0,
      0
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
      Number(match[3]),
      12,
      0,
      0,
      0
    );

  }


  /*
   * MM/DD/YYYY
   */

  match =
    stringValue.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    );


  if (match) {

    return new Date(
      Number(match[3]),
      Number(match[1]) - 1,
      Number(match[2]),
      12,
      0,
      0,
      0
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
   LOCAL DATE KEY
========================================================= */

function formatLocalDateKey(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

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
   PARSE NUMBER
========================================================= */

function parseReportNumber(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return 0;

  }


  if (
    typeof value ===
    "number"
  ) {

    return Number.isFinite(value)
      ? value
      : 0;

  }


  let stringValue =
    String(value)
      .trim();


  /*
   * Hapus Rp.
   */

  stringValue =
    stringValue
      .replace(
        /Rp/gi,
        ""
      )
      .replace(
        /\s/g,
        ""
      );


  /*
   * Angka Indonesia:
   * 10.000.000
   */

  if (
    stringValue.includes(".") &&
    !stringValue.includes(",")
  ) {

    stringValue =
      stringValue.replace(
        /\./g,
        ""
      );

  }


  /*
   * Decimal:
   * 1000,50
   */

  stringValue =
    stringValue.replace(
      /,/g,
      "."
    );


  const number =
    Number(
      stringValue
    );


  return Number.isFinite(number)
    ? number
    : 0;

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
    parseReportNumber(
      value
    )
  );

}


/* =========================================================
   FORMAT SIGNED RUPIAH
========================================================= */

function formatReportSignedRupiah(
  value
) {

  const number =
    parseReportNumber(
      value
    );


  if (
    number > 0
  ) {

    return (
      "+" +
      formatReportRupiah(
        number
      )
    );

  }


  if (
    number < 0
  ) {

    return (
      "-" +
      formatReportRupiah(
        Math.abs(number)
      )
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
    parseReportNumber(
      value
    );


  const absolute =
    Math.abs(number);


  if (
    absolute >= 1000000000
  ) {

    return (
      "Rp " +
      (
        number /
        1000000000
      ).toFixed(1) +
      "M"
    );

  }


  if (
    absolute >= 1000000
  ) {

    return (
      "Rp " +
      (
        number /
        1000000
      ).toFixed(1) +
      "jt"
    );

  }


  if (
    absolute >= 1000
  ) {

    return (
      "Rp " +
      (
        number /
        1000
      ).toFixed(0) +
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
    parseReportNumber(
      value
    )
  );

}


/* =========================================================
   CAPITAL VALUE
========================================================= */

function getReportCapitalValue(
  keys
) {

  const value =
    getReportCapitalValueNullable(
      keys
    );


  return value === null
    ? 0
    : value;

}


/* =========================================================
   CAPITAL VALUE NULLABLE
========================================================= */

function getReportCapitalValueNullable(
  keys
) {

  if (
    !reportCapital ||
    typeof reportCapital !==
      "object"
  ) {

    return null;

  }


  for (
    const key of keys
  ) {

    if (
      reportCapital[key] !==
        undefined &&
      reportCapital[key] !==
        null &&
      reportCapital[key] !==
        ""
    ) {

      const value =
        parseReportNumber(
          reportCapital[key]
        );


      return value;

    }

  }


  return null;

}


/* =========================================================
   NORMALIZE RESULT
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
    )
      .trim()
      .toUpperCase();


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
    parseReportNumber(
      amount
    );


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
   ERROR MESSAGE
========================================================= */

function getReportErrorMessage(
  error
) {

  if (!error) {

    return "Terjadi kesalahan.";

  }


  if (
    typeof error ===
    "string"
  ) {

    return error;

  }


  if (
    error.message
  ) {

    return error.message;

  }


  return String(
    error
  );

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
   * Gunakan TradingAPI error helper
   * bila tersedia.
   */

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    console.log(
      `[${type}] ${title}: ${message}`
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


  const icon =
    document.getElementById(
      "toastIcon"
    );


  if (titleElement) {

    titleElement.textContent =
      title;

  }


  if (messageElement) {

    messageElement.textContent =
      message;

  }


  if (icon) {

    icon.textContent =
      type === "error"
        ? "!"
        : "✓";


    icon.style.background =
      type === "error"
        ? "rgba(239,68,68,.12)"
        : "rgba(34,197,94,.12)";


    icon.style.color =
      type === "error"
        ? "#f87171"
        : "#4ade80";

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

  render:
    renderReport,

  getFilteredTransactions:
    getFilteredTransactions,

  getStatistics:
    () =>
      calculateStatistics(
        getFilteredTransactions()
      )

};


/* =========================================================
   GLOBAL SHORTCUT
========================================================= */

window.reloadTradingReport =
  loadReportData;
