/* =========================================================
   TRADING JOURNAL
   laporan.js
   FULL VERSION
   DATA REAL DARI GOOGLE SHEETS
   ========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let laporanData = {
  transaksi: [],
  modal: [],
  summary: {}
};

let isLoading = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  console.log("[Laporan] Memulai...");

  initLaporan();

});


/* =========================================================
   INIT
========================================================= */

async function initLaporan() {

  bindEvents();

  setDefaultDate();

  await loadLaporan();

}


/* =========================================================
   BIND EVENTS
========================================================= */

function bindEvents() {

  const refreshButton =
    document.getElementById("refreshButton") ||
    document.getElementById("refreshLaporanButton") ||
    document.getElementById("btnRefresh");

  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      function () {

        loadLaporan();

      }
    );

  }


  const filterButton =
    document.getElementById("filterButton") ||
    document.getElementById("applyFilterButton");

  if (filterButton) {

    filterButton.addEventListener(
      "click",
      function () {

        renderAll();

      }
    );

  }


  const resetButton =
    document.getElementById("resetFilterButton") ||
    document.getElementById("clearFilterButton");

  if (resetButton) {

    resetButton.addEventListener(
      "click",
      function () {

        resetFilter();

      }
    );

  }


  const searchInput =
    document.getElementById("searchInput") ||
    document.getElementById("search");

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        renderAll();

      }
    );

  }


  const filterAksi =
    document.getElementById("filterAksi");

  if (filterAksi) {

    filterAksi.addEventListener(
      "change",
      function () {

        renderAll();

      }
    );

  }


  const filterHasil =
    document.getElementById("filterHasil");

  if (filterHasil) {

    filterHasil.addEventListener(
      "change",
      function () {

        renderAll();

      }
    );

  }


  const filterTanggalAwal =
    document.getElementById("filterTanggalAwal");

  const filterTanggalAkhir =
    document.getElementById("filterTanggalAkhir");


  if (filterTanggalAwal) {

    filterTanggalAwal.addEventListener(
      "change",
      function () {

        renderAll();

      }
    );

  }


  if (filterTanggalAkhir) {

    filterTanggalAkhir.addEventListener(
      "change",
      function () {

        renderAll();

      }
    );

  }

}


/* =========================================================
   LOAD LAPORAN
========================================================= */

async function loadLaporan() {

  if (isLoading) {
    return;
  }

  isLoading = true;

  showLoading(true);

  clearError();


  try {

    console.log(
      "[Laporan] Mengambil data Google Sheets..."
    );


    if (
      typeof window.TradingAPI === "undefined"
    ) {

      throw new Error(
        "api.js belum dimuat. Pastikan laporan.html memanggil api.js sebelum laporan.js."
      );

    }


    let result;


    /*
     * Ambil semua data.
     */

    result =
      await window.TradingAPI.getAllData();


    console.log(
      "[Laporan] API response:",
      result
    );


    const parsed =
      normalizeApiResponse(result);


    laporanData =
      parsed;


    console.log(
      "[Laporan] Data transaksi:",
      laporanData.transaksi
    );


    console.log(
      "[Laporan] Data modal:",
      laporanData.modal
    );


    console.log(
      "[Laporan] Summary:",
      laporanData.summary
    );


    /*
     * Render.
     */

    renderAll();


    showLoading(false);


    /*
     * Jika tidak ada data sama sekali,
     * tampilkan empty state, bukan loading.
     */

    if (
      laporanData.transaksi.length === 0 &&
      laporanData.modal.length === 0
    ) {

      showEmptyMessage();

    }


  } catch (error) {

    console.error(
      "[Laporan] Gagal memuat:",
      error
    );


    showLoading(false);


    showError(
      getErrorMessage(error)
    );

  } finally {

    isLoading = false;

    showLoading(false);

  }

}


/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */

