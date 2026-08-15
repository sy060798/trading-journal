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

const REPORT_STATE = {

  data: {
    transaksi: [],
    modal: [],
    summary: {}
  },

  transaksi: [],

  modal: [],

  filter: {
    search: "",
    aksi: "",
    hasil: "",
    tanggalDari: "",
    tanggalSampai: ""
  },

  editingId: null,

  loading: false

};


/* =========================================================
   DOM HELPER
========================================================= */

function $(selector) {
  return document.querySelector(selector);
}


function $all(selector) {
  return Array.from(
    document.querySelectorAll(selector)
  );
}


/* =========================================================
   ELEMENT FINDER
========================================================= */

function findElement(...selectors) {

  for (const selector of selectors) {

    const element =
      document.querySelector(selector);

    if (element) {
      return element;
    }

  }

  return null;

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initLaporan();

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initLaporan() {

  try {

    setDefaultDateFilters();

    bindEvents();

    showPageLoading(
      true,
      "Memuat data laporan..."
    );

    await loadReportData();

  } catch (error) {

    console.error(
      "[Laporan] INIT ERROR:",
      error
    );

    showToast(
      "Gagal",
      getErrorMessage(error),
      "error"
    );

  } finally {

    showPageLoading(false);

  }

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadReportData() {

  if (
    typeof window.TradingAPI === "undefined"
  ) {

    throw new Error(
      "api.js belum dimuat. Pastikan api.js berada sebelum laporan.js."
    );

  }


  REPORT_STATE.loading = true;


  const result =
    await TradingAPI.getAllData();


  const data =
    result?.data ||
    result ||
    {};


  REPORT_STATE.data = {

    transaksi:
      Array.isArray(data.transaksi)
        ? data.transaksi
        : [],

    modal:
      Array.isArray(data.modal)
        ? data.modal
        : [],

    summary:
      data.summary || {}

  };


  REPORT_STATE.transaksi =
    REPORT_STATE.data.transaksi;


  REPORT_STATE.modal =
    REPORT_STATE.data.modal;


  renderAll();


  REPORT_STATE.loading = false;

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderSummary();

  renderTransactionCount();

  renderTransactionTable();

  renderModalTable();

  renderWinRate();

}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary() {

  const summary =
    REPORT_STATE.data.summary || {};


  const modal =
    toNumber(summary.modal);


  const totalProfit =
    toNumber(summary.totalProfit);


  const totalRugi =
    toNumber(summary.totalRugi);


  const netProfit =
    toNumber(summary.netProfit);


  const total =
    toNumber(summary.total);


  const totalTambah =
    toNumber(summary.totalTambah);


  const totalTarik =
    toNumber(summary.totalTarik);


  const modalAwal =
    toNumber(summary.modalAwal);


  setTextByIds(
    [
      "modalValue",
      "reportModalValue",
      "totalModal",
      "summaryModal"
    ],
    formatRupiah(modal)
  );


  setTextByIds(
    [
      "profitLossValue",
      "reportProfitLossValue",
      "netProfitValue",
      "summaryNetProfit"
    ],
    formatSignedRupiah(netProfit)
  );


  setTextByIds(
    [
      "totalValue",
      "reportTotalValue",
      "totalBalance",
      "summaryTotal"
    ],
    formatRupiah(total)
  );


  setTextByIds(
    [
      "totalProfitValue",
      "profitValue",
      "summaryProfit"
    ],
    formatRupiah(totalProfit)
  );


  setTextByIds(
    [
      "totalRugiValue",
      "lossValue",
      "summaryLoss"
    ],
    formatRupiah(totalRugi)
  );


  setTextByIds(
    [
      "totalTambahValue",
      "addCapitalValue",
      "summaryTambah"
    ],
    formatRupiah(totalTambah)
  );


  setTextByIds(
    [
      "totalTarikValue",
      "withdrawValue",
      "summaryTarik"
    ],
    formatRupiah(totalTarik)
  );


  setTextByIds(
    [
      "modalAwalValue",
      "summaryModalAwal"
    ],
    formatRupiah(modalAwal)
  );


  applyProfitLossClass(
    [
      "profitLossValue",
      "reportProfitLossValue",
      "netProfitValue",
      "summaryNetProfit"
    ],
    netProfit
  );

}


/* =========================================================
   WIN RATE
========================================================= */

function renderWinRate() {

  const summary =
    REPORT_STATE.data.summary || {};


  let winRate =
    toNumber(summary.winRate);


  if (
    !Number.isFinite(winRate)
  ) {

    winRate = 0;

  }


  setTextByIds(
    [
      "winRateValue",
      "reportWinRate",
      "summaryWinRate"
    ],
    winRate.toFixed(2) + "%"
  );


  setTextByIds(
    [
      "jumlahTransaksi",
      "transactionCount",
      "totalTransactions"
    ],
    String(
      toNumber(summary.jumlahTransaksi)
    )
  );


  setTextByIds(
    [
      "jumlahProfit",
      "profitCount"
    ],
    String(
      toNumber(summary.jumlahProfit)
    )
  );


  setTextByIds(
    [
      "jumlahRugi",
      "lossCount"
    ],
    String(
      toNumber(summary.jumlahRugi)
    )
  );

}


/* =========================================================
   TRANSACTION COUNT
========================================================= */

function renderTransactionCount() {

  const filtered =
    getFilteredTransactions();


  setTextByIds(
    [
      "transactionCountLabel",
      "filteredTransactionCount",
      "reportTransactionCount"
    ],
    `${filtered.length} transaksi`
  );

}


/* =========================================================
   FILTER TRANSACTIONS
========================================================= */

function getFilteredTransactions() {

  const filter =
    REPORT_STATE.filter;


  return REPORT_STATE.transaksi.filter(
    function (transaction) {

      const tanggal =
        getField(
          transaction,
          "Tanggal",
          "tanggal"
        );


      const saham =
        getField(
          transaction,
          "Saham",
          "saham"
        )
        .toUpperCase();


      const aksi =
        getField(
          transaction,
          "Aksi",
          "aksi"
        )
        .toUpperCase();


      const hasil =
        getField(
          transaction,
          "Profit/Rugi",
          "profitRugi",
          "hasil"
        )
        .toUpperCase();


      const search =
        filter.search
          .trim()
          .toLowerCase();


      if (
        search &&
        !(
          saham.toLowerCase().includes(search) ||
          aksi.toLowerCase().includes(search) ||
          hasil.toLowerCase().includes(search) ||
          getField(
            transaction,
            "Catatan",
            "catatan"
          )
            .toLowerCase()
            .includes(search)
        )
      ) {

        return false;

      }


      if (
        filter.aksi &&
        aksi !== filter.aksi
      ) {

        return false;

      }


      if (
        filter.hasil &&
        hasil !== filter.hasil
      ) {

        return false;

      }


      if (
        filter.tanggalDari &&
        normalizeDateForCompare(tanggal) <
        filter.tanggalDari
      ) {

        return false;

      }


      if (
        filter.tanggalSampai &&
        normalizeDateForCompare(tanggal) >
        filter.tanggalSampai
      ) {

        return false;

      }


      return true;

    }
  );

}


/* =========================================================
   RENDER TRANSACTION TABLE
========================================================= */

function renderTransactionTable() {

  const tableBody =
    findElement(
      "#transactionTableBody",
      "#reportTransactionTableBody",
      "#laporanTransactionTableBody",
      "#laporanTableBody"
    );


  const tableWrapper =
    findElement(
      "#transactionTableWrapper",
      "#reportTransactionTableWrapper",
      "#laporanTableWrapper"
    );


  const emptyState =
    findElement(
      "#transactionEmpty",
      "#reportTransactionEmpty",
      "#laporanEmpty"
    );


  const loading =
    findElement(
      "#transactionLoading",
      "#reportTransactionLoading",
      "#laporanLoading"
    );


  if (!tableBody) {

    console.warn(
      "[Laporan] Transaction table body tidak ditemukan."
    );

    return;

  }


  const transactions =
    getFilteredTransactions();


  tableBody.innerHTML = "";


  if (loading) {
    loading.classList.add("hidden");
  }


  if (transactions.length === 0) {

    if (tableWrapper) {
      tableWrapper.classList.add("hidden");
    }

    if (emptyState) {
      emptyState.classList.remove("hidden");
    }

    return;

  }


  if (emptyState) {
    emptyState.classList.add("hidden");
  }


  if (tableWrapper) {
    tableWrapper.classList.remove("hidden");
  }


  transactions.forEach(
    function (transaction) {

      const row =
        createTransactionRow(
          transaction
        );

      tableBody.appendChild(row);

    }
  );

}


/* =========================================================
   CREATE TRANSACTION ROW
========================================================= */

function createTransactionRow(
  transaction
) {

  const row =
    document.createElement("tr");


  const id =
    getField(
      transaction,
      "ID",
      "id"
    );


  const tanggal =
    getField(
      transaction,
      "Tanggal",
      "tanggal"
    );


  const saham =
    getField(
      transaction,
      "Saham",
      "saham"
    );


  const aksi =
    getField(
      transaction,
      "Aksi",
      "aksi"
    )
    .toUpperCase();


  const harga =
    toNumber(
      getField(
        transaction,
        "Harga",
        "harga"
      )
    );


  const lot =
    toNumber(
      getField(
        transaction,
        "Lot",
        "lot"
      )
    );


  const hasil =
    getField(
      transaction,
      "Profit/Rugi",
      "profitRugi",
      "hasil"
    )
    .toUpperCase();


  const nominal =
    toNumber(
      getField(
        transaction,
        "Nominal",
        "nominal"
      )
    );


  const catatan =
    getField(
      transaction,
      "Catatan",
      "catatan"
    );


  row.dataset.id = id;


  row.innerHTML = `

    <td>
      ${escapeHtml(
        formatTanggal(tanggal)
      )}
    </td>

    <td>
      <strong>
        ${escapeHtml(saham)}
      </strong>
    </td>

    <td>
      <span class="badge ${getActionClass(aksi)}">
        ${escapeHtml(aksi)}
      </span>
    </td>

    <td>
      ${formatNumber(harga)}
    </td>

    <td>
      ${formatNumber(lot)}
    </td>

    <td>
      ${
        hasil
          ? `
            <span class="badge ${getResultClass(hasil)}">
              ${escapeHtml(hasil)}
            </span>
          `
          : "-"
      }
    </td>

    <td class="${getResultTextClass(hasil)}">
      ${
        hasil
          ? formatSignedRupiah(
              hasil === "RUGI"
                ? -nominal
                : nominal
            )
          : "-"
      }
    </td>

  `;


  /*
   * Jika tabel memiliki kolom aksi,
   * tambahkan tombol edit/hapus.
   */

  addActionButtonsIfAvailable(
    row,
    transaction
  );


  /*
   * Tooltip catatan.
   */

  if (catatan) {

    row.title =
      "Catatan: " +
      catatan;

  }


  return row;

}


/* =========================================================
   ADD ACTION BUTTONS
========================================================= */

function addActionButtonsIfAvailable(
  row,
  transaction
) {

  const table =
    row.closest("table");


  if (!table) {
    return;
  }


  const headers =
    Array.from(
      table.querySelectorAll(
        "thead th"
      )
    );


  const actionIndex =
    headers.findIndex(
      function (th) {

        const text =
          th.textContent
            .trim()
            .toLowerCase();

        return (
          text.includes("aksi") &&
          (
            text.includes("tindakan") ||
            text.includes("action")
          )
        ) ||
        text === "aksi" &&
        headers.length >= 8;

      }
    );


  /*
   * Jangan membuat kolom baru.
   *
   * Hanya isi jika HTML memang
   * sudah menyediakan kolom Action.
   */

  if (
    actionIndex < 0
  ) {

    return;

  }


  const cells =
    row.querySelectorAll("td");


  if (
    !cells[actionIndex]
  ) {

    return;

  }


  const id =
    getField(
      transaction,
      "ID",
      "id"
    );


  cells[actionIndex].innerHTML = `

    <div class="row-actions">

      <button
        type="button"
        class="edit-button"
        data-edit-id="${escapeAttribute(id)}"
      >
        Edit
      </button>

      <button
        type="button"
        class="delete-button"
        data-delete-id="${escapeAttribute(id)}"
      >
        Hapus
      </button>

    </div>

  `;

}


/* =========================================================
   RENDER MODAL TABLE
========================================================= */

function renderModalTable() {

  const tableBody =
    findElement(
      "#modalTableBody",
      "#capitalTableBody",
      "#reportModalTableBody"
    );


  const tableWrapper =
    findElement(
      "#modalTableWrapper",
      "#capitalTableWrapper",
      "#reportModalTableWrapper"
    );


  const emptyState =
    findElement(
      "#modalEmpty",
      "#capitalEmpty",
      "#reportModalEmpty"
    );


  if (!tableBody) {

    return;

  }


  tableBody.innerHTML = "";


  const rows =
    REPORT_STATE.modal;


  if (
    rows.length === 0
  ) {

    if (tableWrapper) {
      tableWrapper.classList.add("hidden");
    }

    if (emptyState) {
      emptyState.classList.remove("hidden");
    }

    return;

  }


  if (emptyState) {
    emptyState.classList.add("hidden");
  }


  if (tableWrapper) {
    tableWrapper.classList.remove("hidden");
  }


  rows.forEach(
    function (item) {

      const row =
        document.createElement("tr");


      const id =
        getField(
          item,
          "ID",
          "id"
        );


      const tanggal =
        getField(
          item,
          "Tanggal",
          "tanggal"
        );


      const jenis =
        getField(
          item,
          "Jenis",
          "jenis"
        )
        .toUpperCase();


      const nominal =
        toNumber(
          getField(
            item,
            "Nominal",
            "nominal"
          )
        );


      const catatan =
        getField(
          item,
          "Catatan",
          "catatan"
        );


      row.dataset.id = id;


      row.innerHTML = `

        <td>
          ${escapeHtml(
            formatTanggal(tanggal)
          )}
        </td>

        <td>
          <span class="badge ${getModalClass(jenis)}">
            ${escapeHtml(jenis)}
          </span>
        </td>

        <td>
          ${formatRupiah(nominal)}
        </td>

        <td>
          ${escapeHtml(catatan || "-")}
        </td>

      `;


      tableBody.appendChild(row);

    }
  );

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

  /*
   * Search
   */

  const searchInput =
    findElement(
      "#searchInput",
      "#search",
      "#laporanSearch",
      "#transactionSearch"
    );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        REPORT_STATE.filter.search =
          this.value || "";

        renderTransactionTable();

        renderTransactionCount();

      }
    );

  }


  /*
   * Aksi filter
   */

  const aksiFilter =
    findElement(
      "#filterAksi",
      "#aksiFilter"
    );


  if (aksiFilter) {

    aksiFilter.addEventListener(
      "change",
      function () {

        REPORT_STATE.filter.aksi =
          String(
            this.value || ""
          )
          .toUpperCase();

        renderTransactionTable();

        renderTransactionCount();

      }
    );

  }


  /*
   * Hasil filter
   */

  const hasilFilter =
    findElement(
      "#filterHasil",
      "#hasilFilter",
      "#filterProfitRugi"
    );


  if (hasilFilter) {

    hasilFilter.addEventListener(
      "change",
      function () {

        REPORT_STATE.filter.hasil =
          String(
            this.value || ""
          )
          .toUpperCase();

        renderTransactionTable();

        renderTransactionCount();

      }
    );

  }


  /*
   * Tanggal dari
   */

  const dateFrom =
    findElement(
      "#tanggalDari",
      "#filterTanggalDari",
      "#dateFrom"
    );


  if (dateFrom) {

    dateFrom.addEventListener(
      "change",
      function () {

        REPORT_STATE.filter.tanggalDari =
          this.value || "";

        renderTransactionTable();

        renderTransactionCount();

      }
    );

  }


  /*
   * Tanggal sampai
   */

  const dateTo =
    findElement(
      "#tanggalSampai",
      "#filterTanggalSampai",
      "#dateTo"
    );


  if (dateTo) {

    dateTo.addEventListener(
      "change",
      function () {

        REPORT_STATE.filter.tanggalSampai =
          this.value || "";

        renderTransactionTable();

        renderTransactionCount();

      }
    );

  }


  /*
   * Reset filter
   */

  const resetButton =
    findElement(
      "#resetFilter",
      "#resetFilters",
      "#clearFilter"
    );


  if (resetButton) {

    resetButton.addEventListener(
      "click",
      resetFilters
    );

  }


  /*
   * Refresh
   */

  const refreshButton =
    findElement(
      "#refreshButton",
      "#refreshReport",
      "#reloadButton"
    );


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      async function () {

        try {

          showPageLoading(
            true,
            "Memuat ulang data..."
          );

          await loadReportData();

          showToast(
            "Berhasil",
            "Data laporan diperbarui.",
            "success"
          );

        } catch (error) {

          showToast(
            "Gagal",
            getErrorMessage(error),
            "error"
          );

        } finally {

          showPageLoading(false);

        }

      }
    );

  }


  /*
   * Export / print
   */

  const printButton =
    findElement(
      "#printButton",
      "#printReport",
      "#exportButton"
    );


  if (printButton) {

    printButton.addEventListener(
      "click",
      function () {

        window.print();

      }
    );

  }


  /*
   * Delegation tombol edit/hapus
   */

  document.addEventListener(
    "click",
    handleTableAction
  );

}


