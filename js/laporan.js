/* =========================================================
   TRADING JOURNAL
   laporan.js
   FULL VERSION
   Cocok dengan laporan.html + api.js
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

const LaporanState = {

  transaksi: [],

  modal: [],

  summary: {

    modalAwal: 0,

    totalTambah: 0,

    totalTarik: 0,

    modal: 0,

    totalProfit: 0,

    totalRugi: 0,

    netProfit: 0,

    total: 0,

    jumlahTransaksi: 0,

    jumlahProfit: 0,

    jumlahRugi: 0,

    winRate: 0

  },

  loading: false,

  loaded: false,

  error: null

};


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {

  return document.getElementById(id);

}


/* =========================================================
   LOG
========================================================= */

function laporanLog() {

  console.log(
    "[Laporan]",
    ...arguments
  );

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(value) {

  const number =
    Number(value) || 0;


  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  ).format(number);

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(value) {

  const number =
    Number(value) || 0;


  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 0
    }
  ).format(number);

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


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
   DATE FORMAT
========================================================= */

function formatTanggal(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "-";

  }


  const stringValue =
    String(value).trim();


  /*
   * Jika sudah YYYY-MM-DD
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {

    const parts =
      stringValue.split("-");


    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  /*
   * Jika sudah DD/MM/YYYY
   */

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      stringValue
    )
  ) {

    return stringValue;

  }


  /*
   * Coba Date
   */

  const date =
    new Date(stringValue);


  if (
    !isNaN(
      date.getTime()
    )
  ) {

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


  return stringValue;

}


/* =========================================================
   NORMALIZE TRANSAKSI
========================================================= */

function normalizeTransaction(row) {

  if (
    !row ||
    typeof row !== "object"
  ) {

    return null;

  }


  return {

    ID:
      row.ID ??
      row.id ??
      "",

    Tanggal:
      row.Tanggal ??
      row.tanggal ??
      "",

    Saham:
      row.Saham ??
      row.saham ??
      "",

    Aksi:
      row.Aksi ??
      row.aksi ??
      "",

    Harga:
      Number(
        row.Harga ??
        row.harga ??
        0
      ),

    Lot:
      Number(
        row.Lot ??
        row.lot ??
        0
      ),

    "Profit/Rugi":
      row["Profit/Rugi"] ??
      row.profitRugi ??
      row.hasil ??
      "",

    Nominal:
      Number(
        row.Nominal ??
        row.nominal ??
        0
      ),

    Catatan:
      row.Catatan ??
      row.catatan ??
      "",

    Timestamp:
      row.Timestamp ??
      row.timestamp ??
      ""

  };

}


/* =========================================================
   NORMALIZE MODAL
========================================================= */

function normalizeModal(row) {

  if (
    !row ||
    typeof row !== "object"
  ) {

    return null;

  }


  return {

    ID:
      row.ID ??
      row.id ??
      "",

    Tanggal:
      row.Tanggal ??
      row.tanggal ??
      "",

    Jenis:
      row.Jenis ??
      row.jenis ??
      "",

    Nominal:
      Number(
        row.Nominal ??
        row.nominal ??
        0
      ),

    Catatan:
      row.Catatan ??
      row.catatan ??
      "",

    Timestamp:
      row.Timestamp ??
      row.timestamp ??
      ""

  };

}


/* =========================================================
   NORMALIZE SUMMARY
========================================================= */

function normalizeSummary(summary) {

  summary =
    summary || {};


  return {

    modalAwal:
      Number(
        summary.modalAwal
      ) || 0,

    totalTambah:
      Number(
        summary.totalTambah
      ) || 0,

    totalTarik:
      Number(
        summary.totalTarik
      ) || 0,

    modal:
      Number(
        summary.modal
      ) || 0,

    totalProfit:
      Number(
        summary.totalProfit
      ) || 0,

    totalRugi:
      Number(
        summary.totalRugi
      ) || 0,

    netProfit:
      Number(
        summary.netProfit
      ) || 0,

    total:
      Number(
        summary.total
      ) || 0,

    jumlahTransaksi:
      Number(
        summary.jumlahTransaksi
      ) || 0,

    jumlahProfit:
      Number(
        summary.jumlahProfit
      ) || 0,

    jumlahRugi:
      Number(
        summary.jumlahRugi
      ) || 0,

    winRate:
      Number(
        summary.winRate
      ) || 0

  };

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
    $("toast");


  if (!toast) {

    return;

  }


  const icon =
    $("toastIcon");


  const titleElement =
    $("toastTitle");


  const messageElement =
    $("toastMessage");


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
      3000
    );

}