function normalizeApiResponse(result) {

  let root =
    result || {};


  /*
   * Response Apps Script biasanya:
   *
   * {
   *   success: true,
   *   data: {
   *      transaksi: [],
   *      modal: [],
   *      summary: {}
   *   }
   * }
   */

  let data =
    root.data || root;


  /*
   * Jika data ternyata string JSON.
   */

  if (
    typeof data === "string"
  ) {

    try {

      data =
        JSON.parse(data);

    } catch (error) {

      console.warn(
        "[Laporan] data bukan JSON:",
        data
      );

    }

  }


  /*
   * TRANSAKSI
   */

  let transaksi =
    data.transaksi ||
    data.transactions ||
    data.TRANSAKSI ||
    data.transaction ||
    [];


  /*
   * MODAL
   */

  let modal =
    data.modal ||
    data.MODAL ||
    data.capital ||
    [];


  /*
   * Pastikan array.
   */

  if (!Array.isArray(transaksi)) {

    transaksi = [];

  }


  if (!Array.isArray(modal)) {

    modal = [];

  }


  /*
   * SUMMARY.
   */

  let summary =
    data.summary ||
    root.summary ||
    {};


  /*
   * Kalau summary kosong,
   * hitung ulang dari data sheets.
   */

  summary =
    normalizeSummary(
      summary,
      transaksi,
      modal
    );


  return {

    transaksi:
      transaksi,

    modal:
      modal,

    summary:
      summary

  };

}


/* =========================================================
   NORMALIZE SUMMARY
========================================================= */

function normalizeSummary(
  summary,
  transaksi,
  modal
) {

  const result = {

    modalAwal:
      getNumber(
        summary.modalAwal
      ),

    totalTambah:
      getNumber(
        summary.totalTambah
      ),

    totalTarik:
      getNumber(
        summary.totalTarik
      ),

    modal:
      getNumber(
        summary.modal
      ),

    totalProfit:
      getNumber(
        summary.totalProfit
      ),

    totalRugi:
      getNumber(
        summary.totalRugi
      ),

    netProfit:
      getNumber(
        summary.netProfit
      ),

    total:
      getNumber(
        summary.total
      ),

    jumlahTransaksi:
      getNumber(
        summary.jumlahTransaksi
      ),

    jumlahProfit:
      getNumber(
        summary.jumlahProfit
      ),

    jumlahRugi:
      getNumber(
        summary.jumlahRugi
      ),

    winRate:
      getNumber(
        summary.winRate
      )

  };


  /*
   * Hitung ulang dari data jika
   * summary dari API tidak lengkap.
   */

  const calculated =
    calculateSummaryFromData(
      transaksi,
      modal
    );


  const summaryKeys =
    Object.keys(summary || {});


  if (
    summaryKeys.length === 0 ||
    (
      result.jumlahTransaksi === 0 &&
      transaksi.length > 0
    )
  ) {

    return calculated;

  }


  /*
   * Perbaiki field yang tidak ada.
   */

  if (
    result.jumlahTransaksi === 0 &&
    transaksi.length > 0
  ) {

    result.jumlahTransaksi =
      calculated.jumlahTransaksi;

  }


  if (
    result.modal === 0 &&
    calculated.modal !== 0
  ) {

    result.modal =
      calculated.modal;

  }


  if (
    result.totalProfit === 0 &&
    calculated.totalProfit !== 0
  ) {

    result.totalProfit =
      calculated.totalProfit;

  }


  if (
    result.totalRugi === 0 &&
    calculated.totalRugi !== 0
  ) {

    result.totalRugi =
      calculated.totalRugi;

  }


  if (
    result.netProfit === 0 &&
    calculated.netProfit !== 0
  ) {

    result.netProfit =
      calculated.netProfit;

  }


  if (
    result.total === 0 &&
    calculated.total !== 0
  ) {

    result.total =
      calculated.total;

  }


  if (
    result.jumlahProfit === 0 &&
    calculated.jumlahProfit !== 0
  ) {

    result.jumlahProfit =
      calculated.jumlahProfit;

  }


  if (
    result.jumlahRugi === 0 &&
    calculated.jumlahRugi !== 0
  ) {

    result.jumlahRugi =
      calculated.jumlahRugi;

  }


  if (
    result.winRate === 0 &&
    calculated.winRate !== 0
  ) {

    result.winRate =
      calculated.winRate;

  }


  return result;

}


/* =========================================================
   CALCULATE SUMMARY FROM DATA
========================================================= */