/* =========================================================
   TABLE ACTION
========================================================= */

async function handleTableAction(
  event
) {

  const editButton =
    event.target.closest(
      "[data-edit-id]"
    );


  if (editButton) {

    const id =
      editButton.dataset.editId;

    await editTransactionFromReport(
      id
    );

    return;

  }


  const deleteButton =
    event.target.closest(
      "[data-delete-id]"
    );


  if (deleteButton) {

    const id =
      deleteButton.dataset.deleteId;

    await deleteTransactionFromReport(
      id
    );

  }

}


/* =========================================================
   EDIT TRANSACTION
========================================================= */

async function editTransactionFromReport(
  id
) {

  const transaction =
    REPORT_STATE.transaksi.find(
      function (item) {

        return String(
          getField(
            item,
            "ID",
            "id"
          )
        ) === String(id);

      }
    );


  if (!transaction) {

    showToast(
      "Gagal",
      "Data transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  /*
   * Kalau halaman laporan punya modal edit,
   * gunakan modal tersebut.
   */

  const editModal =
    findElement(
      "#editTransactionModal",
      "#editModal"
    );


  if (editModal) {

    openEditModal(
      editModal,
      transaction
    );

    return;

  }


  /*
   * Kalau tidak ada modal edit,
   * arahkan ke index dengan ID.
   */

  try {

    sessionStorage.setItem(
      "trading_edit_transaction",
      JSON.stringify(transaction)
    );

  } catch (error) {

    console.warn(
      "[Laporan] Tidak bisa menyimpan session edit.",
      error
    );

  }


  window.location.href =
    "index.html?edit=" +
    encodeURIComponent(id);

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditModal(
  modal,
  transaction
) {

  REPORT_STATE.editingId =
    getField(
      transaction,
      "ID",
      "id"
    );


  const tanggal =
    getField(
      transaction,
      "Tanggal",
      "tanggal"
    );


  const saham =
    getField(
      transaction,
      "Saham",
      "saham"
    );


  const aksi =
    getField(
      transaction,
      "Aksi",
      "aksi"
    );


  const harga =
    getField(
      transaction,
      "Harga",
      "harga"
    );


  const lot =
    getField(
      transaction,
      "Lot",
      "lot"
    );


  const hasil =
    getField(
      transaction,
      "Profit/Rugi",
      "profitRugi",
      "hasil"
    );


  const nominal =
    getField(
      transaction,
      "Nominal",
      "nominal"
    );


  const catatan =
    getField(
      transaction,
      "Catatan",
      "catatan"
    );


  setInputValue(
    modal,
    [
      "#editTanggal",
      "#tanggalEdit"
    ],
    convertToInputDate(tanggal)
  );


  setInputValue(
    modal,
    [
      "#editSaham",
      "#sahamEdit"
    ],
    saham
  );


  setInputValue(
    modal,
    [
      "#editAksi",
      "#aksiEdit"
    ],
    aksi
  );


  setInputValue(
    modal,
    [
      "#editHarga",
      "#hargaEdit"
    ],
    harga
  );


  setInputValue(
    modal,
    [
      "#editLot",
      "#lotEdit"
    ],
    lot
  );


  setInputValue(
    modal,
    [
      "#editProfitRugi",
      "#editHasil",
      "#profitRugiEdit"
    ],
    hasil
  );


  setInputValue(
    modal,
    [
      "#editNominal",
      "#nominalEdit"
    ],
    nominal
  );


  setInputValue(
    modal,
    [
      "#editCatatan",
      "#catatanEdit"
    ],
    catatan
  );


  modal.classList.remove("hidden");

  modal.classList.add("active");

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTransactionFromReport(
  id
) {

  if (!id) {

    showToast(
      "Gagal",
      "ID transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  const transaction =
    REPORT_STATE.transaksi.find(
      function (item) {

        return String(
          getField(
            item,
            "ID",
            "id"
          )
        ) === String(id);

      }
    );


  const saham =
    transaction
      ? getField(
          transaction,
          "Saham",
          "saham"
        )
      : "";


  const confirmed =
    window.confirm(
      "Hapus transaksi " +
      (saham ? saham + "?" : "?") +
      "\n\nData akan dihapus permanen dari Google Sheets."
    );


  if (!confirmed) {
    return;
  }


  try {

    showPageLoading(
      true,
      "Menghapus transaksi..."
    );


    await TradingAPI.deleteTransaction(
      id
    );


    showToast(
      "Berhasil",
      "Transaksi berhasil dihapus.",
      "success"
    );


    await loadReportData();


  } catch (error) {

    console.error(
      "[Laporan] DELETE ERROR:",
      error
    );


    showToast(
      "Gagal",
      getErrorMessage(error),
      "error"
    );

  } finally {

    showPageLoading(false);

  }

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetFilters() {

  REPORT_STATE.filter = {

    search: "",

    aksi: "",

    hasil: "",

    tanggalDari: "",

    tanggalSampai: ""

  };


  const inputs = [

    "#searchInput",
    "#search",
    "#laporanSearch",
    "#transactionSearch",

    "#filterAksi",
    "#aksiFilter",

    "#filterHasil",
    "#hasilFilter",
    "#filterProfitRugi",

    "#tanggalDari",
    "#filterTanggalDari",
    "#dateFrom",

    "#tanggalSampai",
    "#filterTanggalSampai",
    "#dateTo"

  ];


  inputs.forEach(
    function (selector) {

      const element =
        document.querySelector(selector);

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


  renderTransactionTable();

  renderTransactionCount();

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDateFilters() {

  /*
   * Jangan otomatis memberi filter tanggal.
   *
   * Semua data Google Sheets harus tampil
   * ketika halaman pertama kali dibuka.
   */

  REPORT_STATE.filter.tanggalDari =
    "";

  REPORT_STATE.filter.tanggalSampai =
    "";

}


/* =========================================================
   INPUT HELPER
========================================================= */

function setInputValue(
  parent,
  selectors,
  value
) {

  for (const selector of selectors) {

    const element =
      parent.querySelector(selector);

    if (element) {

      element.value =
        value ?? "";

      return;

    }

  }

}


/* =========================================================
   DATE NORMALIZATION
========================================================= */

function normalizeDateForCompare(
  value
) {

  if (!value) {
    return "";
  }


  const stringValue =
    String(value)
      .trim();


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {

    return stringValue;

  }


  const match =
    stringValue.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (match) {

    return (
      match[3] +
      "-" +
      String(match[2]).padStart(2, "0") +
      "-" +
      String(match[1]).padStart(2, "0")
    );

  }


  const date =
    new Date(stringValue);


  if (
    !isNaN(
      date.getTime()
    )
  ) {

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


  return stringValue;

}


/* =========================================================
   CONVERT DATE FOR INPUT
========================================================= */

function convertToInputDate(
  value
) {

  return normalizeDateForCompare(
    value
  );

}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatTanggal(
  value
) {

  if (!value) {
    return "-";
  }


  const normalized =
    normalizeDateForCompare(value);


  const parts =
    normalized.split("-");


  if (
    parts.length === 3
  ) {

    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  return String(value);

}


/* =========================================================
   NUMBER
========================================================= */

function toNumber(
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


  let text =
    String(value)
      .trim();


  text =
    text.replace(
      /Rp/gi,
      ""
    );


  /*
   * Format Indonesia:
   * 1.500.000
   */

  if (
    text.includes(".") &&
    !text.includes(",")
  ) {

    text =
      text.replace(
        /\./g,
        ""
      );

  }


  text =
    text.replace(
      /,/g,
      ""
    );


  text =
    text.replace(
      /[^\d.-]/g,
      ""
    );


  const number =
    Number(text);


  return Number.isFinite(number)
    ? number
    : 0;

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
  value
) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    toNumber(value)
  );

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(
  value
) {

  return (
    "Rp" +
    formatNumber(value)
  );

}


/* =========================================================
   FORMAT SIGNED RUPIAH
========================================================= */

function formatSignedRupiah(
  value
) {

  const number =
    toNumber(value);


  if (number > 0) {

    return (
      "+" +
      formatRupiah(number)
    );

  }


  if (number < 0) {

    return (
      "-" +
      formatRupiah(
        Math.abs(number)
      )
    );

  }


  return "Rp0";

}


/* =========================================================
   GET FIELD
========================================================= */

function getField(
  object,
  ...keys
) {

  if (
    !object ||
    typeof object !== "object"
  ) {

    return "";

  }


  for (const key of keys) {

    if (
      Object.prototype.hasOwnProperty.call(
        object,
        key
      )
    ) {

      const value =
        object[key];


      if (
        value !== null &&
        value !== undefined
      ) {

        return String(value);

      }

    }

  }


  return "";

}


/* =========================================================
   ACTION CLASS
========================================================= */

function getActionClass(
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


/* =========================================================
   RESULT CLASS
========================================================= */

function getResultClass(
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

    return "badge-loss";

  }


  return "";

}


/* =========================================================
   RESULT TEXT CLASS
========================================================= */

function getResultTextClass(
  hasil
) {

  if (
    hasil === "PROFIT"
  ) {

    return "text-profit";

  }


  if (
    hasil === "RUGI"
  ) {

    return "text-loss";

  }


  return "";

}


/* =========================================================
   MODAL CLASS
========================================================= */

function getModalClass(
  jenis
) {

  if (
    jenis === "TAMBAH" ||
    jenis === "AWAL"
  ) {

    return "badge-profit";

  }


  if (
    jenis === "TARIK"
  ) {

    return "badge-loss";

  }


  return "";

}


/* =========================================================
   PROFIT / LOSS CLASS
========================================================= */

function applyProfitLossClass(
  ids,
  value
) {

  ids.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (!element) {
        return;
      }


      element.classList.remove(
        "profit",
        "loss",
        "positive",
        "negative",
        "text-profit",
        "text-loss"
      );


      if (
        value > 0
      ) {

        element.classList.add(
          "profit",
          "positive",
          "text-profit"
        );

      }


      if (
        value < 0
      ) {

        element.classList.add(
          "loss",
          "negative",
          "text-loss"
        );

      }

    }
  );

}


/* =========================================================
   SET TEXT BY IDS
========================================================= */

function setTextByIds(
  ids,
  value
) {

  ids.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (element) {

        element.textContent =
          value;

      }

    }
  );

}


/* =========================================================
   PAGE LOADING
========================================================= */

function showPageLoading(
  show,
  message = "Memuat..."
) {

  const loading =
    findElement(
      "#globalLoading",
      "#pageLoading",
      "#reportLoading"
    );


  const loadingText =
    findElement(
      "#globalLoadingText",
      "#pageLoadingText",
      "#reportLoadingText"
    );


  if (loadingText) {

    loadingText.textContent =
      message;

  }


  if (loading) {

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


  /*
   * Loading khusus tabel.
   * Pastikan tidak terus berputar setelah data selesai.
   */

  if (!show) {

    $all(
      ".loading-state"
    ).forEach(
      function (element) {

        element.classList.add(
          "hidden"
        );

      }
    );

  }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  title,
  message,
  type = "success"
) {

  const toast =
    $("#toast");


  if (!toast) {

    console.log(
      `[${type}] ${title}: ${message}`
    );

    return;

  }


  const toastTitle =
    $("#toastTitle");


  const toastMessage =
    $("#toastMessage");


  const toastIcon =
    $("#toastIcon");


  if (toastTitle) {

    toastTitle.textContent =
      title;

  }


  if (toastMessage) {

    toastMessage.textContent =
      message;

  }


  if (toastIcon) {

    toastIcon.textContent =
      type === "error"
        ? "!"
        : "✓";

  }


  toast.classList.remove(
    "hidden",
    "success",
    "error"
  );


  toast.classList.add(
    type
  );


  clearTimeout(
    window.__laporanToastTimer
  );


  window.__laporanToastTimer =
    setTimeout(
      function () {

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
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
  error
) {

  if (!error) {

    return "Terjadi kesalahan.";

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
   PUBLIC FUNCTIONS
========================================================= */

window.LaporanJournal = {

  reload:
    loadReportData,

  refresh:
    loadReportData,

  resetFilters:
    resetFilters,

  getData:
    function () {
      return REPORT_STATE.data;
    },

  getTransactions:
    function () {
      return REPORT_STATE.transaksi;
    },

  getModal:
    function () {
      return REPORT_STATE.modal;
    },

  getSummary:
    function () {
      return REPORT_STATE.data.summary;
    }

};


/* =========================================================
   DEBUG
========================================================= */

console.log(
  "[Laporan] laporan.js loaded."
);

console.log(
  "[Laporan] Real Google Sheets data mode."
);

console.log(
  "[Laporan] No dummy data."
);
