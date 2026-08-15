/* =========================================================
   TRADING JOURNAL
   laporan.js
   TAHAP 2
   BAGIAN TENGAH SAMPAI AKHIR
========================================================= */

"use strict";


/* =========================================================
   RENDER REPORT
========================================================= */

function renderReport() {

  const data =
    Array.isArray(reportTransactions)
      ? [...reportTransactions]
      : [];


  const statistics =
    calculateStatistics(data);


  /*
   * SUMMARY UTAMA
   */

  updateSummaryCards(
    statistics
  );


  /*
   * MODAL
   */

  updateCapitalSummary();


  /*
   * CHART PROFIT / LOSS
   */

  renderProfitChart(
    data
  );


  /*
   * CHART PROFIT VS RUGI
   */

  renderResultChart(
    statistics
  );


  /*
   * TABEL PERFORMA SAHAM
   */

  renderStockTable(
    data
  );


  /*
   * SEMUA TRANSAKSI
   */

  renderAllTransactionsTable(
    data
  );


  /*
   * JUMLAH TRANSAKSI
   */

  setReportText(
    "transactionCountLabel",
    `${data.length} TRANSAKSI`
  );


  updateReportDate();

}


/* =========================================================
   CALCULATE STATISTICS
========================================================= */

function calculateStatistics(
  data
) {

  let profit = 0;
  let loss = 0;

  let profitCount = 0;
  let lossCount = 0;


  if (!Array.isArray(data)) {
    data = [];
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


      /*
       * Jika nominal positif
       */

      if (amount > 0) {

        profit += amount;

        profitCount++;

      }


      /*
       * Jika nominal negatif
       */

      else if (amount < 0) {

        loss += Math.abs(amount);

        lossCount++;

      }


      /*
       * Jika nominal kosong,
       * gunakan kolom hasil.
       */

      else if (result === "PROFIT") {

        profitCount++;

      }

      else if (result === "RUGI") {

        lossCount++;

      }

    }
  );


  const totalTransactions =
    data.length;


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

    totalTransactions,

    profit,

    loss,

    netProfit,

    profitCount,

    lossCount,

    completedTrades,

    winRate

  };

}


/* =========================================================
   SUMMARY CARDS
   SESUAI LAPORAN.HTML
========================================================= */