function calculateSummaryFromData(
  transaksi,
  modal
) {

  let modalAwal = 0;
  let totalTambah = 0;
  let totalTarik = 0;

  let totalProfit = 0;
  let totalRugi = 0;

  let jumlahProfit = 0;
  let jumlahRugi = 0;


  transaksi.forEach(
    function (item) {

      const hasil =
        getTransactionValue(
          item,
          [
            "profitRugi",
            "Profit/Rugi",
            "hasil",
            "Hasil"
          ]
        )
        .toUpperCase();


      const nominal =
        getNumberFromObject(
          item,
          [
            "nominal",
            "Nominal"
          ]
        );


      if (
        hasil === "PROFIT"
      ) {

        totalProfit +=
          nominal;

        jumlahProfit++;

      }


      if (
        hasil === "RUGI"
      ) {

        totalRugi +=
          nominal;

        jumlahRugi++;

      }

    }
  );


  modal.forEach(
    function (item) {

      const jenis =
        getTransactionValue(
          item,
          [
            "jenis",
            "Jenis"
          ]
        )
        .toUpperCase();


      const nominal =
        getNumberFromObject(
          item,
          [
            "nominal",
            "Nominal"
          ]
        );


      if (
        jenis === "AWAL"
      ) {

        modalAwal +=
          nominal;

      }


      else if (
        jenis === "TAMBAH"
      ) {

        totalTambah +=
          nominal;

      }


      else if (
        jenis === "TARIK"
      ) {

        totalTarik +=
          nominal;

      }

    }
  );


  const modalTersedia =
    modalAwal +
    totalTambah -
    totalTarik;


  const netProfit =
    totalProfit -
    totalRugi;


  const total =
    modalTersedia +
    netProfit;


  const jumlahTransaksi =
    transaksi.length;


  const totalHasil =
    jumlahProfit +
    jumlahRugi;


  const winRate =
    totalHasil > 0
      ? (
          jumlahProfit /
          totalHasil
        ) * 100
      : 0;


  return {

    modalAwal:
      modalAwal,

    totalTambah:
      totalTambah,

    totalTarik:
      totalTarik,

    modal:
      modalTersedia,

    totalProfit:
      totalProfit,

    totalRugi:
      totalRugi,

    netProfit:
      netProfit,

    total:
      total,

    jumlahTransaksi:
      jumlahTransaksi,

    jumlahProfit:
      jumlahProfit,

    jumlahRugi:
      jumlahRugi,

    winRate:
      Number(
        winRate.toFixed(2)
      )

  };

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderSummary();

  renderTransactions();

  renderModal();

}


