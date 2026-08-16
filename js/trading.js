/* =========================================================
   TRADING JOURNAL
   js/trading.js

   TAHAP 1 / 2
   - Load data
   - Summary
   - Tabel transaksi
   - Tambah transaksi
   - Edit transaksi
   - Delete transaksi
   - Modal
   - Loading
   - Toast
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

const TradingState = {

  transaksi: [],

  modal: [],

  summary: {},

  editingId: null,

  loading: false

};


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initTradingPage();

  }
);


/* =========================================================
   INIT
========================================================= */

async function initTradingPage() {

  console.log(
    "[Trading] Initializing..."
  );

  setupDefaultDates();

  setupProfitField();

  setupModalButtons();

  setupTransactionForm();

  setupModalForms();

  setupTableActions();

  setupCloseModal();

  setupKeyboardEvents();

  createCancelEditButton();

  await loadTradingData();

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setupDefaultDates() {

  const today =
    getTodayString();


  const tanggal =
    document.getElementById(
      "tanggal"
    );

  const addTanggal =
    document.getElementById(
      "addModalTanggal"
    );

  const withdrawTanggal =
    document.getElementById(
      "withdrawModalTanggal"
    );


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


    /*
     * Support jika API mengembalikan:
     *
     * {
     *   transaksi: [],
     *   modal: [],
     *   summary: {}
     * }
     *
     * atau:
     *
     * {
     *   data: {
     *     transaksi: []
     *   }
     * }
     */

    const data =
      result &&
      result.data &&
      typeof result.data === "object"
        ? result.data
        : result;


    TradingState.transaksi =
      Array.isArray(
        data?.transaksi
      )
        ? data.transaksi
        : Array.isArray(
            data?.transactions
          )
            ? data.transactions
            : [];


    TradingState.modal =
      Array.isArray(
        data?.modal
      )
        ? data.modal
        : [];


    TradingState.summary =
      data?.summary &&
      typeof data.summary === "object"
        ? data.summary
        : {};


    renderSummary();

    renderTransactions();


    console.log(
      "[Trading] Data loaded:",
      data
    );


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


    renderSummary();

    renderTransactions();


    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );


  } finally {

    setLoading(
      false
    );

  }

}


/* =========================================================
   REFRESH
========================================================= */