function updateSummaryCards(
  statistics
) {

  /*
   * MODAL
   */

  const currentCapital =
    getCurrentReportCapital();


  setReportText(
    "reportModal",
    formatReportRupiah(
      currentCapital
    )
  );


  /*
   * TOTAL PROFIT
   */

  setReportText(
    "reportProfit",
    formatReportSignedRupiah(
      statistics.profit
    )
  );


  /*
   * TOTAL RUGI
   */

  setReportText(
    "reportLoss",
    formatReportSignedRupiah(
      -statistics.loss
    )
  );


  /*
   * NET PROFIT / LOSS
   */

  setReportText(
    "reportNet",
    formatReportSignedRupiah(
      statistics.netProfit
    )
  );


  /*
   * WARNA NET
   */

  const netElement =
    document.getElementById(
      "reportNet"
    );


  if (netElement) {

    netElement.classList.remove(
      "positive",
      "negative"
    );


    if (
      statistics.netProfit > 0
    ) {

      netElement.classList.add(
        "positive"
      );

    }

    else if (
      statistics.netProfit < 0
    ) {

      netElement.classList.add(
        "negative"
      );

    }

  }


  /*
   * DESKRIPSI NET
   */

  let description =
    "Hasil bersih trading";


  if (
    statistics.netProfit > 0
  ) {

    description =
      "Trading menghasilkan profit";

  }

  else if (
    statistics.netProfit < 0
  ) {

    description =
      "Trading mengalami kerugian";

  }


  setReportText(
    "reportNetDescription",
    description
  );


  /*
   * STATISTIK BAWAH
   */

  setReportText(
    "reportTransactions",
    formatReportNumber(
      statistics.totalTransactions
    )
  );


  setReportText(
    "reportWinCount",
    formatReportNumber(
      statistics.profitCount
    )
  );


  setReportText(
    "reportLossCount",
    formatReportNumber(
      statistics.lossCount
    )
  );


  setReportText(
    "reportWinRate",
    `${statistics.winRate.toFixed(1)}%`
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
      : (
          initial +
          added -
          withdrawn
        );


  /*
   * MODAL AWAL
   */

  setReportText(
    "reportInitialCapital",
    formatReportRupiah(
      initial
    )
  );


  /*
   * TAMBAH MODAL
   */

  setReportText(
    "reportAddedCapital",
    formatReportRupiah(
      added
    )
  );


  /*
   * TARIK MODAL
   */

  setReportText(
    "reportWithdrawnCapital",
    formatReportRupiah(
      withdrawn
    )
  );


  /*
   * MODAL SEKARANG
   */

  setReportText(
    "reportCurrentCapital",
    formatReportRupiah(
      calculatedCurrent
    )
  );


  /*
   * Dipakai summary card
   */

  setReportText(
    "reportModal",
    formatReportRupiah(
      calculatedCurrent
    )
  );

}


/* =========================================================
   GET CURRENT CAPITAL
========================================================= */

function getCurrentReportCapital() {

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


  if (current !== null) {

    return current;

  }


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


  return (
    initial +
    added -
    withdrawn
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


  const empty =
    document.getElementById(
      "profitChartEmpty"
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
    }

    catch (error) {
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
      key =>
        dailyData[key]
    );


  /*
   * Tidak ada data
   */

  if (
    labels.length === 0
  ) {

    if (empty) {

      empty.classList.remove(
        "hidden"
      );

    }


    labels.push(
      formatLocalDateKey(
        new Date()
      )
    );

    values.push(
      0
    );

  }

  else {

    if (empty) {

      empty.classList.add(
        "hidden"
      );

    }

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
                "Profit / Loss",

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

                    return formatReportSignedRupiah(
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
   RESULT DONUT CHART
========================================================= */

function renderResultChart(
  statistics
) {

  const canvas =
    document.getElementById(
      "resultChart"
    );


  const empty =
    document.getElementById(
      "resultChartEmpty"
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


  /*
   * Chart disimpan di property
   * agar tidak bentrok dengan
   * profitChart.
   */

  if (
    window.resultChart
  ) {

    try {

      window.resultChart.destroy();

    }

    catch (error) {

      console.warn(
        "Gagal destroy result chart:",
        error
      );

    }

    window.resultChart =
      null;

  }


  const profit =
    Math.max(
      0,
      statistics.profit
    );


  const loss =
    Math.max(
      0,
      statistics.loss
    );


  /*
   * Update angka legenda.
   */

  setReportText(
    "chartProfitValue",
    formatReportRupiah(
      profit
    )
  );


  setReportText(
    "chartLossValue",
    formatReportRupiah(
      loss
    )
  );


  const hasData =
    profit > 0 ||
    loss > 0;


  if (
    empty
  ) {

    if (hasData) {

      empty.classList.add(
        "hidden"
      );

    }

    else {

      empty.classList.remove(
        "hidden"
      );

    }

  }


  const context =
    canvas.getContext(
      "2d"
    );


  if (!context) {
    return;
  }


  /*
   * Chart tetap dibuat walaupun
   * belum ada transaksi.
   */

  window.resultChart =
    new Chart(
      context,
      {

        type:
          "doughnut",

        data: {

          labels: [
            "Profit",
            "Rugi"
          ],

          datasets: [

            {

              data: [
                profit,
                loss
              ],

              backgroundColor: [
                "#4ade80",
                "#f87171"
              ],

              borderColor: [
                "#4ade80",
                "#f87171"
              ],

              borderWidth:
                0,

              hoverOffset:
                5

            }

          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          cutout:
            "68%",

          plugins: {

            legend: {

              display:
                false

            },

            tooltip: {

              callbacks: {

                label:
                  context => {

                    const value =
                      context.raw || 0;


                    return (
                      " " +
                      context.label +
                      ": " +
                      formatReportRupiah(
                        value
                      )
                    );

                  }

              }

            }

          }

        }

      }
    );

}


/* =========================================================
   STOCK PERFORMANCE TABLE
========================================================= */

function renderStockTable(
  data
) {

  const tbody =
    document.getElementById(
      "stockTableBody"
    );


  const wrapper =
    document.getElementById(
      "stockTableWrapper"
    );


  const empty =
    document.getElementById(
      "stockEmpty"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML =
    "";


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
            "-"
          )
            .trim()
            .toUpperCase();


        const amount =
          parseReportNumber(
            transaction?.nominal
          );


        if (
          !stockData[stock]
        ) {

          stockData[stock] = {

            transactions:
              0,

            profit:
              0,

            loss:
              0,

            net:
              0

          };

        }


        stockData[stock]
          .transactions++;


        if (
          amount > 0
        ) {

          stockData[stock]
            .profit += amount;

        }


        if (
          amount < 0
        ) {

          stockData[stock]
            .loss += Math.abs(
              amount
            );

        }


        stockData[stock]
          .net += amount;

      }
    );

  }


  const stocks =
    Object.entries(
      stockData
    )
      .sort(
        (
          [, a],
          [, b]
        ) =>
          Math.abs(b.net) -
          Math.abs(a.net)
      );


  /*
   * KOSONG
   */

  if (
    stocks.length === 0
  ) {

    if (wrapper) {

      wrapper.classList.add(
        "hidden"
      );

    }


    if (empty) {

      empty.classList.remove(
        "hidden"
      );

    }


    return;

  }


  /*
   * ADA DATA
   */

  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  if (wrapper) {

    wrapper.classList.remove(
      "hidden"
    );

  }


  stocks.forEach(
    ([stock, value]) => {

      const row =
        document.createElement(
          "tr"
        );


      const netClass =
        value.net > 0
          ? "text-profit"
          : value.net < 0
            ? "text-loss"
            : "text-muted";


      row.innerHTML = `

        <td>
          <strong>
            ${escapeReportHtml(
              stock
            )}
          </strong>
        </td>

        <td>
          ${formatReportNumber(
            value.transactions
          )}
        </td>

        <td class="text-profit">
          ${formatReportSignedRupiah(
            value.profit
          )}
        </td>

        <td class="text-loss">
          ${formatReportSignedRupiah(
            -value.loss
          )}
        </td>

        <td class="${netClass}">
          <strong>
            ${formatReportSignedRupiah(
              value.net
            )}
          </strong>
        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   ALL TRANSACTIONS TABLE
========================================================= */

function renderAllTransactionsTable(
  data
) {

  const tbody =
    document.getElementById(
      "allTransactionsBody"
    );


  const wrapper =
    document.getElementById(
      "allTransactionsWrapper"
    );


  const empty =
    document.getElementById(
      "reportEmpty"
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
              (
                dateB?.getTime() ||
                0
              ) -
              (
                dateA?.getTime() ||
                0
              )
            );

          }
        )
      )
      : [];


  /*
   * KOSONG
   */

  if (
    sorted.length === 0
  ) {

    if (wrapper) {

      wrapper.classList.add(
        "hidden"
      );

    }


    /*
     * Empty utama hanya
     * ditampilkan jika benar-benar
     * tidak ada transaksi.
     */

    if (empty) {

      empty.classList.remove(
        "hidden"
      );

    }


    return;

  }


  /*
   * ADA DATA
   */

  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  if (wrapper) {

    wrapper.classList.remove(
      "hidden"
    );

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
          .trim()
          .toUpperCase();


      const note =
        transaction?.catatan ||
        "-";


      const price =
        parseReportNumber(
          transaction?.harga
        );


      const lot =
        parseReportNumber(
          transaction?.lot
        );


      const resultClass =
        getReportResultClass(
          result
        );


      const actionClass =
        getReportActionClass(
          action
        );


      const amountClass =
        getReportAmountClass(
          amount
        );


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

          <span
            class="badge ${actionClass}"
          >
            ${escapeReportHtml(
              action
            )}
          </span>

        </td>

        <td>
          ${formatReportRupiah(
            price
          )}
        </td>

        <td>
          ${formatReportNumber(
            lot
          )}
        </td>

        <td>

          ${
            result
              ? `
                <span
                  class="badge ${resultClass}"
                >
                  ${escapeReportHtml(
                    result
                  )}
                </span>
              `
              : "-"
          }

        </td>

        <td class="${amountClass}">

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
   DATE PARSER
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


  if (
    typeof value ===
    "object"
  ) {

    if (
      value.$date
    ) {

      value =
        value.$date;

    }

    else {

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
   * MM-DD-YYYY
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

    return Number.isFinite(
      value
    )
      ? value
      : 0;

  }


  let stringValue =
    String(value)
      .trim();


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
   * Format Indonesia:
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
   * Decimal Indonesia
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


  return Number.isFinite(
    number
  )
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
   NUMBER FORMAT
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

      return parseReportNumber(
        reportCapital[key]
      );

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


  if (loading) {

    loading.classList.toggle(
      "hidden",
      !show
    );

  }


  /*
   * Global loading jika tersedia.
   */

  const globalLoading =
    document.getElementById(
      "globalLoading"
    );


  if (globalLoading) {

    globalLoading.classList.toggle(
      "hidden",
      !show
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
   REPORT DATE
========================================================= */

function setReportDate() {

  /*
   * HTML saat ini tidak wajib
   * mempunyai #reportToday.
   * Jadi aman kalau tidak ada.
   */

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
        Array.isArray(
          reportTransactions
        )
          ? reportTransactions
          : []
      )

};


/* =========================================================
   GLOBAL SHORTCUT
========================================================= */

window.reloadTradingReport =
  loadReportData;


/* =========================================================
   END LAPORAN.JS
========================================================= */
/* =========================================================
   TRADING JOURNAL
   laporan.js
   TAHAP 2
   SESUAI DENGAN laporan.html
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let reportTransactions = [];
let reportCapital = {};

let profitChart = null;
let resultChart = null;

let reportLoading = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeReportPage
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeReportPage() {

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
      async () => {

        await loadReportData();

      }
    );

  }

}


/* =========================================================
   API - TRANSACTIONS
========================================================= */

async function getReportTransactionsFromAPI() {

  if (
    window.TradingAPI &&
    typeof window.TradingAPI.getTransactions ===
      "function"
  ) {

    return await window.TradingAPI.getTransactions();

  }


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


/* =========================================================
   API - CAPITAL
========================================================= */

async function getReportCapitalFromAPI() {

  if (
    window.TradingAPI &&
    typeof window.TradingAPI.getCapital ===
      "function"
  ) {

    return await window.TradingAPI.getCapital();

  }


  if (
    typeof window.getCapital ===
    "function"
  ) {

    return await window.getCapital();

  }


  /*
   * Jika sistem modal belum tersedia,
   * gunakan object kosong supaya laporan
   * transaksi tetap bisa tampil.
   */

  return {};

}


/* =========================================================
   LOAD REPORT
========================================================= */

async function loadReportData() {

  if (reportLoading) {
    return;
  }


  reportLoading = true;


  showReportLoading(true);


  try {

    const results =
      await Promise.all([
        getReportTransactionsFromAPI(),
        getReportCapitalFromAPI()
      ]);


    normalizeTransactions(
      results[0]
    );


    normalizeCapital(
      results[1]
    );


    renderReport();


  } catch (error) {

    console.error(
      "REPORT ERROR:",
      error
    );


    reportTransactions = [];


    reportCapital = {};


    renderReport();


    showReportToast(
      "Gagal memuat laporan",
      getReportErrorMessage(error),
      "error"
    );

  } finally {

    showReportLoading(false);

    reportLoading = false;

  }

}


/* =========================================================
   NORMALIZE TRANSACTIONS
========================================================= */

function normalizeTransactions(
  result
) {

  if (
    Array.isArray(result)
  ) {

    reportTransactions =
      result;

    return;

  }


  if (
    result &&
    Array.isArray(result.data)
  ) {

    reportTransactions =
      result.data;

    return;

  }


  if (
    result &&
    Array.isArray(result.transactions)
  ) {

    reportTransactions =
      result.transactions;

    return;

  }


  reportTransactions = [];

}


/* =========================================================
   NORMALIZE CAPITAL
========================================================= */

function normalizeCapital(
  result
) {

  if (
    !result
  ) {

    reportCapital = {};

    return;

  }


  if (
    result.data &&
    typeof result.data === "object"
  ) {

    reportCapital =
      result.data;

    return;

  }


  if (
    result.capital &&
    typeof result.capital === "object"
  ) {

    reportCapital =
      result.capital;

    return;

  }


  if (
    typeof result === "object"
  ) {

    reportCapital =
      result;

    return;

  }


  reportCapital = {};

}


/* =========================================================
   RENDER REPORT
========================================================= */

function renderReport() {

  const statistics =
    calculateStatistics(
      reportTransactions
    );


  updateSummaryCards(
    statistics
  );


  updateCapitalSummary(
    statistics
  );


  renderProfitChart(
    reportTransactions
  );


  renderResultChart(
    statistics
  );


  renderStockTable(
    reportTransactions
  );


  renderAllTransactions(
    reportTransactions
  );


  updateTransactionCount(
    reportTransactions.length
  );

}


/* =========================================================
   STATISTICS
========================================================= */

function calculateStatistics(
  data
) {

  let profit = 0;
  let loss = 0;

  let profitCount = 0;
  let lossCount = 0;

  let totalNominal = 0;


  if (
    !Array.isArray(data)
  ) {

    data = [];

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
      profit - loss,

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
    "reportProfit",
    formatReportRupiah(
      statistics.profit
    )
  );


  setReportText(
    "reportLoss",
    formatReportRupiah(
      statistics.loss
    )
  );


  setReportText(
    "reportNet",
    formatReportSignedRupiah(
      statistics.netProfit
    )
  );


  setReportText(
    "reportTransactions",
    formatReportNumber(
      statistics.totalTransactions
    )
  );


  setReportText(
    "reportWinCount",
    formatReportNumber(
      statistics.profitCount
    )
  );


  setReportText(
    "reportLossCount",
    formatReportNumber(
      statistics.lossCount
    )
  );


  setReportText(
    "reportWinRate",
    `${statistics.winRate.toFixed(1)}%`
  );


  const netDescription =
    document.getElementById(
      "reportNetDescription"
    );


  if (netDescription) {

    if (
      statistics.netProfit > 0
    ) {

      netDescription.textContent =
        "Trading menghasilkan profit bersih";

    } else if (
      statistics.netProfit < 0
    ) {

      netDescription.textContent =
        "Trading mengalami rugi bersih";

    } else {

      netDescription.textContent =
        "Hasil bersih trading";

    }

  }

}


/* =========================================================
   CAPITAL
========================================================= */

function updateCapitalSummary(
  statistics
) {

  const initial =
    getCapitalValue([
      "modalAwal",
      "modal_awal",
      "initialCapital",
      "initial"
    ]);


  const added =
    getCapitalValue([
      "tambahModal",
      "tambah_modal",
      "addedCapital",
      "added"
    ]);


  const withdrawn =
    getCapitalValue([
      "tarikModal",
      "tarik_modal",
      "withdrawnCapital",
      "withdrawn"
    ]);


  const currentNullable =
    getCapitalValueNullable([
      "modalSekarang",
      "modal_sekarang",
      "currentCapital",
      "current",
      "saldo"
    ]);


  const current =
    currentNullable !== null
      ? currentNullable
      : initial +
        added -
        withdrawn;


  setReportText(
    "reportModal",
    formatReportRupiah(
      current
    )
  );


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
      current
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


  const empty =
    document.getElementById(
      "profitChartEmpty"
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

    profitChart.destroy();

    profitChart = null;

  }


  const grouped =
    groupProfitByDate(
      data
    );


  const labels =
    Object.keys(
      grouped
    ).sort();


  const values =
    labels.map(
      key =>
        grouped[key]
    );


  if (
    labels.length === 0
  ) {

    if (empty) {

      empty.classList.remove(
        "hidden"
      );

    }


    return;

  }


  if (empty) {

    empty.classList.add(
      "hidden"
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

        type: "line",

        data: {

          labels:
            labels.map(
              formatChartDate
            ),

          datasets: [

            {

              label:
                "Profit / Loss",

              data:
                values,

              borderColor:
                "#4ade80",

              backgroundColor:
                "rgba(74,222,128,.10)",

              borderWidth:
                2,

              fill:
                true,

              tension:
                .35,

              pointRadius:
                3,

              pointHoverRadius:
                5

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
              display: false
            },

            tooltip: {

              callbacks: {

                label:
                  context =>
                    formatReportSignedRupiah(
                      context.raw
                    )

              }

            }

          },

          scales: {

            x: {

              grid: {
                display: false
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

  const result = {};


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
        result[key] === undefined
      ) {

        result[key] = 0;

      }


      result[key] +=
        amount;

    }
  );


  return result;

}


/* =========================================================
   RESULT DONUT CHART
========================================================= */

function renderResultChart(
  statistics
) {

  const canvas =
    document.getElementById(
      "resultChart"
    );


  const empty =
    document.getElementById(
      "resultChartEmpty"
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


  if (resultChart) {

    resultChart.destroy();

    resultChart = null;

  }


  setReportText(
    "chartProfitValue",
    formatReportRupiah(
      statistics.profit
    )
  );


  setReportText(
    "chartLossValue",
    formatReportRupiah(
      statistics.loss
    )
  );


  if (
    statistics.profit === 0 &&
    statistics.loss === 0
  ) {

    if (empty) {

      empty.classList.remove(
        "hidden"
      );

    }

    return;

  }


  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  const context =
    canvas.getContext(
      "2d"
    );


  if (!context) {
    return;
  }


  resultChart =
    new Chart(
      context,
      {

        type:
          "doughnut",

        data: {

          labels: [
            "Profit",
            "Rugi"
          ],

          datasets: [

            {

              data: [

                statistics.profit,

                statistics.loss

              ],

              backgroundColor: [

                "#4ade80",

                "#f87171"

              ],

              borderWidth:
                0,

              hoverOffset:
                6

            }

          ]

        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          cutout:
            "68%",

          plugins: {

            legend: {
              display: false
            },

            tooltip: {

              callbacks: {

                label:
                  context => {

                    return (
                      context.label +
                      ": " +
                      formatReportRupiah(
                        context.raw
                      )
                    );

                  }

              }

            }

          }

        }

      }
    );

}


/* =========================================================
   STOCK TABLE
========================================================= */

function renderStockTable(
  data
) {

  const tbody =
    document.getElementById(
      "stockTableBody"
    );


  const empty =
    document.getElementById(
      "stockEmpty"
    );


  const wrapper =
    document.getElementById(
      "stockTableWrapper"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML = "";


  const stocks = {};


  if (
    Array.isArray(data)
  ) {

    data.forEach(
      transaction => {

        const stock =
          String(
            transaction?.saham ||
            "-"
          )
            .trim()
            .toUpperCase();


        const amount =
          parseReportNumber(
            transaction?.nominal
          );


        if (!stocks[stock]) {

          stocks[stock] = {

            transactions: 0,

            profit: 0,

            loss: 0,

            net: 0

          };

        }


        stocks[stock].transactions++;


        if (
          amount > 0
        ) {

          stocks[stock].profit +=
            amount;

        }


        if (
          amount < 0
        ) {

          stocks[stock].loss +=
            Math.abs(amount);

        }


        stocks[stock].net +=
          amount;

      }
    );

  }


  const entries =
    Object.entries(
      stocks
    ).sort(
      (
        [, a],
        [, b]
      ) =>
        Math.abs(b.net) -
        Math.abs(a.net)
    );


  if (
    entries.length === 0
  ) {

    if (empty) {

      empty.classList.remove(
        "hidden"
      );

    }


    if (wrapper) {

      wrapper.classList.add(
        "hidden"
      );

    }


    return;

  }


  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  if (wrapper) {

    wrapper.classList.remove(
      "hidden"
    );

  }


  entries.forEach(
    ([stock, value]) => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          <strong>
            ${escapeReportHtml(stock)}
          </strong>
        </td>

        <td>
          ${formatReportNumber(
            value.transactions
          )}
        </td>

        <td class="text-profit">
          ${formatReportRupiah(
            value.profit
          )}
        </td>

        <td class="text-loss">
          ${formatReportRupiah(
            value.loss
          )}
        </td>

        <td class="${getReportAmountClass(
          value.net
        )}">
          ${formatReportSignedRupiah(
            value.net
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
   ALL TRANSACTIONS
========================================================= */

function renderAllTransactions(
  data
) {

  const tbody =
    document.getElementById(
      "allTransactionsBody"
    );


  const empty =
    document.getElementById(
      "reportEmpty"
    );


  const wrapper =
    document.getElementById(
      "allTransactionsWrapper"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML = "";


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
    sorted.length === 0
  ) {

    if (empty) {

      empty.classList.remove(
        "hidden"
      );

    }


    if (wrapper) {

      wrapper.classList.add(
        "hidden"
      );

    }


    return;

  }


  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  if (wrapper) {

    wrapper.classList.remove(
      "hidden"
    );

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
          .trim()
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
            ${escapeReportHtml(stock)}
          </strong>
        </td>

        <td>
          <span class="badge ${getReportActionClass(
            action
          )}">
            ${escapeReportHtml(action)}
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
                  ${escapeReportHtml(result)}
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
          ${escapeReportHtml(note)}
        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   TRANSACTION COUNT
========================================================= */

function updateTransactionCount(
  count
) {

  setReportText(
    "transactionCountLabel",
    `${formatReportNumber(count)} TRANSAKSI`
  );

}


/* =========================================================
   DATE PARSER
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


  if (
    typeof value === "object"
  ) {

    if (value.$date) {

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


  let match =
    stringValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (match) {

    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      12
    );

  }


  match =
    stringValue.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );


  if (match) {

    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12
    );

  }


  match =
    stringValue.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    );


  if (match) {

    return new Date(
      Number(match[3]),
      Number(match[1]) - 1,
      Number(match[2]),
      12
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
   DATE KEY
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


  return `${year}-${month}-${day}`;

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
   CHART DATE
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
   NUMBER PARSER
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
    typeof value === "number"
  ) {

    return Number.isFinite(value)
      ? value
      : 0;

  }


  let stringValue =
    String(value)
      .trim()
      .replace(
        /Rp/gi,
        ""
      )
      .replace(
        /\s/g,
        ""
      );


  /*
   * Format Indonesia:
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
   RUPIAH
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
   SIGNED RUPIAH
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


  return formatReportRupiah(0);

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
        number / 1000000000
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
        number / 1000000
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
        number / 1000
      ).toFixed(0) +
      "rb"
    );

  }


  return "Rp " + number;

}


/* =========================================================
   NUMBER FORMAT
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

function getCapitalValue(
  keys
) {

  const value =
    getCapitalValueNullable(
      keys
    );


  return value === null
    ? 0
    : value;

}


function getCapitalValueNullable(
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

      return parseReportNumber(
        reportCapital[key]
      );

    }

  }


  return null;

}


/* =========================================================
   RESULT NORMALIZER
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
    [
      "PROFIT",
      "WIN",
      "UNTUNG"
    ].includes(result)
  ) {

    return "PROFIT";

  }


  if (
    [
      "RUGI",
      "LOSS",
      "LOSE"
    ].includes(result)
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
   ERROR
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


  return String(error);

}


/* =========================================================
   TOAST
========================================================= */

function showReportToast(
  title,
  message,
  type = "success"
) {

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

  getStatistics:
    () =>
      calculateStatistics(
        reportTransactions
      )

};


window.reloadTradingReport =
  loadReportData;


/* =========================================================
   END
========================================================= */