/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary() {

  const s =
    laporanData.summary || {};


  setMoney(
    [
      "modalValue",
      "modalTotal",
      "totalModal",
      "capitalValue"
    ],
    s.modal
  );


  setMoney(
    [
      "profitValue",
      "totalProfit",
      "profitLossValue"
    ],
    s.totalProfit
  );


  setMoney(
    [
      "rugiValue",
      "totalRugi",
      "lossValue"
    ],
    s.totalRugi
  );


  setMoney(
    [
      "netProfitValue",
      "netValue",
      "profitLossNet"
    ],
    s.netProfit
  );


  setMoney(
    [
      "totalValue",
      "portfolioValue",
      "totalCapital"
    ],
    s.total
  );


  setNumber(
    [
      "jumlahTransaksi",
      "totalTransaksi",
      "transactionCount"
    ],
    s.jumlahTransaksi
  );


  setNumber(
    [
      "jumlahProfit",
      "profitCount"
    ],
    s.jumlahProfit
  );


  setNumber(
    [
      "jumlahRugi",
      "rugiCount",
      "lossCount"
    ],
    s.jumlahRugi
  );


  setPercent(
    [
      "winRate",
      "winRateValue"
    ],
    s.winRate
  );


  setMoney(
    [
      "modalAwalValue",
      "modalAwal"
    ],
    s.modalAwal
  );


  setMoney(
    [
      "totalTambahValue",
      "totalTambah"
    ],
    s.totalTambah
  );


  setMoney(
    [
      "totalTarikValue",
      "totalTarik"
    ],
    s.totalTarik
  );

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

  const tableBody =
    document.getElementById(
      "transactionTableBody"
    ) ||
    document.getElementById(
      "laporanTableBody"
    ) ||
    document.getElementById(
      "reportTableBody"
    );


  if (!tableBody) {

    console.warn(
      "[Laporan] Table transaksi tidak ditemukan."
    );

    return;

  }


  const data =
    getFilteredTransactions();


  tableBody.innerHTML = "";


  if (
    data.length === 0
  ) {

    showTransactionEmpty();

    return;

  }


  hideTransactionEmpty();


  data.forEach(
    function (item) {

      const row =
        document.createElement("tr");


      const id =
        getTransactionValue(
          item,
          ["id", "ID"]
        );


      const tanggal =
        getTransactionValue(
          item,
          ["tanggal", "Tanggal"]
        );


      const saham =
        getTransactionValue(
          item,
          ["saham", "Saham"]
        );


      const aksi =
        getTransactionValue(
          item,
          ["aksi", "Aksi"]
        )
        .toUpperCase();


      const harga =
        getNumberFromObject(
          item,
          ["harga", "Harga"]
        );


      const lot =
        getNumberFromObject(
          item,
          ["lot", "Lot"]
        );


      const hasil =
        getTransactionValue(
          item,
          [
            "profitRugi",
            "Profit/Rugi",
            "hasil",
            "Hasil"
          ]
        )
        .toUpperCase();


      const nominal =
        getNumberFromObject(
          item,
          ["nominal", "Nominal"]
        );


      row.innerHTML = `

        <td>
          ${escapeHtml(
            formatDisplayDate(tanggal)
          )}
        </td>

        <td>
          <strong>
            ${escapeHtml(saham)}
          </strong>
        </td>

        <td>
          <span class="badge ${getAksiClass(aksi)}">
            ${escapeHtml(aksi)}
          </span>
        </td>

        <td>
          ${formatMoney(harga)}
        </td>

        <td>
          ${formatNumber(lot)}
        </td>

        <td>
          ${
            hasil
              ? `
                <span class="badge ${getHasilClass(hasil)}">
                  ${escapeHtml(hasil)}
                </span>
              `
              : "-"
          }
        </td>

        <td>
          ${
            hasil
              ? formatMoney(
                  hasil === "RUGI"
                    ? -Math.abs(nominal)
                    : Math.abs(nominal)
                )
              : "-"
          }
        </td>

        ${
          id
            ? `
              <td class="action-cell">

                <button
                  type="button"
                  class="edit-button"
                  data-edit-id="${escapeHtml(id)}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="delete-button"
                  data-delete-id="${escapeHtml(id)}"
                >
                  Hapus
                </button>

              </td>
            `
            : ""
        }

      `;


      tableBody.appendChild(row);

    }
  );


  bindRowActions();

}


/* =========================================================
   RENDER MODAL
========================================================= */

function renderModal() {

  const tableBody =
    document.getElementById(
      "modalTableBody"
    ) ||
    document.getElementById(
      "capitalTableBody"
    );


  if (!tableBody) {

    return;

  }


  tableBody.innerHTML = "";


  if (
    laporanData.modal.length === 0
  ) {

    const row =
      document.createElement("tr");


    row.innerHTML = `
      <td colspan="6">
        Belum ada data modal.
      </td>
    `;


    tableBody.appendChild(row);

    return;

  }


  laporanData.modal.forEach(
    function (item) {

      const row =
        document.createElement("tr");


      const id =
        getTransactionValue(
          item,
          ["id", "ID"]
        );


      const tanggal =
        getTransactionValue(
          item,
          ["tanggal", "Tanggal"]
        );


      const jenis =
        getTransactionValue(
          item,
          ["jenis", "Jenis"]
        )
        .toUpperCase();


      const nominal =
        getNumberFromObject(
          item,
          ["nominal", "Nominal"]
        );


      const catatan =
        getTransactionValue(
          item,
          ["catatan", "Catatan"]
        );


      const timestamp =
        getTransactionValue(
          item,
          ["timestamp", "Timestamp"]
        );


      row.innerHTML = `

        <td>
          ${escapeHtml(
            formatDisplayDate(tanggal)
          )}
        </td>

        <td>
          <span class="badge ${getModalClass(jenis)}">
            ${escapeHtml(jenis)}
          </span>
        </td>

        <td>
          ${formatMoney(nominal)}
        </td>

        <td>
          ${escapeHtml(catatan)}
        </td>

        <td>
          ${escapeHtml(timestamp)}
        </td>

        <td>
          ${
            id
              ? `
                <button
                  type="button"
                  class="delete-button"
                  data-delete-modal-id="${escapeHtml(id)}"
                >
                  Hapus
                </button>
              `
              : ""
          }
        </td>

      `;


      tableBody.appendChild(row);

    }
  );


  bindModalActions();

}


