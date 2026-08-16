/* =========================================================
   TRADING JOURNAL
   js/trading.js

   FULL UPDATE / CLEAN VERSION

   FITUR:
   - Load data
   - Summary
   - Tabel transaksi
   - Tambah transaksi
   - Edit transaksi
   - Delete transaksi
   - Batal edit
   - Tambah modal
   - Tarik modal
   - Refresh
   - Modal
   - Loading
   - Toast
   - Profit / Rugi
   - Default tanggal
   - Keyboard ESC
   - Backdrop modal
   - Toolbar / tombol lama
   - Kompatibel API updateTransaction(id, data)
   - Kompatibel API updateTransaction(data)

   CATATAN:
   - Tidak ada dummy data.
   - Tidak membuat ID transaksi palsu.
   - Hanya menggunakan ID yang diberikan API/backend.
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

const TradingState = {

  transaksi: [],

  modal: [],

  summary: {},

  editingTransactionId: null,

  loading: false,

  initialized: false

};


let toastTimer = null;


/* =========================================================
   DOM HELPER
========================================================= */

function el(id) {

  return document.getElementById(id);

}


/* =========================================================
   SAFE TEXT
========================================================= */

function setText(
  id,
  value
) {

  const element =
    el(id);

  if (element) {

    element.textContent =
      value ?? "";

  }

}


/* =========================================================
   INPUT VALUE
========================================================= */

function setInputValue(
  id,
  value
) {

  const input =
    el(id);

  if (input) {

    input.value =
      value ?? "";

  }

}


function getInputValue(
  id
) {

  const input =
    el(id);

  return input
    ? String(input.value ?? "").trim()
    : "";

}


function getInputNumber(
  id
) {

  const input =
    el(id);

  if (!input) {

    return 0;

  }


  const raw =
    String(
      input.value ?? ""
    )
    .replace(
      /\./g,
      ""
    )
    .replace(
      /,/g,
      "."
    );


  const number =
    Number(raw);


  return Number.isFinite(number)
    ? number
    : 0;

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


  const text =
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
   * Support:
   * 1.500.000
   * 1500000
   * 1500000.50
   */

  let normalized =
    text;


  if (
    text.includes(".") &&
    text.includes(",")
  ) {

    normalized =
      text
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );

  } else if (
    /^\d{1,3}(\.\d{3})+$/.test(
      text
    )
  ) {

    normalized =
      text.replace(
        /\./g,
        ""
      );

  } else {

    normalized =
      text.replace(
        /,/g,
        "."
      );

  }


  const number =
    Number(normalized);


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

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  ).format(
    toNumber(value)
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


  return (
    error.message ||
    error.error ||
    error.details ||
    "Terjadi kesalahan."
  );

}


/* =========================================================
   TODAY
========================================================= */

function getTodayString() {

  const now =
    new Date();


  return (
    now.getFullYear() +
    "-" +
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    ) +
    "-" +
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    )
  );

}


/* Alias versi lama */

function todayString() {

  return getTodayString();

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDisplayDate(
  value
) {

  if (!value) {

    return "-";

  }


  const text =
    String(value).trim();


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {

    const parts =
      text.split("-");


    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  const date =
    new Date(text);


  if (
    !Number.isNaN(
      date.getTime()
    )
  ) {

    return new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    ).format(date);

  }


  return text;

}


/* Alias lama */

function formatTanggal(
  value
) {

  return formatDisplayDate(
    value
  );

}


/* =========================================================
   DATE FOR INPUT
========================================================= */

function convertDateForInput(
  value
) {

  if (!value) {

    return "";

  }


  const text =
    String(value).trim();


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {

    return text;

  }


  const ddmmyyyy =
    text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );


  if (ddmmyyyy) {

    return (
      ddmmyyyy[3] +
      "-" +
      ddmmyyyy[2] +
      "-" +
      ddmmyyyy[1]
    );

  }


  const date =
    new Date(text);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return (
    date.getFullYear() +
    "-" +
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    ) +
    "-" +
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    )
  );

}


/* =========================================================
   DEFAULT DATES
========================================================= */

function setupDefaultDates() {

  const today =
    getTodayString();


  const tanggal =
    el("tanggal");


  const addTanggal =
    el("addModalTanggal");


  const withdrawTanggal =
    el("withdrawModalTanggal");


  if (
    tanggal &&
    !tanggal.value
  ) {

    tanggal.value =
      today;

  }


  if (
    addTanggal &&
    !addTanggal.value
  ) {

    addTanggal.value =
      today;

  }


  if (
    withdrawTanggal &&
    !withdrawTanggal.value
  ) {

    withdrawTanggal.value =
      today;

  }

}


/* Alias lama */

function setDefaultDates() {

  setupDefaultDates();

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = "success",
  title = ""
) {

  const toast =
    el("toast");


  if (!title) {

    title =
      type === "error"
        ? "Gagal"
        : type === "warning"
          ? "Peringatan"
          : "Berhasil";

  }


  if (!toast) {

    console.log(
      `[Trading] ${title}:`,
      message
    );

    return;

  }


  const icon =
    el("toastIcon");


  const titleElement =
    el("toastTitle");


  const messageElement =
    el("toastMessage");


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
        : type === "warning"
          ? "!"
          : "✓";

  }


  toast.classList.remove(
    "hidden",
    "success",
    "error",
    "warning",
    "toast-success",
    "toast-error"
  );


  toast.classList.add(
    type
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      function() {

        toast.classList.add(
          "hidden"
        );

      },
      3500
    );

}