/* =========================================================
   GLOBAL LOADING
========================================================= */

function setGlobalLoading(
  show,
  text = "Memuat..."
) {

  const loading =
    $("globalLoading");


  const loadingText =
    $("globalLoadingText");


  if (loadingText) {

    loadingText.textContent =
      text;

  }


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
   REPORT TRANSACTION LOADING
========================================================= */

function setTransactionLoading(
  loading
) {

  const element =
    $("reportTransactionLoading");


  if (!element) {

    return;

  }


  if (loading) {

    element.classList.remove(
      "hidden"
    );

  } else {

    element.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   REPORT MODAL LOADING
========================================================= */

function setModalLoading(
  loading
) {

  const element =
    $("reportModalLoading");


  if (!element) {

    return;

  }


  if (loading) {

    element.classList.remove(
      "hidden"
    );

  } else {

    element.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   HIDE TRANSACTION STATES
========================================================= */

function hideTransactionStates() {

  const empty =
    $("reportTransactionEmpty");


  const error =
    $("reportTransactionError");


  const wrapper =
    $("reportTransactionTableWrapper");


  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  if (error) {

    error.classList.add(
      "hidden"
    );

  }


  if (wrapper) {

    wrapper.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   HIDE MODAL STATES
========================================================= */

function hideModalStates() {

  const empty =
    $("reportModalEmpty");


  const wrapper =
    $("reportModalTableWrapper");


  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  if (wrapper) {

    wrapper.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   SHOW TRANSACTION ERROR
========================================================= */

function showTransactionError(
  message
) {

  setTransactionLoading(
    false
  );


  const empty =
    $("reportTransactionEmpty");


  const error =
    $("reportTransactionError");


  const wrapper =
    $("reportTransactionTableWrapper");


  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  if (wrapper) {

    wrapper.classList.add(
      "hidden"
    );

  }


  if (error) {

    error.classList.remove(
      "hidden"
    );

  }


  const messageElement =
    $("reportTransactionErrorMessage");


  if (messageElement) {

    messageElement.textContent =
      message ||
      "Tidak dapat mengambil data dari Google Sheets.";

  }

}


/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary() {

  const summary =
    LaporanState.summary;


  /*
   * Modal
   */

  const modalValue =
    $("reportModalValue");


  if (modalValue) {

    modalValue.textContent =
      formatRupiah(
        summary.modal
      );

  }


  /*
   * Profit
   */

  const profitValue =
    $("reportProfitValue");


  if (profitValue) {

    profitValue.textContent =
      formatRupiah(
        summary.totalProfit
      );

  }


  /*
   * Rugi
   */

  const lossValue =
    $("reportLossValue");


  if (lossValue) {

    lossValue.textContent =
      formatRupiah(
        summary.totalRugi
      );

  }


  /*
   * Net
   */

  const netValue =
    $("reportNetValue");


  if (netValue) {

    netValue.textContent =
      formatRupiah(
        summary.netProfit
      );


    netValue.classList.remove(
      "profit",
      "loss",
      "positive",
      "negative"
    );


    if (
      summary.netProfit > 0
    ) {

      netValue.classList.add(
        "profit"
      );

    }


    if (
      summary.netProfit < 0
    ) {

      netValue.classList.add(
        "loss"
      );

    }

  }


  /*
   * Net description
   */

  const netDescription =
    $("reportNetDescription");


  if (netDescription) {

    if (
      summary.netProfit > 0
    ) {

      netDescription.textContent =
        "Trading menghasilkan profit bersih.";

    }

    else if (
      summary.netProfit < 0
    ) {

      netDescription.textContent =
        "Trading mengalami rugi bersih.";

    }

    else {

      netDescription.textContent =
        "Belum ada hasil trading bersih.";

    }

  }


  /*
   * Statistik transaksi
   */

  const totalTransactions =
    $("reportTotalTransactions");


  if (totalTransactions) {

    totalTransactions.textContent =
      formatNumber(
        summary.jumlahTransaksi
      );

  }


  const profitCount =
    $("reportProfitCount");


  if (profitCount) {

    profitCount.textContent =
      formatNumber(
        summary.jumlahProfit
      );

  }


  const lossCount =
    $("reportLossCount");


  if (lossCount) {

    lossCount.textContent =
      formatNumber(
        summary.jumlahRugi
      );

  }


  const winRate =
    $("reportWinRate");


  if (winRate) {

    winRate.textContent =
      Number(
        summary.winRate || 0
      ).toFixed(2) +
      "%";

  }


  /*
   * Statistik modal
   */

  const initialCapital =
    $("reportInitialCapital");


  if (initialCapital) {

    initialCapital.textContent =
      formatRupiah(
        summary.modalAwal
      );

  }


  const totalAdded =
    $("reportTotalAdded");


  if (totalAdded) {

    totalAdded.textContent =
      formatRupiah(
        summary.totalTambah
      );

  }


  const totalWithdraw =
    $("reportTotalWithdraw");


  if (totalWithdraw) {

    totalWithdraw.textContent =
      formatRupiah(
        summary.totalTarik
      );

  }


  const currentCapital =
    $("reportCurrentCapital");


  if (currentCapital) {

    currentCapital.textContent =
      formatRupiah(
        summary.modal
      );

  }

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

  const body =
    $("reportTransactionTableBody");


  const wrapper =
    $("reportTransactionTableWrapper");


  const empty =
    $("reportTransactionEmpty");


  const countLabel =
    $("transactionCountLabel");


  if (!body) {

    console.error(
      "[Laporan] Element reportTransactionTableBody tidak ditemukan."
    );

    return;

  }


  /*
   * Bersihkan tabel.
   */

  body.innerHTML = "";


  const transactions =
    Array.isArray(
      LaporanState.transaksi
    )
      ? LaporanState.transaksi
      : [];


  if (countLabel) {

    countLabel.textContent =
      transactions.length +
      " DATA";

  }


  /*
   * Tidak ada data.
   */

  if (
    transactions.length === 0
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
   * Ada data.
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


  transactions.forEach(
    function(
      transaction,
      index
    ) {

      const row =
        document.createElement(
          "tr"
        );


      const hasil =
        String(
          transaction["Profit/Rugi"] ||
          ""
        )
        .trim()
        .toUpperCase();


      let hasilClass =
        "";


      if (
        hasil === "PROFIT"
      ) {

        hasilClass =
          "profit";

      }

      else if (
        hasil === "RUGI"
      ) {

        hasilClass =
          "loss";

      }


      const aksi =
        String(
          transaction.Aksi ||
          ""
        )
        .trim()
        .toUpperCase();


      const aksiClass =
        aksi === "BUY"
          ? "buy"
          : aksi === "SELL"
            ? "sell"
            : "";


      row.innerHTML = `

        <td>
          ${index + 1}
        </td>

        <td>
          ${escapeHtml(
            formatTanggal(
              transaction.Tanggal
            )
          )}
        </td>

        <td>
          <strong>
            ${escapeHtml(
              transaction.Saham
            )}
          </strong>
        </td>

        <td>
          <span class="badge ${aksiClass}">
            ${escapeHtml(
              aksi || "-"
            )}
          </span>
        </td>

        <td>
          ${formatNumber(
            transaction.Harga
          )}
        </td>

        <td>
          ${formatNumber(
            transaction.Lot
          )}
        </td>

        <td>
          <span class="${hasilClass}">
            ${escapeHtml(
              hasil || "-"
            )}
          </span>
        </td>

        <td>
          ${
            hasil
              ? formatRupiah(
                  transaction.Nominal
                )
              : "-"
          }
        </td>

        <td>
          ${escapeHtml(
            transaction.Catatan || "-"
          )}
        </td>

      `;


      body.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   RENDER MODAL
========================================================= */

function renderModalHistory() {

  const body =
    $("reportModalTableBody");


  const wrapper =
    $("reportModalTableWrapper");


  const empty =
    $("reportModalEmpty");


  const countLabel =
    $("modalCountLabel");


  if (!body) {

    console.error(
      "[Laporan] Element reportModalTableBody tidak ditemukan."
    );

    return;

  }


  body.innerHTML = "";


  const modal =
    Array.isArray(
      LaporanState.modal
    )
      ? LaporanState.modal
      : [];


  if (countLabel) {

    countLabel.textContent =
      modal.length +
      " DATA";

  }


  /*
   * Tidak ada riwayat modal.
   */

  if (
    modal.length === 0
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


  modal.forEach(
    function(
      item,
      index
    ) {

      const row =
        document.createElement(
          "tr"
        );


      const jenis =
        String(
          item.Jenis ||
          ""
        )
        .trim()
        .toUpperCase();


      const jenisClass =
        jenis === "TAMBAH"
          ? "profit"
          : jenis === "TARIK"
            ? "loss"
            : "";


      row.innerHTML = `

        <td>
          ${index + 1}
        </td>

        <td>
          ${escapeHtml(
            formatTanggal(
              item.Tanggal
            )
          )}
        </td>

        <td>
          <span class="${jenisClass}">
            ${escapeHtml(
              jenis || "-"
            )}
          </span>
        </td>

        <td>
          ${formatRupiah(
            item.Nominal
          )}
        </td>

        <td>
          ${escapeHtml(
            item.Catatan || "-"
          )}
        </td>

      `;


      body.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  laporanLog(
    "Render data..."
  );


  renderSummary();

  renderTransactions();

  renderModalHistory();


  LaporanState.loaded =
    true;


  LaporanState.loading =
    false;

}


/* =========================================================
   EXTRACT API DATA
========================================================= */

function extractApiData(
  response
) {

  /*
   * Response API kamu:
   *
   * {
   *   success: true,
   *   data: {
   *     transaksi: [],
   *     modal: [],
   *     summary: {}
   *   }
   * }
   */


  if (!response) {

    return {

      transaksi: [],

      modal: [],

      summary: {}

    };

  }


  const data =
    response.data &&
    typeof response.data === "object"
      ? response.data
      : response;


  const transaksiRaw =
    Array.isArray(
      data.transaksi
    )
      ? data.transaksi
      : Array.isArray(
          data.transactions
        )
        ? data.transactions
        : [];


  const modalRaw =
    Array.isArray(
      data.modal
    )
      ? data.modal
      : Array.isArray(
          data.capital
        )
        ? data.capital
        : [];


  const summary =
    data.summary &&
    typeof data.summary === "object"
      ? data.summary
      : {};


  return {

    transaksi:
      transaksiRaw
        .map(
          normalizeTransaction
        )
        .filter(
          Boolean
        ),

    modal:
      modalRaw
        .map(
          normalizeModal
        )
        .filter(
          Boolean
        ),

    summary:
      normalizeSummary(
        summary
      )

  };

}


/* =========================================================
   LOAD LAPORAN
========================================================= */

async function loadLaporan() {

  if (
    LaporanState.loading
  ) {

    laporanLog(
      "Request masih berjalan."
    );

    return;

  }


  LaporanState.loading =
    true;


  LaporanState.error =
    null;


  laporanLog(
    "Mengambil data Google Sheets..."
  );


  setTransactionLoading(
    true
  );


  setModalLoading(
    true
  );


  hideTransactionStates();

  hideModalStates();


  try {

    /*
     * Pastikan TradingAPI tersedia.
     */

    if (
      typeof window.TradingAPI ===
      "undefined"
    ) {

      throw new Error(
        "TradingAPI belum tersedia. Pastikan api.js dimuat sebelum laporan.js."
      );

    }


    if (
      typeof window.TradingAPI.getAllData !==
      "function"
    ) {

      throw new Error(
        "TradingAPI.getAllData tidak tersedia."
      );

    }


    const response =
      await window.TradingAPI.getAllData();


    laporanLog(
      "API response:",
      response
    );


    if (
      response &&
      response.success === false
    ) {

      throw new Error(
        response.message ||
        "API mengembalikan error."
      );

    }


    const data =
      extractApiData(
        response
      );


    laporanLog(
      "Data transaksi:",
      data.transaksi
    );


    laporanLog(
      "Data modal:",
      data.modal
    );


    laporanLog(
      "Summary:",
      data.summary
    );


    /*
     * Simpan ke state.
     */

    LaporanState.transaksi =
      data.transaksi;


    LaporanState.modal =
      data.modal;


    LaporanState.summary =
      data.summary;


    /*
     * Render.
     */

    renderAll();


    /*
     * Sembunyikan loading.
     */

    setTransactionLoading(
      false
    );


    setModalLoading(
      false
    );


    laporanLog(
      "Data berhasil dimuat."
    );


  } catch (error) {

    console.error(
      "[Laporan] Gagal memuat:",
      error
    );


    LaporanState.error =
      error;


    LaporanState.loading =
      false;


    setTransactionLoading(
      false
    );


    setModalLoading(
      false
    );


    /*
     * Summary tetap dirender.
     */

    renderSummary();


    /*
     * Tampilkan error transaksi.
     */

    showTransactionError(
      error?.message ||
      "Gagal mengambil data."
    );


    /*
     * Modal kosong/error.
     */

    const modalEmpty =
      $("reportModalEmpty");


    if (modalEmpty) {

      modalEmpty.classList.remove(
        "hidden"
      );

    }


    showToast(
      "Gagal",
      error?.message ||
      "Gagal memuat laporan.",
      "error"
    );

  }

}


/* =========================================================
   REFRESH
========================================================= */

async function refreshLaporan() {

  laporanLog(
    "Refresh data..."
  );


  const button =
    $("refreshReportButton");


  if (button) {

    button.disabled =
      true;

  }


  try {

    await loadLaporan();

  } finally {

    if (button) {

      button.disabled =
        false;

    }

  }

}


/* =========================================================
   RETRY
========================================================= */

async function retryLaporan() {

  laporanLog(
    "Mencoba memuat ulang..."
  );


  await loadLaporan();

}


/* =========================================================
   BIND EVENTS
========================================================= */

function bindLaporanEvents() {

  const refreshButton =
    $("refreshReportButton");


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      function () {

        refreshLaporan();

      }
    );

  }


  const retryButton =
    $("retryReportButton");


  if (retryButton) {

    retryButton.addEventListener(
      "click",
      function () {

        retryLaporan();

      }
    );

  }


  /*
   * Jika toast diklik,
   * tutup toast.
   */

  const toast =
    $("toast");


  if (toast) {

    toast.addEventListener(
      "click",
      function () {

        toast.classList.add(
          "hidden"
        );

      }
    );

  }

}


/* =========================================================
   CHECK DOM
========================================================= */

function checkLaporanDom() {

  const requiredIds = [

    "reportModalValue",

    "reportProfitValue",

    "reportLossValue",

    "reportNetValue",

    "reportTotalTransactions",

    "reportProfitCount",

    "reportLossCount",

    "reportWinRate",

    "reportInitialCapital",

    "reportTotalAdded",

    "reportTotalWithdraw",

    "reportCurrentCapital",

    "reportTransactionLoading",

    "reportTransactionEmpty",

    "reportTransactionError",

    "reportTransactionTableWrapper",

    "reportTransactionTableBody",

    "reportModalLoading",

    "reportModalEmpty",

    "reportModalTableWrapper",

    "reportModalTableBody"

  ];


  const missing = [];


  requiredIds.forEach(
    function(id) {

      if (!$(
        id
      )) {

        missing.push(
          id
        );

      }

    }
  );


  if (
    missing.length > 0
  ) {

    console.warn(
      "[Laporan] Element HTML tidak ditemukan:",
      missing
    );

    return false;

  }


  laporanLog(
    "Semua element HTML ditemukan."
  );


  return true;

}


/* =========================================================
   INIT
========================================================= */

async function initLaporan() {

  laporanLog(
    "Memulai..."
  );


  checkLaporanDom();


  bindLaporanEvents();


  /*
   * Load pertama.
   */

  await loadLaporan();

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.LaporanApp = {

  state:
    LaporanState,

  load:
    loadLaporan,

  refresh:
    refreshLaporan,

  retry:
    retryLaporan,

  render:
    renderAll,

  renderSummary:
    renderSummary,

  renderTransactions:
    renderTransactions,

  renderModal:
    renderModalHistory

};


/* =========================================================
   DOM READY
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initLaporan
  );

} else {

  initLaporan();

}


/* =========================================================
   LOG
========================================================= */

console.log(
  "[Laporan] laporan.js loaded."
);