/* =========================================================
   FILTER TRANSACTIONS
========================================================= */

function getFilteredTransactions() {

  let data =
    [...laporanData.transaksi];


  const searchInput =
    document.getElementById(
      "searchInput"
    ) ||
    document.getElementById(
      "search"
    );


  if (searchInput) {

    const search =
      String(
        searchInput.value || ""
      )
      .trim()
      .toLowerCase();


    if (search) {

      data =
        data.filter(
          function (item) {

            const saham =
              getTransactionValue(
                item,
                ["saham", "Saham"]
              )
              .toLowerCase();


            const catatan =
              getTransactionValue(
                item,
                ["catatan", "Catatan"]
              )
              .toLowerCase();


            const aksi =
              getTransactionValue(
                item,
                ["aksi", "Aksi"]
              )
              .toLowerCase();


            return (
              saham.includes(search) ||
              catatan.includes(search) ||
              aksi.includes(search)
            );

          }
        );

    }

  }


  const aksiSelect =
    document.getElementById(
      "filterAksi"
    );


  if (
    aksiSelect &&
    aksiSelect.value
  ) {

    data =
      data.filter(
        function (item) {

          return (
            getTransactionValue(
              item,
              ["aksi", "Aksi"]
            )
            .toUpperCase() ===
            aksiSelect.value
              .toUpperCase()
          );

        }
      );

  }


  const hasilSelect =
    document.getElementById(
      "filterHasil"
    );


  if (
    hasilSelect &&
    hasilSelect.value
  ) {

    data =
      data.filter(
        function (item) {

          return (
            getTransactionValue(
              item,
              [
                "profitRugi",
                "Profit/Rugi",
                "hasil"
              ]
            )
            .toUpperCase() ===
            hasilSelect.value
              .toUpperCase()
          );

        }
      );

  }


  const awal =
    document.getElementById(
      "filterTanggalAwal"
    )?.value;


  const akhir =
    document.getElementById(
      "filterTanggalAkhir"
    )?.value;


  if (awal) {

    data =
      data.filter(
        function (item) {

          return (
            normalizeDateForCompare(
              getTransactionValue(
                item,
                ["tanggal", "Tanggal"]
              )
            ) >= awal
          );

        }
      );

  }


  if (akhir) {

    data =
      data.filter(
        function (item) {

          return (
            normalizeDateForCompare(
              getTransactionValue(
                item,
                ["tanggal", "Tanggal"]
              )
            ) <= akhir
          );

        }
      );

  }


  return data;

}


/* =========================================================
   ROW ACTIONS
========================================================= */

function bindRowActions() {

  document
    .querySelectorAll(
      "[data-edit-id]"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const id =
              this.dataset.editId;

            editTransaction(id);

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-delete-id]"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const id =
              this.dataset.deleteId;

            deleteTransactionFromReport(id);

          }
        );

      }
    );

}


/* =========================================================
   EDIT TRANSACTION
========================================================= */