function hideToast() {

  const toast =
    el("toast");


  if (toast) {

    toast.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(
  message = "Memproses..."
) {

  const loading =
    el("globalLoading");


  const text =
    el("globalLoadingText");


  if (text) {

    text.textContent =
      message;

  }


  if (loading) {

    loading.classList.remove(
      "hidden"
    );

  }


  TradingState.loading =
    true;

}


function hideLoading() {

  const loading =
    el("globalLoading");


  if (loading) {

    loading.classList.add(
      "hidden"
    );

  }


  TradingState.loading =
    false;

}


/* Alias kompatibilitas */

function setLoading(
  isLoading,
  message = "Memproses..."
) {

  if (isLoading) {

    showLoading(
      message
    );

  } else {

    hideLoading();

  }

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
  button,
  loading,
  text
) {

  if (!button) {

    return;

  }


  if (loading) {

    button.dataset.originalText =
      button.textContent;


    button.disabled =
      true;


    button.classList.add(
      "loading"
    );


    const span =
      button.querySelector(
        "span"
      );


    if (span) {

      span.textContent =
        text;

    } else {

      button.textContent =
        text;

    }

    return;

  }


  button.disabled =
    false;


  button.classList.remove(
    "loading"
  );


  const span =
    button.querySelector(
      "span"
    );


  if (span) {

    span.textContent =
      text;

  } else {

    button.textContent =
      text;

  }

}


/* =========================================================
   MODAL
========================================================= */

function openModal(
  id
) {

  const modal =
    el(id);


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "hidden"
  );


  document.body.classList.add(
    "modal-open"
  );

}


function closeModal(
  id
) {

  const modal =
    el(id);


  if (!modal) {

    return;

  }


  modal.classList.add(
    "hidden"
  );


  const openModals =
    document.querySelectorAll(
      ".modal-overlay:not(.hidden)"
    );


  if (
    openModals.length === 0
  ) {

    document.body.classList.remove(
      "modal-open"
    );

  }

}


function closeAllModals() {

  document
    .querySelectorAll(
      ".modal-overlay"
    )
    .forEach(
      function(modal) {

        modal.classList.add(
          "hidden"
        );

      }
    );


  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   NORMALIZE TRANSACTION
========================================================= */

function normalizeTransaction(
  row
) {

  if (
    !row ||
    typeof row !== "object"
  ) {

    return {};

  }


  /*
   * PENTING:
   * Cari ID dari berbagai kemungkinan
   * nama kolom backend / Google Sheets.
   */

  const id =
    row.ID ??
    row.id ??
    row.Id ??
    row.ID_Transaksi ??
    row.idTransaksi ??
    row["ID Transaksi"] ??
    row["Id Transaksi"] ??
    row["ID transaksi"] ??
    row.transactionId ??
    row.transactionID ??
    "";


  return {

    id:
      id,


    tanggal:
      row.Tanggal ??
      row.tanggal ??
      row.Date ??
      row.date ??
      "",


    saham:
      row.Saham ??
      row.saham ??
      row.Symbol ??
      row.symbol ??
      "",


    aksi:
      row.Aksi ??
      row.aksi ??
      row.Action ??
      row.action ??
      "",


    harga:
      row.Harga ??
      row.harga ??
      row.Price ??
      row.price ??
      0,


    lot:
      row.Lot ??
      row.lot ??
      0,


    profitRugi:
      row["Profit/Rugi"] ??
      row.profitRugi ??
      row["Profit Rugi"] ??
      row.profit_loss ??
      row.hasil ??
      "",


    nominal:
      row.Nominal ??
      row.nominal ??
      row.Amount ??
      row.amount ??
      0,


    catatan:
      row.Catatan ??
      row.catatan ??
      row.Note ??
      row.note ??
      "",


    timestamp:
      row.Timestamp ??
      row.timestamp ??
      ""

  };

}


/* Alias lama */

function normalizeRow(
  row
) {

  return normalizeTransaction(
    row
  );

}


/* =========================================================
   GET TRANSACTION ID
========================================================= */

function getTransactionId(
  row
) {

  return normalizeTransaction(
    row
  ).id;

}


/* =========================================================
   GET FIELD
========================================================= */

function getField(
  row,
  primary,
  secondary
) {

  if (!row) {

    return "";

  }


  return (
    row[primary] ??
    row[secondary] ??
    ""
  );

}


/* =========================================================
   EXTRACT TRANSACTIONS
========================================================= */

function extractTransactions(
  result
) {

  const data =
    result?.data &&
    typeof result.data === "object"
      ? result.data
      : result || {};


  if (
    Array.isArray(
      data.transaksi
    )
  ) {

    return data.transaksi;

  }


  if (
    Array.isArray(
      data.transactions
    )
  ) {

    return data.transactions;

  }


  if (
    Array.isArray(
      data.transaction
    )
  ) {

    return data.transaction;

  }


  return [];

}


/* =========================================================
   EXTRACT DATA
========================================================= */

function extractData(
  result
) {

  if (
    result?.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
  ) {

    return result.data;

  }


  return result || {};

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadTradingData() {

  setLoading(
    true,
    "Memuat data trading..."
  );


  try {

    const result =
      await TradingAPI.getAllData();


    const data =
      extractData(
        result
      );


    const transaksi =
      extractTransactions(
        result
      );


    TradingState.transaksi =
      transaksi;


    TradingState.modal =
      Array.isArray(
        data.modal
      )
        ? data.modal
        : [];


    TradingState.summary =
      data.summary &&
      typeof data.summary === "object"
        ? data.summary
        : {};


    renderSummary(
      TradingState.summary
    );


    renderTransactions(
      TradingState.transaksi
    );


    console.log(
      "[Trading] Data loaded:",
      {
        transaksi:
          TradingState.transaksi.length,

        summary:
          TradingState.summary
      }
    );


    return result;

  } catch (error) {

    console.error(
      "[Trading] Load error:",
      error
    );


    TradingState.transaksi =
      [];


    TradingState.modal =
      [];


    TradingState.summary =
      {};


    renderSummary(
      {}
    );


    renderTransactions(
      []
    );


    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );


    throw error;

  } finally {

    setLoading(
      false
    );

  }

}


/* Alias lama */

async function loadTransactions() {

  return loadTradingData();

}


/* =========================================================
   REFRESH
========================================================= */

async function refreshTradingData() {

  try {

    showLoading(
      "Memuat data terbaru..."
    );


    await loadTradingData();

  } catch (error) {

    console.error(
      "[Trading] Refresh error:",
      error
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary(
  summary = {}
) {

  const modal =
    toNumber(
      summary.modal
    );


  const netProfit =
    toNumber(
      summary.netProfit
    );


  const total =
    Number.isFinite(
      Number(
        summary.total
      )
    ) &&
    summary.total !== ""
      ? toNumber(
          summary.total
        )
      : modal + netProfit;


  setText(
    "modalValue",
    formatRupiah(
      modal
    )
  );


  setText(
    "profitLossValue",
    formatRupiah(
      netProfit
    )
  );


  setText(
    "totalValue",
    formatRupiah(
      total
    )
  );


  const description =
    el(
      "profitLossDescription"
    );


  if (description) {

    if (
      netProfit > 0
    ) {

      description.textContent =
        "Net profit";

    } else if (
      netProfit < 0
    ) {

      description.textContent =
        "Net loss";

    } else {

      description.textContent =
        "Net hasil trading";

    }

  }


  const icon =
    el(
      "profitIcon"
    );


  if (icon) {

    icon.classList.remove(
      "profit-positive",
      "profit-negative",
      "positive",
      "negative"
    );


    if (
      netProfit > 0
    ) {

      icon.textContent =
        "↗";


      icon.classList.add(
        "profit-positive"
      );

    } else if (
      netProfit < 0
    ) {

      icon.textContent =
        "↘";


      icon.classList.add(
        "profit-negative"
      );

    } else {

      icon.textContent =
        "→";

    }

  }


  const value =
    el(
      "profitLossValue"
    );


  if (value) {

    value.classList.remove(
      "profit-positive",
      "profit-negative",
      "positive",
      "negative"
    );


    if (
      netProfit > 0
    ) {

      value.classList.add(
        "profit-positive",
        "positive"
      );

    }


    if (
      netProfit < 0
    ) {

      value.classList.add(
        "profit-negative",
        "negative"
      );

    }

  }

}


/* =========================================================
   RESULT BADGE
========================================================= */

function createResultBadge(
  hasil
) {

  const value =
    String(
      hasil || ""
    )
    .trim()
    .toUpperCase();


  if (!value) {

    return `
      <span class="result-badge">
        -
      </span>
    `;

  }


  if (
    value === "PROFIT"
  ) {

    return `
      <span class="result-badge result-profit profit">
        PROFIT
      </span>
    `;

  }


  if (
    value === "RUGI"
  ) {

    return `
      <span class="result-badge result-loss loss">
        RUGI
      </span>
    `;

  }


  return `
    <span class="result-badge">
      ${escapeHtml(value)}
    </span>
  `;

}


/* =========================================================
   ACTION CLASS
========================================================= */

function getActionClass(
  aksi
) {

  const value =
    String(
      aksi || ""
    )
    .trim()
    .toUpperCase();


  if (
    value === "BUY"
  ) {

    return "action-buy buy";

  }


  if (
    value === "SELL"
  ) {

    return "action-sell sell";

  }


  return "";

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions(
  transactions = TradingState.transaksi
) {

  const tbody =
    el(
      "transactionTableBody"
    );


  const empty =
    el(
      "transactionEmpty"
    );


  const wrapper =
    el(
      "transactionTableWrapper"
    );


  const loading =
    el(
      "transactionLoading"
    );


  if (!tbody) {

    console.warn(
      "[Trading] transactionTableBody tidak ditemukan."
    );

    return;

  }


  tbody.innerHTML =
    "";


  if (loading) {

    loading.classList.add(
      "hidden"
    );

  }


  if (
    !Array.isArray(
      transactions
    ) ||
    transactions.length === 0
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


  /*
   * Simpan state asli.
   */

  TradingState.transaksi =
    transactions;


  /*
   * Transaksi terbaru di atas.
   */

  const recent =
    transactions
      .slice()
      .reverse()
      .slice(
        0,
        10
      );


  recent.forEach(
    function(raw) {

      const row =
        normalizeTransaction(
          raw
        );


      const transactionId =
        String(
          row.id ?? ""
        ).trim();


      const aksi =
        String(
          row.aksi || ""
        )
        .trim()
        .toUpperCase();


      const hasil =
        String(
          row.profitRugi || ""
        )
        .trim()
        .toUpperCase();


      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>
          ${escapeHtml(
            formatDisplayDate(
              row.tanggal
            )
          )}
        </td>

        <td>
          <strong>
            ${escapeHtml(
              row.saham || "-"
            )}
          </strong>
        </td>

        <td>
          <span class="action-badge ${getActionClass(aksi)}">
            ${escapeHtml(
              aksi || "-"
            )}
          </span>
        </td>

        <td>
          ${formatNumber(
            row.harga
          )}
        </td>

        <td>
          ${formatNumber(
            row.lot
          )}
        </td>

        <td>
          ${createResultBadge(
            hasil
          )}
        </td>

        <td>
          ${
            hasil
              ? formatRupiah(
                  row.nominal
                )
              : "-"
          }
        </td>

        <td class="transaction-actions-cell">

          <button
            type="button"
            class="table-action-button table-action edit edit-transaction-button"
            data-action="edit"
            data-id="${escapeAttribute(
              transactionId
            )}"
            ${transactionId ? "" : "disabled"}
          >
            Edit
          </button>

          <button
            type="button"
            class="table-action-button table-action delete delete-transaction-button"
            data-action="delete"
            data-id="${escapeAttribute(
              transactionId
            )}"
            ${transactionId ? "" : "disabled"}
          >
            Hapus
          </button>

        </td>

      `;


      tbody.appendChild(
        tr
      );

    }
  );


  addActionHeaderIfNeeded();

}


/* =========================================================
   ACTION HEADER
========================================================= */

function addActionHeaderIfNeeded() {

  const table =
    document.querySelector(
      ".transaction-table"
    );


  if (!table) {

    return;

  }


  const headerRow =
    table.querySelector(
      "thead tr"
    );


  if (!headerRow) {

    return;

  }


  if (
    headerRow.querySelector(
      ".actions-header"
    )
  ) {

    return;

  }


  const th =
    document.createElement(
      "th"
    );


  th.className =
    "actions-header";


  th.textContent =
    "Aksi";


  headerRow.appendChild(
    th
  );

}


/* =========================================================
   TRANSACTION LOADING
========================================================= */

function setTransactionLoading(
  isLoading
) {

  const loading =
    el(
      "transactionLoading"
    );


  const empty =
    el(
      "transactionEmpty"
    );


  const table =
    el(
      "transactionTableWrapper"
    );


  if (isLoading) {

    if (loading) {

      loading.classList.remove(
        "hidden"
      );

    }


    if (empty) {

      empty.classList.add(
        "hidden"
      );

    }


    if (table) {

      table.classList.add(
        "hidden"
      );

    }

    return;

  }


  if (loading) {

    loading.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   FORM DATA
========================================================= */

function getTransactionFormData() {

  return {

    tanggal:
      getInputValue(
        "tanggal"
      ),


    saham:
      getInputValue(
        "saham"
      )
      .toUpperCase(),


    aksi:
      getInputValue(
        "aksi"
      )
      .toUpperCase(),


    harga:
      getInputNumber(
        "harga"
      ),


    lot:
      getInputNumber(
        "lot"
      ),


    profitRugi:
      getInputValue(
        "profitRugi"
      )
      .toUpperCase(),


    nominal:
      getInputNumber(
        "nominal"
      ),


    catatan:
      getInputValue(
        "catatan"
      )

  };

}


/* =========================================================
   CLEAR FORM
========================================================= */

function clearTransactionForm() {

  const form =
    el(
      "transactionForm"
    );


  if (form) {

    form.reset();

  }


  setInputValue(
    "tanggal",
    getTodayString()
  );


  setInputValue(
    "aksi",
    "BUY"
  );


  setInputValue(
    "profitRugi",
    ""
  );


  setInputValue(
    "nominal",
    ""
  );


  updateNominalVisibility();

}


/* Alias */

function resetTransactionForm() {

  clearTransactionForm();

}


/* =========================================================
   NOMINAL VISIBILITY
========================================================= */

function updateNominalVisibility() {

  const select =
    el(
      "profitRugi"
    );


  const group =
    el(
      "nominalGroup"
    );


  const nominal =
    el(
      "nominal"
    );


  if (
    !select ||
    !group
  ) {

    return;

  }


  const value =
    String(
      select.value || ""
    )
    .trim()
    .toUpperCase();


  const hasResult =
    value === "PROFIT" ||
    value === "RUGI";


  if (hasResult) {

    group.classList.remove(
      "hidden"
    );


    if (nominal) {

      nominal.required =
        true;

    }

  } else {

    group.classList.add(
      "hidden"
    );


    if (nominal) {

      nominal.required =
        false;

      /*
       * Hanya kosongkan saat bukan edit.
       */

      if (
        !TradingState.editingTransactionId
      ) {

        nominal.value =
          "";

      }

    }

  }

}


/*
 * Alias supaya kode lama yang masih memanggil
 * nama ini tidak error.
 *
 * Tidak perlu setupProfitField.
 */

function setupProfitField() {

  const field =
    el(
      "profitRugi"
    );


  if (!field) {

    return;

  }


  field.addEventListener(
    "change",
    updateNominalVisibility
  );


  updateNominalVisibility();

}


/* =========================================================
   EDIT MODE BUTTON
========================================================= */

function setTransactionEditMode(
  isEdit
) {

  const button =
    el(
      "saveTransactionButton"
    );


  if (!button) {

    return;

  }


  const text =
    isEdit
      ? "Update Transaksi"
      : "Simpan Transaksi";


  const span =
    button.querySelector(
      "span"
    );


  if (span) {

    span.textContent =
      text;

  } else {

    button.textContent =
      text;

  }


  updateCancelEditButton();

}


/* =========================================================
   CANCEL EDIT BUTTON
========================================================= */

function createCancelEditButton() {

  const form =
    el(
      "transactionForm"
    );


  const saveButton =
    el(
      "saveTransactionButton"
    );


  if (
    !form ||
    !saveButton
  ) {

    return;

  }


  if (
    el(
      "cancelEditButton"
    )
  ) {

    return;

  }


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.id =
    "cancelEditButton";


  button.className =
    "secondary-button";


  button.textContent =
    "Batal Edit";


  button.style.display =
    "none";


  button.addEventListener(
    "click",
    cancelEditTransaction
  );


  if (
    saveButton.parentNode
  ) {

    saveButton.parentNode.insertBefore(
      button,
      saveButton
    );

  }

}


function updateCancelEditButton() {

  const button =
    el(
      "cancelEditButton"
    );


  if (!button) {

    return;

  }


  button.style.display =
    TradingState.editingTransactionId
      ? "block"
      : "none";

}


/* =========================================================
   FIND TRANSACTION BY ID
========================================================= */

function findLocalTransactionById(
  id
) {

  const targetId =
    String(
      id ?? ""
    ).trim();


  if (!targetId) {

    return null;

  }


  return TradingState.transaksi.find(
    function(raw) {

      const row =
        normalizeTransaction(
          raw
        );


      return (
        String(
          row.id ?? ""
        ).trim() ===
        targetId
      );

    }
  ) || null;

}


/* =========================================================
   FIND TRANSACTION FROM SERVER
========================================================= */

async function findTransactionById(
  id
) {

  const targetId =
    String(
      id ?? ""
    ).trim();


  if (!targetId) {

    return null;

  }


  const local =
    findLocalTransactionById(
      targetId
    );


  if (local) {

    return normalizeTransaction(
      local
    );

  }


  const result =
    await TradingAPI.getAllData();


  const transactions =
    extractTransactions(
      result
    );


  return transactions
    .map(
      normalizeTransaction
    )
    .find(
      function(row) {

        return (
          String(
            row.id ?? ""
          ).trim() ===
          targetId
        );

      }
    ) || null;

}


/* =========================================================
   START EDIT
========================================================= */

async function startEditTransaction(
  id
) {

  const targetId =
    String(
      id ?? ""
    ).trim();


  if (!targetId) {

    showToast(
      "ID transaksi tidak ditemukan.",
      "error",
      "Gagal"
    );

    return;

  }


  try {

    showLoading(
      "Memuat transaksi..."
    );


    console.log(
      "[Trading] Start edit:",
      targetId
    );


    const row =
      await findTransactionById(
        targetId
      );


    if (!row) {

      throw new Error(
        "Transaksi tidak ditemukan."
      );

    }


    /*
     * ID HARUS berasal dari data API.
     * Tidak pernah dibuat/dummy.
     */

    const realId =
      String(
        row.id ?? ""
      ).trim();


    if (!realId) {

      throw new Error(
        "Transaksi ini tidak memiliki ID dari server. Data tidak akan diubah agar tidak salah transaksi."
      );

    }


    TradingState.editingTransactionId =
      realId;


    console.log(
      "[Trading] Editing ID:",
      TradingState.editingTransactionId
    );


    /*
     * Isi form.
     */

    setInputValue(
      "tanggal",
      convertDateForInput(
        row.tanggal
      )
    );


    setInputValue(
      "saham",
      row.saham
    );


    setInputValue(
      "aksi",
      row.aksi || "BUY"
    );


    setInputValue(
      "harga",
      row.harga
    );


    setInputValue(
      "lot",
      row.lot
    );


    setInputValue(
      "profitRugi",
      row.profitRugi
    );


    setInputValue(
      "nominal",
      row.nominal
    );


    setInputValue(
      "catatan",
      row.catatan
    );


    updateNominalVisibility();


    setTransactionEditMode(
      true
    );


    updateCancelEditButton();


    const form =
      el(
        "transactionForm"
      );


    if (form) {

      form.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }


    showToast(
      "Data transaksi dimuat untuk diedit.",
      "success",
      "Mode Edit"
    );

  } catch (error) {

    console.error(
      "[Trading] Edit error:",
      error
    );


    TradingState.editingTransactionId =
      null;


    setTransactionEditMode(
      false
    );


    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );

  } finally {

    hideLoading();

  }

}


/* Alias lama */

function handleEditTransaction(
  id
) {

  return startEditTransaction(
    id
  );

}


/* =========================================================
   CANCEL EDIT
========================================================= */

function cancelEditTransaction() {

  console.log(
    "[Trading] Cancel edit:",
    TradingState.editingTransactionId
  );


  TradingState.editingTransactionId =
    null;


  clearTransactionForm();


  setTransactionEditMode(
    false
  );


  updateCancelEditButton();


  showToast(
    "Edit transaksi dibatalkan.",
    "success",
    "Mode Edit"
  );

}


/* =========================================================
   UPDATE API COMPATIBILITY
========================================================= */

async function callUpdateTransaction(
  id,
  data
) {

  if (
    !window.TradingAPI ||
    typeof TradingAPI.updateTransaction !== "function"
  ) {

    throw new Error(
      "TradingAPI.updateTransaction tidak tersedia."
    );

  }


  const targetId =
    String(
      id ?? ""
    ).trim();


  if (!targetId) {

    throw new Error(
      "ID transaksi wajib untuk edit."
    );

  }


  /*
   * ID SELALU dimasukkan ke payload.
   *
   * Ini penting untuk api.js yang membaca:
   * data.id
   */

  const payload = {

    ...data,

    id:
      targetId

  };


  console.log(
    "[Trading] Final UPDATE payload:",
    payload
  );


  /*
   * Kompatibilitas dua kemungkinan API:
   *
   * updateTransaction(id, data)
   *
   * atau:
   *
   * updateTransaction(data)
   *
   * Kita cek jumlah parameter fungsi.
   */

  if (
    TradingAPI.updateTransaction.length >= 2
  ) {

    return TradingAPI.updateTransaction(
      targetId,
      payload
    );

  }


  return TradingAPI.updateTransaction(
    payload
  );

}


/* =========================================================
   SUBMIT TRANSACTION
========================================================= */

async function handleTransactionSubmit(
  event
) {

  if (event) {

    event.preventDefault();

  }


  const form =
    event?.currentTarget ||
    el(
      "transactionForm"
    );


  if (
    form &&
    typeof form.checkValidity === "function" &&
    !form.checkValidity()
  ) {

    form.reportValidity();

    return;

  }


  const button =
    el(
      "saveTransactionButton"
    );


  const isEdit =
    Boolean(
      TradingState.editingTransactionId
    );


  const data =
    getTransactionFormData();


  try {

    console.log(
      "[Trading] Save transaction:",
      {
        mode:
          isEdit
            ? "UPDATE"
            : "ADD",

        editingTransactionId:
          TradingState.editingTransactionId,

        data:
          data
      }
    );


    setButtonLoading(
      button,
      true,
      isEdit
        ? "Mengubah..."
        : "Menyimpan..."
    );


    showLoading(
      isEdit
        ? "Mengubah transaksi..."
        : "Menyimpan transaksi..."
    );


    let result;


    /* =====================================================
       UPDATE
    ===================================================== */

    if (isEdit) {

      const id =
        String(
          TradingState.editingTransactionId ?? ""
        ).trim();


      /*
       * STOP sebelum API jika ID kosong.
       */

      if (!id) {

        throw new Error(
          "ID transaksi wajib untuk edit."
        );

      }


      /*
       * ID masuk ke payload.
       */

      data.id =
        id;


      result =
        await callUpdateTransaction(
          id,
          data
        );


      console.log(
        "[Trading] Update success:",
        result
      );


      showToast(
        result?.message ||
        "Transaksi berhasil diperbarui.",
        "success",
        "Berhasil"
      );

    }


    /* =====================================================
       ADD
    ===================================================== */

    else {

      result =
        await TradingAPI.addTransaction(
          data
        );


      console.log(
        "[Trading] Add success:",
        result
      );


      showToast(
        result?.message ||
        "Transaksi berhasil disimpan.",
        "success",
        "Berhasil"
      );

    }


    /*
     * Reset edit hanya setelah API berhasil.
     */

    TradingState.editingTransactionId =
      null;


    clearTransactionForm();


    setTransactionEditMode(
      false
    );


    updateCancelEditButton();


    await loadTradingData();

  } catch (error) {

    console.error(
      "[Trading] Save transaction error:",
      error
    );


    /*
     * JANGAN menghapus editingTransactionId
     * ketika update gagal.
     *
     * Jadi user masih berada di mode edit
     * dan bisa mencoba lagi.
     */

    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );

  } finally {

    setButtonLoading(
      button,
      false,
      TradingState.editingTransactionId
        ? "Update Transaksi"
        : "Simpan Transaksi"
    );


    hideLoading();

  }

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function handleDeleteTransaction(
  id
) {

  const targetId =
    String(
      id ?? ""
    ).trim();


  if (!targetId) {

    showToast(
      "ID transaksi tidak ditemukan.",
      "error",
      "Gagal"
    );

    return;

  }


  const confirmed =
    window.confirm(
      "Hapus transaksi ini?\n\nData yang sudah dihapus tidak dapat dikembalikan."
    );


  if (!confirmed) {

    return;

  }


  try {

    showLoading(
      "Menghapus transaksi..."
    );


    console.log(
      "[Trading] Delete ID:",
      targetId
    );


    if (
      !TradingAPI ||
      typeof TradingAPI.deleteTransaction !== "function"
    ) {

      throw new Error(
        "TradingAPI.deleteTransaction tidak tersedia."
      );

    }


    const result =
      await TradingAPI.deleteTransaction(
        targetId
      );


    if (
      String(
        TradingState.editingTransactionId ?? ""
      ).trim() ===
      targetId
    ) {

      TradingState.editingTransactionId =
        null;


      clearTransactionForm();


      setTransactionEditMode(
        false
      );


      updateCancelEditButton();

    }


    await loadTradingData();


    showToast(
      result?.message ||
      "Transaksi berhasil dihapus.",
      "success",
      "Berhasil"
    );

  } catch (error) {

    console.error(
      "[Trading] Delete error:",
      error
    );


    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   TABLE ACTION
========================================================= */

function handleTableClick(
  event
) {

  const button =
    event.target.closest(
      "[data-action]"
    );


  if (!button) {

    return;

  }


  if (
    button.disabled
  ) {

    return;

  }


  const action =
    button.dataset.action;


  const id =
    button.dataset.id;


  console.log(
    "[Trading] Table action:",
    {
      action:
        action,

      id:
        id
    }
  );


  if (
    action === "edit"
  ) {

    startEditTransaction(
      id
    );

    return;

  }


  if (
    action === "delete"
  ) {

    handleDeleteTransaction(
      id
    );

  }

}


/* =========================================================
   ADD CAPITAL
========================================================= */

async function handleAddModalSubmit(
  event
) {

  event.preventDefault();


  const tanggal =
    getInputValue(
      "addModalTanggal"
    ) ||
    getTodayString();


  const nominal =
    getInputNumber(
      "addModalNominal"
    );


  const catatan =
    getInputValue(
      "addModalCatatan"
    );


  if (!tanggal) {

    showToast(
      "Tanggal modal wajib diisi.",
      "error"
    );

    return;

  }


  if (
    nominal <= 0
  ) {

    showToast(
      "Nominal tambah modal harus lebih dari 0.",
      "error"
    );

    return;

  }


  try {

    showLoading(
      "Menambahkan modal..."
    );


    if (
      typeof TradingAPI.addCapital !== "function"
    ) {

      throw new Error(
        "TradingAPI.addCapital tidak tersedia."
      );

    }


    const result =
      await TradingAPI.addCapital(
        nominal,
        catatan,
        tanggal
      );


    const form =
      el(
        "addModalForm"
      );


    if (form) {

      form.reset();

    }


    setInputValue(
      "addModalTanggal",
      getTodayString()
    );


    closeModal(
      "addModal"
    );


    await loadTradingData();


    showToast(
      result?.message ||
      "Modal berhasil ditambahkan.",
      "success",
      "Berhasil"
    );

  } catch (error) {

    console.error(
      "[Trading] Add capital error:",
      error
    );


    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   WITHDRAW CAPITAL
========================================================= */

async function handleWithdrawModalSubmit(
  event
) {

  event.preventDefault();


  const tanggal =
    getInputValue(
      "withdrawModalTanggal"
    ) ||
    getTodayString();


  const nominal =
    getInputNumber(
      "withdrawModalNominal"
    );


  const catatan =
    getInputValue(
      "withdrawModalCatatan"
    );


  if (!tanggal) {

    showToast(
      "Tanggal penarikan wajib diisi.",
      "error"
    );

    return;

  }


  if (
    nominal <= 0
  ) {

    showToast(
      "Nominal penarikan harus lebih dari 0.",
      "error"
    );

    return;

  }


  try {

    showLoading(
      "Menarik modal..."
    );


    if (
      typeof TradingAPI.withdrawCapital !== "function"
    ) {

      throw new Error(
        "TradingAPI.withdrawCapital tidak tersedia."
      );

    }


    const result =
      await TradingAPI.withdrawCapital(
        nominal,
        catatan,
        tanggal
      );


    const form =
      el(
        "withdrawModalForm"
      );


    if (form) {

      form.reset();

    }


    setInputValue(
      "withdrawModalTanggal",
      getTodayString()
    );


    closeModal(
      "withdrawModal"
    );


    await loadTradingData();


    showToast(
      result?.message ||
      "Modal berhasil ditarik.",
      "success",
      "Berhasil"
    );

  } catch (error) {

    console.error(
      "[Trading] Withdraw capital error:",
      error
    );


    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   OPEN ADD CAPITAL
========================================================= */

function openAddCapitalModal() {

  const form =
    el(
      "addModalForm"
    );


  if (form) {

    form.reset();

  }


  setInputValue(
    "addModalTanggal",
    getTodayString()
  );


  openModal(
    "addModal"
  );

}


/* =========================================================
   OPEN WITHDRAW CAPITAL
========================================================= */

function openWithdrawCapitalModal() {

  const form =
    el(
      "withdrawModalForm"
    );


  if (form) {

    form.reset();

  }


  setInputValue(
    "withdrawModalTanggal",
    getTodayString()
  );


  openModal(
    "withdrawModal"
  );

}


/* =========================================================
   MODAL OVERLAY
========================================================= */

function handleModalOverlayClick(
  event
) {

  if (
    event.target.classList.contains(
      "modal-overlay"
    )
  ) {

    closeModal(
      event.target.id
    );

  }

}


/* =========================================================
   KEYBOARD
========================================================= */

function handleKeyboard(
  event
) {

  if (
    event.key === "Escape"
  ) {

    closeAllModals();

  }

}


/* =========================================================
   CLOSE BUTTON
========================================================= */

function setupCloseModal() {

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(
      function(button) {

        if (
          button.dataset.tradingBound === "1"
        ) {

          return;

        }


        button.dataset.tradingBound =
          "1";


        button.addEventListener(
          "click",
          function() {

            const modal =
              button.closest(
                ".modal-overlay"
              );


            if (modal) {

              closeModal(
                modal.id
              );

            } else {

              closeAllModals();

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".modal-overlay"
    )
    .forEach(
      function(modal) {

        if (
          modal.dataset.tradingBackdropBound === "1"
        ) {

          return;

        }


        modal.dataset.tradingBackdropBound =
          "1";


        modal.addEventListener(
          "click",
          handleModalOverlayClick
        );

      }
    );

}


/* =========================================================
   MODAL BUTTONS
========================================================= */

function setupModalButtons() {

  const addButton =
    el(
      "addModalButton"
    );


  if (
    addButton &&
    addButton.dataset.tradingBound !== "1"
  ) {

    addButton.dataset.tradingBound =
      "1";


    addButton.addEventListener(
      "click",
      openAddCapitalModal
    );

  }


  const withdrawButton =
    el(
      "withdrawModalButton"
    );


  if (
    withdrawButton &&
    withdrawButton.dataset.tradingBound !== "1"
  ) {

    withdrawButton.dataset.tradingBound =
      "1";


    withdrawButton.addEventListener(
      "click",
      openWithdrawCapitalModal
    );

  }

}


/* =========================================================
   TRANSACTION FORM
========================================================= */

function setupTransactionForm() {

  const form =
    el(
      "transactionForm"
    );


  if (!form) {

    return;

  }


  if (
    form.dataset.tradingBound === "1"
  ) {

    return;

  }


  form.dataset.tradingBound =
    "1";


  form.addEventListener(
    "submit",
    handleTransactionSubmit
  );

}


/* =========================================================
   MODAL FORMS
========================================================= */

function setupModalForms() {

  const addForm =
    el(
      "addModalForm"
    );


  if (
    addForm &&
    addForm.dataset.tradingBound !== "1"
  ) {

    addForm.dataset.tradingBound =
      "1";


    addForm.addEventListener(
      "submit",
      handleAddModalSubmit
    );

  }


  const withdrawForm =
    el(
      "withdrawModalForm"
    );


  if (
    withdrawForm &&
    withdrawForm.dataset.tradingBound !== "1"
  ) {

    withdrawForm.dataset.tradingBound =
      "1";


    withdrawForm.addEventListener(
      "submit",
      handleWithdrawModalSubmit
    );

  }

}


/* =========================================================
   TABLE ACTIONS
========================================================= */

function setupTableActions() {

  const tbody =
    el(
      "transactionTableBody"
    );


  if (!tbody) {

    return;

  }


  if (
    tbody.dataset.tradingBound === "1"
  ) {

    return;

  }


  tbody.dataset.tradingBound =
    "1";


  tbody.addEventListener(
    "click",
    handleTableClick
  );

}


/* =========================================================
   KEYBOARD EVENTS
========================================================= */

function setupKeyboardEvents() {

  if (
    document.body.dataset.tradingKeyboardBound === "1"
  ) {

    return;

  }


  document.body.dataset.tradingKeyboardBound =
    "1";


  document.addEventListener(
    "keydown",
    handleKeyboard
  );

}


/* =========================================================
   SETUP BUTTONS
========================================================= */

function setupButtons() {

  setupModalButtons();

  setupTransactionForm();

  setupModalForms();

  setupTableActions();

  setupCloseModal();

  setupKeyboardEvents();

  setupProfitField();

}


/* =========================================================
   TOOLBAR SUPPORT
========================================================= */

function setupToolbar() {

  /*
   * Tombol refresh dengan ID lama / umum.
   */

  const refreshIds = [

    "refreshTradingButton",

    "refreshButton",

    "tradingRefreshButton",

    "refreshTradingDataButton"

  ];


  refreshIds.forEach(
    function(id) {

      const button =
        el(id);


      if (
        !button
      ) {

        return;

      }


      if (
        button.dataset.tradingBound === "1"
      ) {

        return;

      }


      button.dataset.tradingBound =
        "1";


      button.addEventListener(
        "click",
        function(event) {

          event.preventDefault();

          refreshTradingData();

        }
      );

    }
  );


  /*
   * Dukungan tombol yang memakai data-action.
   */

  document
    .querySelectorAll(
      '[data-trading-action="refresh"]'
    )
    .forEach(
      function(button) {

        if (
          button.dataset.tradingBound === "1"
        ) {

          return;

        }


        button.dataset.tradingBound =
          "1";


        button.addEventListener(
          "click",
          function(event) {

            event.preventDefault();

            refreshTradingData();

          }
        );

      }
    );


  /*
   * Add capital toolbar.
   */

  document
    .querySelectorAll(
      '[data-trading-action="add-capital"]'
    )
    .forEach(
      function(button) {

        if (
          button.dataset.tradingBound === "1"
        ) {

          return;

        }


        button.dataset.tradingBound =
          "1";


        button.addEventListener(
          "click",
          function(event) {

            event.preventDefault();

            openAddCapitalModal();

          }
        );

      }
    );


  /*
   * Withdraw toolbar.
   */

  document
    .querySelectorAll(
      '[data-trading-action="withdraw-capital"]'
    )
    .forEach(
      function(button) {

        if (
          button.dataset.tradingBound === "1"
        ) {

          return;

        }


        button.dataset.tradingBound =
          "1";


        button.addEventListener(
          "click",
          function(event) {

            event.preventDefault();

            openWithdrawCapitalModal();

          }
        );

      }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initTradingPage() {

  if (
    TradingState.initialized
  ) {

    /*
     * Jangan pasang listener kedua kali.
     */

    return;

  }


  TradingState.initialized =
    true;


  console.log(
    "[Trading] Initializing clean version..."
  );


  try {

    setupDefaultDates();

    setupButtons();

    setupToolbar();

    createCancelEditButton();

    updateNominalVisibility();

    updateCancelEditButton();


    await loadTradingData();


    console.log(
      "[Trading] Ready."
    );

  } catch (error) {

    console.error(
      "[Trading] INIT ERROR:",
      error
    );


    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );

  }

}


/* =========================================================
   ALIAS INIT
========================================================= */

async function initTrading() {

  return initTradingPage();

}


/* =========================================================
   GLOBAL PAGE API
========================================================= */

window.TradingPage = {

  init:
    initTradingPage,

  refresh:
    refreshTradingData,

  edit:
    startEditTransaction,

  delete:
    handleDeleteTransaction,

  remove:
    handleDeleteTransaction,

  addCapital:
    openAddCapitalModal,

  withdrawCapital:
    openWithdrawCapitalModal,

  closeModal:
    closeModal,

  closeModals:
    closeAllModals,

  cancelEdit:
    cancelEditTransaction,

  toast:
    showToast

};


/* =========================================================
   LEGACY GLOBAL HELPERS
========================================================= */

window.refreshTradingData =
  refreshTradingData;


window.openAddCapitalModal =
  openAddCapitalModal;


window.openWithdrawCapitalModal =
  openWithdrawCapitalModal;


window.handleDeleteTransaction =
  handleDeleteTransaction;


window.startEditTransaction =
  startEditTransaction;


/* =========================================================
   DOM READY
========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initTradingPage,
    {
      once: true
    }
  );

} else {

  initTradingPage();

}


/* =========================================================
   FINAL LOG
========================================================= */

console.log(
  "[Trading] CLEAN FULL VERSION loaded."
);

console.log(
  "[Trading] ADD + EDIT + DELETE + CAPITAL + MODAL + TOOLBAR enabled."
);