async function refreshTradingData() {

  await loadTradingData();

}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary() {

  const summary =
    TradingState.summary || {};


  const modal =
    toNumber(
      summary.modal
    );


  const netProfit =
    toNumber(
      summary.netProfit
    );


  const total =
    toNumber(
      summary.total
    );


  setText(
    "modalValue",
    formatRupiah(modal)
  );


  setText(
    "profitLossValue",
    formatRupiah(netProfit)
  );


  setText(
    "totalValue",
    formatRupiah(total)
  );


  const profitDescription =
    document.getElementById(
      "profitLossDescription"
    );


  if (profitDescription) {

    if (netProfit > 0) {

      profitDescription.textContent =
        "Net profit";

    } else if (netProfit < 0) {

      profitDescription.textContent =
        "Net loss";

    } else {

      profitDescription.textContent =
        "Net hasil trading";

    }

  }


  const profitIcon =
    document.getElementById(
      "profitIcon"
    );


  if (profitIcon) {

    profitIcon.classList.remove(
      "profit-positive",
      "profit-negative",
      "positive",
      "negative"
    );


    if (netProfit > 0) {

      profitIcon.textContent =
        "↗";

      profitIcon.classList.add(
        "profit-positive"
      );

    } else if (netProfit < 0) {

      profitIcon.textContent =
        "↘";

      profitIcon.classList.add(
        "profit-negative"
      );

    } else {

      profitIcon.textContent =
        "→";

    }

  }


  const profitValue =
    document.getElementById(
      "profitLossValue"
    );


  if (profitValue) {

    profitValue.classList.remove(
      "profit-positive",
      "profit-negative",
      "positive",
      "negative"
    );


    if (netProfit > 0) {

      profitValue.classList.add(
        "profit-positive",
        "positive"
      );

    }


    if (netProfit < 0) {

      profitValue.classList.add(
        "profit-negative",
        "negative"
      );

    }

  }

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

  const loading =
    document.getElementById(
      "transactionLoading"
    );


  const empty =
    document.getElementById(
      "transactionEmpty"
    );


  const wrapper =
    document.getElementById(
      "transactionTableWrapper"
    );


  const tbody =
    document.getElementById(
      "transactionTableBody"
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


  const transactions =
    Array.isArray(
      TradingState.transaksi
    )
      ? TradingState.transaksi
      : [];


  if (
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
   * Ambil maksimal 10 transaksi terbaru.
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
    function (transaction) {

      tbody.appendChild(
        createTransactionRow(
          transaction
        )
      );

    }
  );


  addActionHeaderIfNeeded();

}


/* =========================================================
   NORMALIZE TRANSACTION
========================================================= */

function normalizeTransaction(
  transaction
) {

  if (
    !transaction ||
    typeof transaction !== "object"
  ) {

    return {};

  }


  return {

    id:
      transaction.ID ??
      transaction.id ??
      "",

    tanggal:
      transaction.Tanggal ??
      transaction.tanggal ??
      "",

    saham:
      transaction.Saham ??
      transaction.saham ??
      "",

    aksi:
      transaction.Aksi ??
      transaction.aksi ??
      "",

    harga:
      transaction.Harga ??
      transaction.harga ??
      0,

    lot:
      transaction.Lot ??
      transaction.lot ??
      0,

    profitRugi:
      transaction["Profit/Rugi"] ??
      transaction.profitRugi ??
      transaction.hasil ??
      "",

    nominal:
      transaction.Nominal ??
      transaction.nominal ??
      0,

    catatan:
      transaction.Catatan ??
      transaction.catatan ??
      "",

    timestamp:
      transaction.Timestamp ??
      transaction.timestamp ??
      ""

  };

}


/* =========================================================
   CREATE TRANSACTION ROW
========================================================= */

function createTransactionRow(
  transaction
) {

  const row =
    document.createElement(
      "tr"
    );


  const normalized =
    normalizeTransaction(
      transaction
    );


  const id =
    String(
      normalized.id || ""
    );


  const tanggal =
    normalized.tanggal;


  const saham =
    normalized.saham;


  const aksi =
    normalized.aksi;


  const harga =
    toNumber(
      normalized.harga
    );


  const lot =
    toNumber(
      normalized.lot
    );


  const hasil =
    normalized.profitRugi;


  const nominal =
    toNumber(
      normalized.nominal
    );


  row.innerHTML = `

    <td>
      ${escapeHtml(
        formatDisplayDate(tanggal)
      )}
    </td>

    <td>
      <strong>
        ${escapeHtml(
          saham || "-"
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
      ${formatNumber(harga)}
    </td>

    <td>
      ${formatNumber(lot)}
    </td>

    <td>
      ${createResultBadge(
        hasil,
        nominal
      )}
    </td>

    <td>
      ${hasil
        ? formatRupiah(nominal)
        : "-"
      }
    </td>

    <td class="transaction-actions-cell">

      <button
        type="button"
        class="table-action-button edit-transaction-button"
        data-action="edit"
        data-id="${escapeAttribute(id)}"
      >
        Edit
      </button>

      <button
        type="button"
        class="table-action-button delete-transaction-button"
        data-action="delete"
        data-id="${escapeAttribute(id)}"
      >
        Hapus
      </button>

    </td>

  `;


  return row;

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
   RESULT BADGE
========================================================= */

function createResultBadge(
  hasil,
  nominal
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


  if (value === "PROFIT") {

    return `
      <span class="result-badge result-profit profit">
        PROFIT
      </span>
    `;

  }


  if (value === "RUGI") {

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


  if (value === "BUY") {

    return "action-buy buy";

  }


  if (value === "SELL") {

    return "action-sell sell";

  }


  return "";

}


/* =========================================================
   TABLE ACTION SETUP
========================================================= */

function setupTableActions() {

  const tbody =
    document.getElementById(
      "transactionTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.addEventListener(
    "click",
    function (event) {

      const button =
        event.target.closest(
          "[data-action]"
        );


      if (!button) {

        return;

      }


      const action =
        button.dataset.action;


      const id =
        button.dataset.id;


      if (!id) {

        showToast(
          "ID transaksi tidak ditemukan.",
          "error",
          "Gagal"
        );

        return;

      }


      if (
        action === "edit"
      ) {

        handleEditTransaction(
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
  );

}


/* =========================================================
   TRANSACTION FORM
========================================================= */

function setupTransactionForm() {

  const form =
    document.getElementById(
      "transactionForm"
    );


  if (!form) {

    return;

  }


  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      await handleTransactionSubmit(
        form
      );

    }
  );

}


/* =========================================================
   GET TRANSACTION FORM DATA
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
   SUBMIT TRANSACTION
========================================================= */

async function handleTransactionSubmit(
  form
) {

  const button =
    document.getElementById(
      "saveTransactionButton"
    );


  /*
   * Validasi HTML form.
   */

  if (
    form &&
    typeof form.checkValidity === "function" &&
    !form.checkValidity()
  ) {

    form.reportValidity();

    return;

  }


  const data =
    getTransactionFormData();


  /*
   * =====================================================
   * PERBAIKAN PENTING
   *
   * Saat EDIT, ID dimasukkan ke payload.
   *
   * Ini untuk mengantisipasi api.js yang membaca:
   *
   * data.id
   *
   * bukan hanya parameter id.
   * =====================================================
   */

  if (
    TradingState.editingId
  ) {

    data.id =
      String(
        TradingState.editingId
      );

  }


  try {

    setButtonLoading(
      button,
      true,
      TradingState.editingId
        ? "Mengubah..."
        : "Menyimpan..."
    );


    let result;


    /*
     * EDIT
     */

    if (
      TradingState.editingId
    ) {

      console.log(
        "[Trading] Updating transaction:",
        {
          id:
            TradingState.editingId,

          data:
            data
        }
      );


      result =
        await TradingAPI.updateTransaction(
          TradingState.editingId,
          data
        );


      showToast(
        result?.message ||
        "Transaksi berhasil diperbarui.",
        "success",
        "Berhasil"
      );


    }


    /*
     * TAMBAH
     */

    else {

      console.log(
        "[Trading] Adding transaction:",
        data
      );


      result =
        await TradingAPI.addTransaction(
          data
        );


      showToast(
        result?.message ||
        "Transaksi berhasil disimpan.",
        "success",
        "Berhasil"
      );

    }


    /*
     * Reset state edit
     */

    TradingState.editingId =
      null;


    resetTransactionForm();

    setTransactionEditMode(
      false
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "[Trading] Save transaction error:",
      error
    );


    showToast(
      getErrorMessage(error),
      "error",
      "Gagal"
    );


  } finally {

    setButtonLoading(
      button,
      false,
      "Simpan Transaksi"
    );

  }

}


/* =========================================================
   EDIT TRANSACTION
========================================================= */

function handleEditTransaction(
  id
) {

  if (!id) {

    showToast(
      "ID transaksi tidak ditemukan.",
      "error",
      "Gagal"
    );

    return;

  }


  const transaction =
    TradingState.transaksi.find(
      function (item) {

        return (
          String(
            getTransactionId(
              item
            )
          ) ===
          String(id)
        );

      }
    );


  if (!transaction) {

    showToast(
      "Data transaksi tidak ditemukan.",
      "error",
      "Gagal"
    );

    return;

  }


  /*
   * =====================================================
   * SIMPAN ID EDIT
   * =====================================================
   */

  TradingState.editingId =
    String(id);


  console.log(
    "[Trading] Enter edit mode:",
    TradingState.editingId
  );


  /*
   * Isi form.
   */

  setInputValue(
    "tanggal",
    convertDateForInput(
      getField(
        transaction,
        "Tanggal",
        "tanggal"
      )
    )
  );


  setInputValue(
    "saham",
    getField(
      transaction,
      "Saham",
      "saham"
    )
  );


  setInputValue(
    "aksi",
    getField(
      transaction,
      "Aksi",
      "aksi"
    )
  );


  setInputValue(
    "harga",
    getField(
      transaction,
      "Harga",
      "harga"
    )
  );


  setInputValue(
    "lot",
    getField(
      transaction,
      "Lot",
      "lot"
    )
  );


  setInputValue(
    "profitRugi",
    getField(
      transaction,
      "Profit/Rugi",
      "profitRugi"
    )
  );


  setInputValue(
    "nominal",
    getField(
      transaction,
      "Nominal",
      "nominal"
    )
  );


  setInputValue(
    "catatan",
    getField(
      transaction,
      "Catatan",
      "catatan"
    )
  );


  updateNominalVisibility();


  setTransactionEditMode(
    true
  );


  updateCancelEditButton();


  const panel =
    document.querySelector(
      ".transaction-panel"
    );


  const form =
    document.getElementById(
      "transactionForm"
    );


  const scrollTarget =
    panel ||
    form;


  if (scrollTarget) {

    scrollTarget.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  showToast(
    "Silakan ubah data transaksi lalu tekan Update Transaksi.",
    "success",
    "Mode Edit"
  );

}

/* =========================================================
   TRADING JOURNAL
   trading.js
   STAGE 2 / FINAL - UPDATED
   EDIT + DELETE + MODAL + REFRESH + UI

   PERBAIKAN:
   - Tidak menggunakan TradingState.editingId
   - Hanya menggunakan editingTransactionId
   - ID transaksi edit dipastikan tersimpan
   - Update mengirim ID yang benar
   - Tidak membutuhkan setupProfitField()
   - Tambah / Edit / Hapus tetap berjalan
   - Modal tambah / tarik tetap berjalan
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let editingTransactionId = null;

let toastTimer = null;


/* =========================================================
   DOM HELPER
========================================================= */

function el(id) {

  return document.getElementById(id);

}


/* =========================================================
   SET INPUT VALUE
========================================================= */

function setInputValue(
  id,
  value
) {

  const input =
    document.getElementById(id);

  if (input) {

    input.value =
      value ?? "";

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
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

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(value) || 0
  );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatTanggal(value) {

  if (!value) {

    return "-";

  }


  const text =
    String(value);


  /*
   * YYYY-MM-DD
   */

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


  /*
   * Coba format Date
   */

  const date =
    new Date(value);


  if (
    !isNaN(
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


  return escapeHtml(
    value
  );

}


/* =========================================================
   TODAY
========================================================= */

function todayString() {

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


/* =========================================================
   SET DEFAULT DATES
========================================================= */

function setDefaultDates() {

  const today =
    todayString();


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


/* =========================================================
   SHOW GLOBAL LOADING
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

}


/* =========================================================
   HIDE GLOBAL LOADING
========================================================= */

function hideLoading() {

  const loading =
    el("globalLoading");


  if (loading) {

    loading.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   SHOW TOAST
========================================================= */

function showToast(
  message,
  type = "success",
  title = ""
) {

  const toast =
    el("toast");


  const toastIcon =
    el("toastIcon");


  const toastTitle =
    el("toastTitle");


  const toastMessage =
    el("toastMessage");


  if (!toast) {

    console.log(
      title || type,
      message
    );

    return;

  }


  if (!title) {

    title =
      type === "error"
        ? "Gagal"
        : type === "warning"
          ? "Peringatan"
          : "Berhasil";

  }


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
      function () {

        toast.classList.add(
          "hidden"
        );

      },
      3500
    );

}


/* =========================================================
   HIDE TOAST
========================================================= */

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
   OPEN MODAL
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


/* =========================================================
   CLOSE MODAL
========================================================= */

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


/* =========================================================
   CLOSE ALL MODALS
========================================================= */

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
   NORMALIZE TRANSACTION ROW
========================================================= */

function normalizeRow(
  row
) {

  if (
    !row ||
    typeof row !== "object"
  ) {

    return {};

  }


  return {

    /*
     * ID
     */
    id:
      row.ID ??
      row.id ??
      row.Id ??
      row["ID Transaksi"] ??
      "",


    /*
     * TANGGAL
     */
    tanggal:
      row.Tanggal ??
      row.tanggal ??
      "",


    /*
     * SAHAM
     */
    saham:
      row.Saham ??
      row.saham ??
      "",


    /*
     * AKSI
     */
    aksi:
      row.Aksi ??
      row.aksi ??
      "",


    /*
     * HARGA
     */
    harga:
      row.Harga ??
      row.harga ??
      0,


    /*
     * LOT
     */
    lot:
      row.Lot ??
      row.lot ??
      0,


    /*
     * PROFIT / RUGI
     */
    profitRugi:
      row["Profit/Rugi"] ??
      row.profitRugi ??
      row.hasil ??
      "",


    /*
     * NOMINAL
     */
    nominal:
      row.Nominal ??
      row.nominal ??
      0,


    /*
     * CATATAN
     */
    catatan:
      row.Catatan ??
      row.catatan ??
      "",


    /*
     * TIMESTAMP
     */
    timestamp:
      row.Timestamp ??
      row.timestamp ??
      ""

  };

}


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

async function loadTransactions() {

  setTransactionLoading(
    true
  );


  try {

    const result =
      await TradingAPI.getAllData();


    const data =
      result?.data ||
      result ||
      {};


    const transaksi =
      Array.isArray(
        data.transaksi
      )
        ? data.transaksi
        : Array.isArray(
            data.transactions
          )
          ? data.transactions
          : [];


    renderTransactions(
      transaksi
    );


    renderSummary(
      data.summary || {}
    );


    console.log(
      "[Trading] Data loaded:",
      transaksi
    );

  } catch (error) {

    console.error(
      "[Trading] loadTransactions:",
      error
    );


    renderTransactions(
      []
    );


    showToast(
      error.message ||
      "Gagal mengambil data dari Google Sheets.",
      "error"
    );

  } finally {

    setTransactionLoading(
      false
    );

  }

}


/* =========================================================
   LOADING TRANSACTION STATE
========================================================= */

function setTransactionLoading(
  isLoading
) {

  const loading =
    el("transactionLoading");


  const empty =
    el("transactionEmpty");


  const table =
    el("transactionTableWrapper");


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
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions(
  transactions
) {

  const tbody =
    el("transactionTableBody");


  const empty =
    el("transactionEmpty");


  const table =
    el("transactionTableWrapper");


  if (!tbody) {

    console.warn(
      "[Trading] transactionTableBody tidak ditemukan."
    );

    return;

  }


  tbody.innerHTML =
    "";


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


    if (table) {

      table.classList.add(
        "hidden"
      );

    }


    return;

  }


  /*
   * Terbaru di atas.
   */

  const rows =
    [...transactions]
      .reverse();


  rows.forEach(
    function(raw) {

      const row =
        normalizeRow(
          raw
        );


      const tr =
        document.createElement(
          "tr"
        );


      const hasil =
        String(
          row.profitRugi || ""
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


      if (
        hasil === "RUGI"
      ) {

        hasilClass =
          "loss";

      }


      const aksi =
        String(
          row.aksi || ""
        )
        .trim()
        .toUpperCase();


      const aksiClass =
        aksi === "BUY"
          ? "buy"
          : aksi === "SELL"
            ? "sell"
            : "";


      const transactionId =
        String(
          row.id ?? ""
        ).trim();


      tr.innerHTML = `

        <td>
          ${escapeHtml(
            formatTanggal(
              row.tanggal
            )
          )}
        </td>

        <td>
          <strong>
            ${escapeHtml(
              row.saham
            )}
          </strong>
        </td>

        <td>
          <span class="trade-badge ${aksiClass}">
            ${escapeHtml(
              aksi
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
          ${
            hasil
              ? `
                <span class="result-badge ${hasilClass}">
                  ${escapeHtml(
                    hasil
                  )}
                </span>
              `
              : "-"
          }
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

        <td class="transaction-actions">

          <button
            type="button"
            class="table-action edit"
            data-action="edit"
            data-id="${escapeHtml(
              transactionId
            )}"
          >
            Edit
          </button>

          <button
            type="button"
            class="table-action delete"
            data-action="delete"
            data-id="${escapeHtml(
              transactionId
            )}"
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


  if (empty) {

    empty.classList.add(
      "hidden"
    );

  }


  if (table) {

    table.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary(
  summary
) {

  if (!summary) {

    summary = {};

  }


  const modal =
    Number(
      summary.modal
    ) || 0;


  const netProfit =
    Number(
      summary.netProfit
    ) || 0;


  const total =
    Number(
      summary.total
    ) ||
    modal +
    netProfit;


  const modalValue =
    el("modalValue");


  const profitLossValue =
    el("profitLossValue");


  const totalValue =
    el("totalValue");


  const profitDescription =
    el("profitLossDescription");


  const profitIcon =
    el("profitIcon");


  if (modalValue) {

    modalValue.textContent =
      formatRupiah(
        modal
      );

  }


  if (profitLossValue) {

    profitLossValue.textContent =
      formatRupiah(
        netProfit
      );


    profitLossValue.classList.remove(
      "positive",
      "negative",
      "profit-positive",
      "profit-negative"
    );


    if (
      netProfit > 0
    ) {

      profitLossValue.classList.add(
        "positive"
      );

    }


    if (
      netProfit < 0
    ) {

      profitLossValue.classList.add(
        "negative"
      );

    }

  }


  if (totalValue) {

    totalValue.textContent =
      formatRupiah(
        total
      );

  }


  if (profitDescription) {

    if (
      netProfit > 0
    ) {

      profitDescription.textContent =
        "Trading menghasilkan profit";

    } else if (
      netProfit < 0
    ) {

      profitDescription.textContent =
        "Trading mengalami kerugian";

    } else {

      profitDescription.textContent =
        "Net hasil trading";

    }

  }


  if (profitIcon) {

    profitIcon.textContent =
      netProfit >= 0
        ? "↗"
        : "↘";

  }

}


/* =========================================================
   GET TRANSACTION FORM DATA
========================================================= */

function getTransactionFormData() {

  const data = {

    tanggal:
      el("tanggal")?.value ||
      "",


    saham:
      (
        el("saham")?.value ||
        ""
      )
      .trim()
      .toUpperCase(),


    aksi:
      (
        el("aksi")?.value ||
        ""
      )
      .trim()
      .toUpperCase(),


    harga:
      Number(
        el("harga")?.value ||
        0
      ),


    lot:
      Number(
        el("lot")?.value ||
        0
      ),


    profitRugi:
      (
        el("profitRugi")?.value ||
        ""
      )
      .trim()
      .toUpperCase(),


    nominal:
      Number(
        el("nominal")?.value ||
        0
      ),


    catatan:
      (
        el("catatan")?.value ||
        ""
      ).trim()

  };


  return data;

}


/* =========================================================
   CLEAR TRANSACTION FORM
========================================================= */

function clearTransactionForm() {

  const form =
    el("transactionForm");


  if (form) {

    form.reset();

  }


  const tanggal =
    el("tanggal");


  if (tanggal) {

    tanggal.value =
      todayString();

  }


  const aksi =
    el("aksi");


  if (aksi) {

    aksi.value =
      "BUY";

  }


  const profitRugi =
    el("profitRugi");


  if (profitRugi) {

    profitRugi.value =
      "";

  }


  const nominal =
    el("nominal");


  if (nominal) {

    nominal.value =
      "";

  }


  updateNominalVisibility();

}


/* =========================================================
   NOMINAL VISIBILITY
========================================================= */

function updateNominalVisibility() {

  const select =
    el("profitRugi");


  const group =
    el("nominalGroup");


  const nominal =
    el("nominal");


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
       * Jangan hapus nilai ketika sedang
       * edit sebelum user memilih hasil.
       */

      if (
        !editingTransactionId
      ) {

        nominal.value =
          "";

      }

    }

  }

}


/* =========================================================
   SAVE / UPDATE TRANSACTION
========================================================= */

async function handleTransactionSubmit(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  if (
    form &&
    !form.checkValidity()
  ) {

    form.reportValidity();

    return;

  }


  try {

    const data =
      getTransactionFormData();


    const isEdit =
      Boolean(
        editingTransactionId
      );


    console.log(
      "[Trading] Save transaction:",
      {
        mode:
          isEdit
            ? "UPDATE"
            : "ADD",

        editingTransactionId:
          editingTransactionId,

        data:
          data
      }
    );


    showLoading(
      isEdit
        ? "Mengubah transaksi..."
        : "Menyimpan transaksi..."
    );


    let result;


    if (isEdit) {

      /*
       * PASTIKAN ID BENAR-BENAR ADA
       */

      const id =
        String(
          editingTransactionId
        ).trim();


      if (!id) {

        throw new Error(
          "ID transaksi wajib untuk edit."
        );

      }


      result =
        await TradingAPI.updateTransaction(
          id,
          data
        );

    } else {

      result =
        await TradingAPI.addTransaction(
          data
        );

    }


    console.log(
      "[Trading] Save result:",
      result
    );


    /*
     * Reset mode edit
     * setelah API berhasil.
     */

    editingTransactionId =
      null;


    clearTransactionForm();

    setTransactionEditMode(
      false
    );


    updateCancelEditButton();


    await loadTransactions();


    showToast(
      result?.message ||
      (
        isEdit
          ? "Transaksi berhasil diperbarui."
          : "Transaksi berhasil disimpan."
      ),
      "success"
    );

  } catch (error) {

    console.error(
      "[Trading] save transaction:",
      error
    );


    showToast(
      error.message ||
      "Gagal menyimpan transaksi.",
      "error"
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   SET TRANSACTION EDIT MODE
========================================================= */

function setTransactionEditMode(
  isEdit
) {

  const button =
    el("saveTransactionButton");


  if (!button) {

    return;

  }


  const span =
    button.querySelector(
      "span"
    );


  if (span) {

    span.textContent =
      isEdit
        ? "Update Transaksi"
        : "Simpan Transaksi";

  } else {

    button.textContent =
      isEdit
        ? "Update Transaksi"
        : "Simpan Transaksi";

  }

}


/* =========================================================
   FIND TRANSACTION BY ID
========================================================= */

async function findTransactionById(
  id
) {

  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ) {

    return null;

  }


  const targetId =
    String(
      id
    ).trim();


  const result =
    await TradingAPI.getAllData();


  const data =
    result?.data ||
    result ||
    {};


  const transactions =
    Array.isArray(
      data.transaksi
    )
      ? data.transaksi
      : Array.isArray(
          data.transactions
        )
        ? data.transactions
        : [];


  return transactions
    .map(
      normalizeRow
    )
    .find(
      function(row) {

        return (
          String(
            row.id ?? ""
          ).trim()
          ===
          targetId
        );

      }
    );

}


/* =========================================================
   START EDIT TRANSACTION
========================================================= */

async function startEditTransaction(
  id
) {

  /*
   * Validasi ID
   */

  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ) {

    showToast(
      "ID transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  try {

    showLoading(
      "Memuat transaksi..."
    );


    const targetId =
      String(
        id
      ).trim();


    console.log(
      "[Trading] Start edit ID:",
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
     * SIMPAN ID DARI DATA YANG DITEMUKAN.
     *
     * Ini bagian penting untuk memperbaiki
     * error "ID transaksi wajib untuk edit".
     */

    editingTransactionId =
      String(
        row.id
      ).trim();


    if (
      !editingTransactionId
    ) {

      throw new Error(
        "ID transaksi tidak ditemukan pada data."
      );

    }


    console.log(
      "[Trading] Editing transaction ID:",
      editingTransactionId
    );


    /*
     * ISI FORM
     */

    setInputValue(
      "tanggal",
      convertDateForInput(
        row.tanggal
      )
    );


    setInputValue(
      "saham",
      row.saham || ""
    );


    setInputValue(
      "aksi",
      row.aksi || "BUY"
    );


    setInputValue(
      "harga",
      row.harga ?? ""
    );


    setInputValue(
      "lot",
      row.lot ?? ""
    );


    setInputValue(
      "profitRugi",
      row.profitRugi || ""
    );


    setInputValue(
      "nominal",
      row.nominal ?? ""
    );


    setInputValue(
      "catatan",
      row.catatan || ""
    );


    updateNominalVisibility();


    /*
     * Ubah tombol menjadi Update
     */

    setTransactionEditMode(
      true
    );


    updateCancelEditButton();


    /*
     * Scroll ke form
     */

    const form =
      el("transactionForm");


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
      "[Trading] edit:",
      error
    );


    editingTransactionId =
      null;


    setTransactionEditMode(
      false
    );


    updateCancelEditButton();


    showToast(
      error.message ||
      "Gagal memuat transaksi.",
      "error"
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   CONVERT DATE FOR INPUT
========================================================= */

function convertDateForInput(
  value
) {

  if (!value) {

    return "";

  }


  const text =
    String(
      value
    ).trim();


  /*
   * YYYY-MM-DD
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {

    return text;

  }


  /*
   * DD/MM/YYYY
   */

  const match =
    text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );


  if (match) {

    return (
      match[3] +
      "-" +
      match[2] +
      "-" +
      match[1]
    );

  }


  const date =
    new Date(
      text
    );


  if (
    isNaN(
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
   CANCEL EDIT
========================================================= */

function cancelEditTransaction() {

  console.log(
    "[Trading] Cancel edit:",
    editingTransactionId
  );


  editingTransactionId =
    null;


  clearTransactionForm();


  setTransactionEditMode(
    false
  );


  updateCancelEditButton();


  showToast(
    "Edit transaksi dibatalkan.",
    "success"
  );

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function handleDeleteTransaction(
  id
) {

  if (
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ) {

    showToast(
      "ID transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  const targetId =
    String(
      id
    ).trim();


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


    const result =
      await TradingAPI.deleteTransaction(
        targetId
      );


    /*
     * Kalau transaksi yang dihapus
     * sedang diedit, keluar dari edit mode.
     */

    if (
      String(
        editingTransactionId
      ) ===
      targetId
    ) {

      editingTransactionId =
        null;


      clearTransactionForm();


      setTransactionEditMode(
        false
      );


      updateCancelEditButton();

    }


    await loadTransactions();


    showToast(
      result?.message ||
      "Transaksi berhasil dihapus.",
      "success"
    );

  } catch (error) {

    console.error(
      "[Trading] delete:",
      error
    );


    showToast(
      error.message ||
      "Gagal menghapus transaksi.",
      "error"
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
    el("addModalTanggal")?.value ||
    todayString();


  const nominal =
    Number(
      el("addModalNominal")?.value ||
      0
    );


  const catatan =
    el("addModalCatatan")?.value ||
    "";


  if (!tanggal) {

    showToast(
      "Tanggal modal wajib diisi.",
      "error"
    );

    return;

  }


  if (
    !Number.isFinite(
      nominal
    ) ||
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


    const result =
      await TradingAPI.addCapital(
        nominal,
        catatan,
        tanggal
      );


    const form =
      el("addModalForm");


    if (form) {

      form.reset();

    }


    if (
      el("addModalTanggal")
    ) {

      el("addModalTanggal").value =
        todayString();

    }


    closeModal(
      "addModal"
    );


    await loadTransactions();


    showToast(
      result?.message ||
      "Modal berhasil ditambahkan.",
      "success"
    );

  } catch (error) {

    console.error(
      "[Trading] add capital:",
      error
    );


    showToast(
      error.message ||
      "Gagal menambahkan modal.",
      "error"
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
    el("withdrawModalTanggal")?.value ||
    todayString();


  const nominal =
    Number(
      el("withdrawModalNominal")?.value ||
      0
    );


  const catatan =
    el("withdrawModalCatatan")?.value ||
    "";


  if (!tanggal) {

    showToast(
      "Tanggal penarikan wajib diisi.",
      "error"
    );

    return;

  }


  if (
    !Number.isFinite(
      nominal
    ) ||
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


    const result =
      await TradingAPI.withdrawCapital(
        nominal,
        catatan,
        tanggal
      );


    const form =
      el("withdrawModalForm");


    if (form) {

      form.reset();

    }


    if (
      el("withdrawModalTanggal")
    ) {

      el("withdrawModalTanggal").value =
        todayString();

    }


    closeModal(
      "withdrawModal"
    );


    await loadTransactions();


    showToast(
      result?.message ||
      "Modal berhasil ditarik.",
      "success"
    );

  } catch (error) {

    console.error(
      "[Trading] withdraw capital:",
      error
    );


    showToast(
      error.message ||
      "Gagal menarik modal.",
      "error"
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   OPEN ADD CAPITAL MODAL
========================================================= */

function openAddCapitalModal() {

  const form =
    el("addModalForm");


  if (form) {

    form.reset();

  }


  if (
    el("addModalTanggal")
  ) {

    el("addModalTanggal").value =
      todayString();

  }


  openModal(
    "addModal"
  );

}


/* =========================================================
   OPEN WITHDRAW CAPITAL MODAL
========================================================= */

function openWithdrawCapitalModal() {

  const form =
    el("withdrawModalForm");


  if (form) {

    form.reset();

  }


  if (
    el("withdrawModalTanggal")
  ) {

    el("withdrawModalTanggal").value =
      todayString();

  }


  openModal(
    "withdrawModal"
  );

}


/* =========================================================
   MODAL BACKDROP
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
   KEYBOARD ESC
========================================================= */

function handleKeyboard(
  event
) {

  if (
    event.key !== "Escape"
  ) {

    return;

  }


  closeAllModals();

}


/* =========================================================
   BUTTON EVENT SETUP
========================================================= */

function setupButtons() {

  /*
   * ADD MODAL
   */

  const addButton =
    el("addModalButton");


  if (addButton) {

    addButton.addEventListener(
      "click",
      openAddCapitalModal
    );

  }


  /*
   * WITHDRAW MODAL
   */

  const withdrawButton =
    el("withdrawModalButton");


  if (withdrawButton) {

    withdrawButton.addEventListener(
      "click",
      openWithdrawCapitalModal
    );

  }


  /*
   * TRANSACTION FORM
   */

  const transactionForm =
    el("transactionForm");


  if (transactionForm) {

    transactionForm.addEventListener(
      "submit",
      handleTransactionSubmit
    );

  }


  /*
   * ADD CAPITAL FORM
   */

  const addForm =
    el("addModalForm");


  if (addForm) {

    addForm.addEventListener(
      "submit",
      handleAddModalSubmit
    );

  }


  /*
   * WITHDRAW FORM
   */

  const withdrawForm =
    el("withdrawModalForm");


  if (withdrawForm) {

    withdrawForm.addEventListener(
      "submit",
      handleWithdrawModalSubmit
    );

  }


  /*
   * TABLE ACTION
   */

  const tableBody =
    el("transactionTableBody");


  if (tableBody) {

    tableBody.addEventListener(
      "click",
      handleTableClick
    );

  }


  /*
   * PROFIT / RUGI
   */

  const profitRugi =
    el("profitRugi");


  if (profitRugi) {

    profitRugi.addEventListener(
      "change",
      updateNominalVisibility
    );

  }


  /*
   * CLOSE BUTTON
   */

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(
      function(button) {

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


  /*
   * BACKDROP
   */

  document
    .querySelectorAll(
      ".modal-overlay"
    )
    .forEach(
      function(modal) {

        modal.addEventListener(
          "click",
          handleModalOverlayClick
        );

      }
    );


  /*
   * ESC
   */

  document.addEventListener(
    "keydown",
    handleKeyboard
  );

}


/* =========================================================
   CREATE CANCEL EDIT BUTTON
========================================================= */

function createCancelEditButton() {

  const form =
    el("transactionForm");


  const saveButton =
    el("saveTransactionButton");


  if (
    !form ||
    !saveButton
  ) {

    return;

  }


  /*
   * Jangan buat dua kali.
   */

  if (
    el("cancelEditButton")
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
    function() {

      cancelEditTransaction();

    }
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


/* =========================================================
   UPDATE CANCEL EDIT BUTTON
========================================================= */

function updateCancelEditButton() {

  const button =
    el("cancelEditButton");


  if (!button) {

    return;

  }


  button.style.display =
    editingTransactionId
      ? "block"
      : "none";

}


/* =========================================================
   REFRESH DATA
========================================================= */

async function refreshTradingData() {

  try {

    showLoading(
      "Memuat data terbaru..."
    );


    await loadTransactions();

  } catch (error) {

    console.error(
      "[Trading] refresh:",
      error
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initTrading() {

  console.log(
    "[Trading] Initializing..."
  );


  try {

    /*
     * SETUP EVENT
     */

    setupButtons();


    /*
     * BUTTON BATAL EDIT
     */

    createCancelEditButton();


    /*
     * DEFAULT DATE
     */

    setDefaultDates();


    /*
     * PROFIT / RUGI
     */

    updateNominalVisibility();


    /*
     * LOAD DATA
     */

    await loadTransactions();


    /*
     * STATE BUTTON
     */

    updateCancelEditButton();


    console.log(
      "[Trading] Ready."
    );

  } catch (error) {

    console.error(
      "[Trading] INIT ERROR:",
      error
    );


    showToast(
      error.message ||
      "Gagal menjalankan Trading Journal.",
      "error"
    );

  }

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.TradingPage = {

  init:
    initTrading,


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
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initTrading
  );

} else {

  initTrading();

}


console.log(
  "[Trading] Stage 2 FINAL loaded."
);


console.log(
  "[Trading] ADD + EDIT + DELETE + MODAL enabled."
);