async function editTransaction(id) {

  const item =
    laporanData.transaksi.find(
      function (transaction) {

        return String(
          getTransactionValue(
            transaction,
            ["id", "ID"]
          )
        ) === String(id);

      }
    );


  if (!item) {

    showError(
      "Data transaksi tidak ditemukan."
    );

    return;

  }


  /*
   * Jika halaman punya fungsi edit sendiri,
   * gunakan fungsi tersebut.
   */

  if (
    typeof window.openEditTransaction ===
    "function"
  ) {

    window.openEditTransaction(item);

    return;

  }


  /*
   * Fallback:
   * arahkan ke index dengan ID.
   */

  window.location.href =
    "index.html?edit=" +
    encodeURIComponent(id);

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTransactionFromReport(id) {

  if (!id) {

    showError(
      "ID transaksi tidak ditemukan."
    );

    return;

  }


  const confirmed =
    window.confirm(
      "Hapus transaksi ini?\n\nData yang dihapus tidak dapat dikembalikan."
    );


  if (!confirmed) {

    return;

  }


  try {

    showGlobalLoading(
      true,
      "Menghapus transaksi..."
    );


    await window.TradingAPI.deleteTransaction(
      id
    );


    /*
     * Ambil ulang dari Google Sheets.
     */

    await loadLaporan();


    showSuccess(
      "Transaksi berhasil dihapus."
    );


  } catch (error) {

    console.error(
      "[Laporan] Delete error:",
      error
    );


    showError(
      getErrorMessage(error)
    );

  } finally {

    showGlobalLoading(false);

  }

}


/* =========================================================
   DELETE MODAL
========================================================= */

function bindModalActions() {

  document
    .querySelectorAll(
      "[data-delete-modal-id]"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const id =
              this.dataset.deleteModalId;

            deleteModalFromReport(id);

          }
        );

      }
    );

}


async function deleteModalFromReport(id) {

  if (!id) {

    return;

  }


  const confirmed =
    window.confirm(
      "Hapus catatan modal ini?"
    );


  if (!confirmed) {

    return;

  }


  try {

    showGlobalLoading(
      true,
      "Menghapus modal..."
    );


    /*
     * API harus memiliki endpoint delete modal.
     */

    await window.TradingAPI.post(
      "delete_modal",
      {
        id: id
      }
    );


    await loadLaporan();


    showSuccess(
      "Catatan modal berhasil dihapus."
    );


  } catch (error) {

    console.error(
      "[Laporan] Delete modal error:",
      error
    );


    showError(
      getErrorMessage(error)
    );

  } finally {

    showGlobalLoading(false);

  }

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetFilter() {

  [
    "searchInput",
    "search",
    "filterAksi",
    "filterHasil",
    "filterTanggalAwal",
    "filterTanggalAkhir"
  ]
  .forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (!element) {

        return;

      }


      if (
        element.tagName === "SELECT"
      ) {

        element.value = "";

      } else {

        element.value = "";

      }

    }
  );


  renderAll();

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDate() {

  const today =
    getTodayString();


  const elements = [
    "filterTanggalAkhir"
  ];


  elements.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      /*
       * Jangan otomatis mengisi filter
       * kalau tidak ada kebutuhan.
       */

      if (element) {

        // Sengaja dikosongkan agar semua data tampil.

      }

    }
  );

}


/* =========================================================
   UI LOADING
========================================================= */

function showLoading(show) {

  const loadingElements = [

    document.getElementById(
      "loadingState"
    ),

    document.getElementById(
      "laporanLoading"
    ),

    document.getElementById(
      "reportLoading"
    ),

    document.getElementById(
      "transactionLoading"
    )

  ];


  loadingElements.forEach(
    function (element) {

      if (!element) {

        return;

      }


      if (show) {

        element.classList.remove(
          "hidden"
        );

        element.style.display =
          "";

      } else {

        element.classList.add(
          "hidden"
        );

        element.style.display =
          "none";

      }

    }
  );

}


/* =========================================================
   EMPTY
========================================================= */

function showEmptyMessage() {

  const elements = [

    document.getElementById(
      "emptyState"
    ),

    document.getElementById(
      "laporanEmpty"
    ),

    document.getElementById(
      "transactionEmpty"
    )

  ];


  elements.forEach(
    function (element) {

      if (element) {

        element.classList.remove(
          "hidden"
        );

        element.style.display =
          "";

      }

    }
  );

}


function showTransactionEmpty() {

  const element =
    document.getElementById(
      "transactionEmpty"
    );


  if (element) {

    element.classList.remove(
      "hidden"
    );

    element.style.display =
      "";

  }

}


function hideTransactionEmpty() {

  const element =
    document.getElementById(
      "transactionEmpty"
    );


  if (element) {

    element.classList.add(
      "hidden"
    );

    element.style.display =
      "none";

  }

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

  console.error(
    "[Laporan]",
    message
  );


  const errorElements = [

    document.getElementById(
      "errorMessage"
    ),

    document.getElementById(
      "laporanError"
    ),

    document.getElementById(
      "reportError"
    )

  ];


  let shown = false;


  errorElements.forEach(
    function (element) {

      if (!element) {

        return;

      }


      shown = true;


      element.textContent =
        message;


      element.classList.remove(
        "hidden"
      );


      element.style.display =
        "";

    }
  );


  /*
   * Kalau HTML tidak punya error box,
   * gunakan alert agar error tidak
   * tersembunyi di loading.
   */

  if (!shown) {

    window.alert(
      "Gagal memuat laporan:\n\n" +
      message
    );

  }

}


function clearError() {

  [
    "errorMessage",
    "laporanError",
    "reportError"
  ]
  .forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (element) {

        element.textContent =
          "";

        element.classList.add(
          "hidden"
        );

        element.style.display =
          "none";

      }

    }
  );

}


/* =========================================================
   GLOBAL LOADING
========================================================= */

function showGlobalLoading(
  show,
  message = "Memproses..."
) {

  const loading =
    document.getElementById(
      "globalLoading"
    );


  const text =
    document.getElementById(
      "globalLoadingText"
    );


  if (text) {

    text.textContent =
      message;

  }


  if (!loading) {

    return;

  }


  if (show) {

    loading.classList.remove(
      "hidden"
    );

    loading.style.display =
      "";

  } else {

    loading.classList.add(
      "hidden"
    );

    loading.style.display =
      "none";

  }

}


/* =========================================================
   SUCCESS
========================================================= */

function showSuccess(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  const title =
    document.getElementById(
      "toastTitle"
    );


  const messageElement =
    document.getElementById(
      "toastMessage"
    );


  if (
    toast &&
    messageElement
  ) {

    if (title) {

      title.textContent =
        "Berhasil";

    }


    messageElement.textContent =
      message;


    toast.classList.remove(
      "hidden"
    );


    toast.style.display =
      "";


    setTimeout(
      function () {

        toast.classList.add(
          "hidden"
        );

        toast.style.display =
          "none";

      },
      3000
    );


    return;

  }


  console.log(
    "[Laporan] " + message
  );

}


/* =========================================================
   MONEY
========================================================= */

function setMoney(
  ids,
  value
) {

  ids.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (element) {

        element.textContent =
          formatMoney(value);

        applyNumberColor(
          element,
          value
        );

      }

    }
  );

}


function setNumber(
  ids,
  value
) {

  ids.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (element) {

        element.textContent =
          formatNumber(value);

      }

    }
  );

}


function setPercent(
  ids,
  value
) {

  ids.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (element) {

        element.textContent =
          formatNumber(value) +
          "%";

      }

    }
  );

}


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(value) {

  const number =
    getNumber(value);


  const sign =
    number < 0
      ? "-"
      : "";


  return (
    sign +
    "Rp" +
    Math.abs(number)
      .toLocaleString(
        "id-ID"
      )
  );

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(value) {

  return getNumber(value)
    .toLocaleString(
      "id-ID",
      {
        maximumFractionDigits: 2
      }
    );

}


/* =========================================================
   NUMBER
========================================================= */

function getNumber(value) {

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


  let string =
    String(value)
      .trim();


  /*
   * Hapus Rp dan karakter lain.
   */

  string =
    string.replace(
      /Rp/gi,
      ""
    )
    .replace(
      /\s/g,
      ""
    );


  /*
   * Format Indonesia:
   * 1.500.000
   */

  if (
    string.includes(".") &&
    !string.includes(",")
  ) {

    string =
      string.replace(
        /\./g,
        ""
      );

  }


  /*
   * Format:
   * 1.500.000,50
   */

  if (
    string.includes(",")
  ) {

    string =
      string
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );

  }


  string =
    string.replace(
      /[^\d.-]/g,
      ""
    );


  const result =
    Number(string);


  return Number.isFinite(result)
    ? result
    : 0;

}


function getNumberFromObject(
  object,
  keys
) {

  for (
    let i = 0;
    i < keys.length;
    i++
  ) {

    const key =
      keys[i];


    if (
      object &&
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {

      return getNumber(
        object[key]
      );

    }

  }


  return 0;

}


/* =========================================================
   GET VALUE
========================================================= */

function getTransactionValue(
  object,
  keys
) {

  if (!object) {

    return "";

  }


  for (
    let i = 0;
    i < keys.length;
    i++
  ) {

    const key =
      keys[i];


    if (
      object[key] !== undefined &&
      object[key] !== null
    ) {

      return String(
        object[key]
      ).trim();

    }

  }


  return "";

}


/* =========================================================
   DATE
========================================================= */

function formatDisplayDate(
  value
) {

  if (!value) {

    return "-";

  }


  const date =
    parseAnyDate(value);


  if (!date) {

    return String(value);

  }


  return (
    String(
      date.getDate()
    ).padStart(2, "0") +
    "/" +
    String(
      date.getMonth() + 1
    ).padStart(2, "0") +
    "/" +
    date.getFullYear()
  );

}


function normalizeDateForCompare(
  value
) {

  if (!value) {

    return "";

  }


  const date =
    parseAnyDate(value);


  if (!date) {

    return String(value)
      .substring(0, 10);

  }


  return (
    date.getFullYear() +
    "-" +
    String(
      date.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      date.getDate()
    ).padStart(2, "0")
  );

}


function parseAnyDate(
  value
) {

  if (
    value instanceof Date
  ) {

    return value;

  }


  const string =
    String(value)
      .trim();


  /*
   * yyyy-mm-dd
   */

  let match =
    string.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );


  if (match) {

    const date =
      new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      );


    if (
      !isNaN(
        date.getTime()
      )
    ) {

      return date;

    }

  }


  /*
   * dd/mm/yyyy
   */

  match =
    string.match(
      /^(\d{2})\/(\d{2})\/(\d{4})/
    );


  if (match) {

    const date =
      new Date(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1])
      );


    if (
      !isNaN(
        date.getTime()
      )
    ) {

      return date;

    }

  }


  /*
   * ISO timestamp.
   */

  const date =
    new Date(string);


  if (
    !isNaN(
      date.getTime()
    )
  ) {

    return date;

  }


  return null;

}


/* =========================================================
   TODAY
========================================================= */

function getTodayString() {

  const date =
    new Date();


  return (
    date.getFullYear() +
    "-" +
    String(
      date.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      date.getDate()
    ).padStart(2, "0")
  );

}


/* =========================================================
   CSS CLASS
========================================================= */

function getAksiClass(
  aksi
) {

  if (
    aksi === "BUY"
  ) {

    return "badge-buy";

  }


  if (
    aksi === "SELL"
  ) {

    return "badge-sell";

  }


  return "";

}


function getHasilClass(
  hasil
) {

  if (
    hasil === "PROFIT"
  ) {

    return "badge-profit";

  }


  if (
    hasil === "RUGI"
  ) {

    return "badge-rugi";

  }


  return "";

}


function getModalClass(
  jenis
) {

  if (
    jenis === "TAMBAH"
  ) {

    return "badge-profit";

  }


  if (
    jenis === "TARIK"
  ) {

    return "badge-rugi";

  }


  return "";

}


function applyNumberColor(
  element,
  value
) {

  const number =
    getNumber(value);


  element.classList.remove(
    "profit",
    "rugi",
    "positive",
    "negative"
  );


  if (
    number > 0
  ) {

    element.classList.add(
      "profit"
    );

  }


  else if (
    number < 0
  ) {

    element.classList.add(
      "rugi"
    );

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
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
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
  error
) {

  if (!error) {

    return "Terjadi kesalahan tidak diketahui.";

  }


  if (
    typeof error === "string"
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
   GLOBAL
========================================================= */

window.LaporanJournal = {

  load:
    loadLaporan,

  refresh:
    loadLaporan,

  render:
    renderAll,

  getData:
    function () {

      return laporanData;

    }

};


/* =========================================================
   DEBUG
========================================================= */

window.debugLaporan = function () {

  console.log(
    "===================================="
  );

  console.log(
    "LAPORAN JOURNAL DEBUG"
  );

  console.log(
    "Transaksi:",
    laporanData.transaksi
  );

  console.log(
    "Modal:",
    laporanData.modal
  );

  console.log(
    "Summary:",
    laporanData.summary
  );

  console.log(
    "TradingAPI:",
    window.TradingAPI
  );

  console.log(
    "===================================="
  );

};


console.log(
  "[Laporan] laporan.js loaded."
);
