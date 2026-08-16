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
   js/trading.js
   STAGE 2 / FINAL

   FIX:
   - EDIT menggunakan TradingState.editingId
   - Tidak menggunakan editingTransactionId terpisah
   - Tidak bentrok dengan Stage 1
   - ADD tetap jalan
   - EDIT tetap jalan
   - DELETE tetap jalan
   - MODAL tetap jalan
   - REFRESH tetap jalan
========================================================= */

"use strict";


/* =========================================================
   DOM HELPER
========================================================= */

function el(id) {

  return document.getElementById(id);

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiahFinal(value) {

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

function formatNumberFinal(value) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(value) || 0
  );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatTanggalFinal(value) {

  if (!value) {

    return "-";

  }


  const text =
    String(value).trim();


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


  return text;

}


/* =========================================================
   TODAY
========================================================= */

function todayStringFinal() {

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
   NORMALIZE TRANSACTION
========================================================= */

function normalizeTransactionFinal(
  row
) {

  if (
    !row ||
    typeof row !== "object"
  ) {

    return {};

  }


  return {

    id:
      row.ID ??
      row.id ??
      "",

    tanggal:
      row.Tanggal ??
      row.tanggal ??
      "",

    saham:
      row.Saham ??
      row.saham ??
      "",

    aksi:
      row.Aksi ??
      row.aksi ??
      "",

    harga:
      row.Harga ??
      row.harga ??
      0,

    lot:
      row.Lot ??
      row.lot ??
      0,

    profitRugi:
      row["Profit/Rugi"] ??
      row.profitRugi ??
      row.hasil ??
      "",

    nominal:
      row.Nominal ??
      row.nominal ??
      0,

    catatan:
      row.Catatan ??
      row.catatan ??
      "",

    timestamp:
      row.Timestamp ??
      row.timestamp ??
      ""

  };

}


/* =========================================================
   GET DATA DARI API
========================================================= */

async function getTradingDataFinal() {

  const result =
    await TradingAPI.getAllData();


  /*
   * API bisa mengembalikan:
   *
   * {
   *   transaksi: [...]
   * }
   *
   * atau:
   *
   * {
   *   data: {
   *     transaksi: [...]
   *   }
   * }
   */

  return (
    result?.data ||
    result ||
    {}
  );

}


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

async function loadTransactionsFinal() {

  try {

    setLoading(
      true,
      "Memuat data trading..."
    );


    const data =
      await getTradingDataFinal();


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


    TradingState.transaksi =
      transaksi;


    TradingState.summary =
      data.summary &&
      typeof data.summary === "object"
        ? data.summary
        : {};


    /*
     * Gunakan renderer Stage 1.
     */

    renderSummary();

    renderTransactions();


  } catch (error) {

    console.error(
      "[Trading] loadTransactionsFinal:",
      error
    );


    TradingState.transaksi =
      [];

    TradingState.summary =
      {};


    renderSummary();

    renderTransactions();


    showToast(
      "error",
      "Gagal",
      getErrorMessage(error)
    );


  } finally {

    setLoading(
      false
    );

  }

}


/* =========================================================
   FIND TRANSACTION BY ID
========================================================= */

async function findTransactionByIdFinal(
  id
) {

  if (!id) {

    return null;

  }


  /*
   * Cari dulu dari state.
   */

  const local =
    Array.isArray(
      TradingState.transaksi
    )
      ? TradingState.transaksi.find(
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
        )
      : null;


  if (local) {

    return normalizeTransactionFinal(
      local
    );

  }


  /*
   * Kalau tidak ada,
   * ambil ulang dari API.
   */

  const data =
    await getTradingDataFinal();


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


  return (
    transactions
      .map(
        normalizeTransactionFinal
      )
      .find(
        function (row) {

          return (
            String(row.id) ===
            String(id)
          );

        }
      ) ||
    null
  );

}


/* =========================================================
   READ FORM
========================================================= */

function getTransactionFormDataFinal() {

  return {

    tanggal:
      getInputValue(
        "tanggal"
      ),

    saham:
      getInputValue(
        "saham"
      ).toUpperCase(),

    aksi:
      getInputValue(
        "aksi"
      ).toUpperCase(),

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
      ).toUpperCase(),

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
   SET EDIT BUTTON
========================================================= */

function setTransactionEditModeFinal(
  isEdit
) {

  const button =
    document.getElementById(
      "saveTransactionButton"
    );


  if (!button) {

    return;

  }


  /*
   * Stage 1 menggunakan span:first-child.
   */

  const span =
    button.querySelector(
      "span:first-child"
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
   START EDIT TRANSACTION
========================================================= */

async function startEditTransactionFinal(
  id
) {

  if (!id) {

    showToast(
      "error",
      "Gagal",
      "ID transaksi tidak ditemukan."
    );

    return;

  }


  try {

    setLoading(
      true,
      "Memuat transaksi..."
    );


    const row =
      await findTransactionByIdFinal(
        id
      );


    if (!row) {

      throw new Error(
        "Transaksi tidak ditemukan."
      );

    }


    /*
     * =====================================================
     * INI BAGIAN PALING PENTING
     *
     * Jangan pakai editingTransactionId.
     *
     * State edit harus masuk ke:
     *
     * TradingState.editingId
     * =====================================================
     */

    TradingState.editingId =
      String(row.id);


    console.log(
      "[Trading] EDIT ID:",
      TradingState.editingId
    );


    /*
     * Isi form.
     */

    setInputValue(
      "tanggal",
      convertDateForInputFinal(
        row.tanggal
      )
    );


    setInputValue(
      "saham",
      row.saham
    );


    setInputValue(
      "aksi",
      row.aksi
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


    setTransactionEditModeFinal(
      true
    );


    updateCancelEditButtonFinal();


    const form =
      document.getElementById(
        "transactionForm"
      );


    if (form) {

      form.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }


    showToast(
      "success",
      "Mode Edit",
      "Data transaksi dimuat. Silakan ubah lalu tekan Update Transaksi."
    );


  } catch (error) {

    console.error(
      "[Trading] Start edit error:",
      error
    );


    showToast(
      "error",
      "Gagal",
      getErrorMessage(error)
    );


  } finally {

    setLoading(
      false
    );

  }

}


/* =========================================================
   CONVERT DATE
========================================================= */

function convertDateForInputFinal(
  value
) {

  if (!value) {

    return "";

  }


  const text =
    String(value).trim();


  /*
   * Sudah benar.
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


  /*
   * Format tanggal lainnya.
   */

  const date =
    new Date(text);


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

function cancelEditTransactionFinal() {

  TradingState.editingId =
    null;


  resetTransactionForm();


  setTransactionEditModeFinal(
    false
  );


  updateCancelEditButtonFinal();


  showToast(
    "success",
    "Edit Dibatalkan",
    "Form transaksi kembali ke mode tambah."
  );

}


/* =========================================================
   SAVE TRANSACTION
   FIX UTAMA
========================================================= */

async function saveTransactionFinal(
  form
) {

  /*
   * Validasi HTML.
   */

  if (
    form &&
    !form.checkValidity()
  ) {

    form.reportValidity();

    return;

  }


  const button =
    document.getElementById(
      "saveTransactionButton"
    );


  const data =
    getTransactionFormDataFinal();


  /*
   * =====================================================
   * AMBIL ID DARI SATU STATE SAJA
   * =====================================================
   */

  const editingId =
    TradingState.editingId
      ? String(
          TradingState.editingId
        ).trim()
      : "";


  console.log(
    "[Trading] save transaction:",
    {
      editingId:
        editingId || null,
      data:
        data
    }
  );


  try {

    setButtonLoading(
      button,
      true,
      editingId
        ? "Mengupdate..."
        : "Menyimpan..."
    );


    let result;


    /*
     * =====================================================
     * EDIT
     * =====================================================
     */

    if (editingId) {

      console.log(
        "[Trading] UPDATE TRANSACTION ID:",
        editingId
      );


      /*
       * ID DIKIRIM SEBAGAI ARGUMEN PERTAMA.
       */

      result =
        await TradingAPI.updateTransaction(
          editingId,
          data
        );


      showToast(
        "success",
        "Berhasil",
        result?.message ||
        "Transaksi berhasil diperbarui."
      );


    }


    /*
     * =====================================================
     * TAMBAH
     * =====================================================
     */

    else {

      console.log(
        "[Trading] ADD TRANSACTION"
      );


      result =
        await TradingAPI.addTransaction(
          data
        );


      showToast(
        "success",
        "Berhasil",
        result?.message ||
        "Transaksi berhasil disimpan."
      );

    }


    /*
     * Reset state edit.
     */

    TradingState.editingId =
      null;


    resetTransactionForm();


    setTransactionEditModeFinal(
      false
    );


    updateCancelEditButtonFinal();


    /*
     * Reload data.
     */

    await loadTransactionsFinal();


  } catch (error) {

    console.error(
      "[Trading] Save transaction error:",
      error
    );


    showToast(
      "error",
      "Gagal",
      getErrorMessage(error)
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
   DELETE TRANSACTION
========================================================= */

async function deleteTransactionFinal(
  id
) {

  if (!id) {

    showToast(
      "error",
      "Gagal",
      "ID transaksi tidak ditemukan."
    );

    return;

  }


  const transaction =
    Array.isArray(
      TradingState.transaksi
    )
      ? TradingState.transaksi.find(
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
        )
      : null;


  const saham =
    transaction
      ? getField(
          transaction,
          "Saham",
          "saham"
        )
      : "transaksi ini";


  const confirmed =
    window.confirm(
      "Hapus transaksi " +
      saham +
      "?\n\nData yang dihapus tidak dapat dikembalikan."
    );


  if (!confirmed) {

    return;

  }


  try {

    setLoading(
      true,
      "Menghapus transaksi..."
    );


    const result =
      await TradingAPI.deleteTransaction(
        String(id)
      );


    /*
     * Kalau transaksi yang sedang diedit
     * ikut dihapus, keluar dari mode edit.
     */

    if (
      TradingState.editingId &&
      String(
        TradingState.editingId
      ) ===
      String(id)
    ) {

      TradingState.editingId =
        null;


      resetTransactionForm();


      setTransactionEditModeFinal(
        false
      );


      updateCancelEditButtonFinal();

    }


    showToast(
      "success",
      "Berhasil",
      result?.message ||
      "Transaksi berhasil dihapus."
    );


    await loadTransactionsFinal();


  } catch (error) {

    console.error(
      "[Trading] Delete error:",
      error
    );


    showToast(
      "error",
      "Gagal",
      getErrorMessage(error)
    );


  } finally {

    setLoading(
      false
    );

  }

}


/* =========================================================
   TABLE ACTION
========================================================= */

function handleTransactionTableClickFinal(
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


  if (!id) {

    showToast(
      "error",
      "Gagal",
      "ID transaksi tidak ditemukan."
    );

    return;

  }


  if (
    action === "edit"
  ) {

    startEditTransactionFinal(
      id
    );

    return;

  }


  if (
    action === "delete"
  ) {

    deleteTransactionFinal(
      id
    );

  }

}


/* =========================================================
   ADD CAPITAL
========================================================= */

async function handleAddCapitalFinal(
  form
) {

  const tanggal =
    getInputValue(
      "addModalTanggal"
    );


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
      "error",
      "Gagal",
      "Tanggal modal wajib diisi."
    );

    return;

  }


  if (
    nominal <= 0
  ) {

    showToast(
      "error",
      "Gagal",
      "Nominal tambah modal harus lebih dari 0."
    );

    return;

  }


  const button =
    document.getElementById(
      "saveAddModalButton"
    );


  try {

    setButtonLoading(
      button,
      true,
      "Menyimpan..."
    );


    const result =
      await TradingAPI.addCapital(
        nominal,
        catatan,
        tanggal
      );


    if (form) {

      form.reset();

    }


    setInputValue(
      "addModalTanggal",
      todayStringFinal()
    );


    closeModal(
      "addModal"
    );


    showToast(
      "success",
      "Berhasil",
      result?.message ||
      "Modal berhasil ditambahkan."
    );


    await loadTransactionsFinal();


  } catch (error) {

    console.error(
      "[Trading] Add capital error:",
      error
    );


    showToast(
      "error",
      "Gagal",
      getErrorMessage(error)
    );


  } finally {

    setButtonLoading(
      button,
      false,
      "Simpan"
    );

  }

}


/* =========================================================
   WITHDRAW CAPITAL
========================================================= */

async function handleWithdrawCapitalFinal(
  form
) {

  const tanggal =
    getInputValue(
      "withdrawModalTanggal"
    );


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
      "error",
      "Gagal",
      "Tanggal penarikan wajib diisi."
    );

    return;

  }


  if (
    nominal <= 0
  ) {

    showToast(
      "error",
      "Gagal",
      "Nominal penarikan harus lebih dari 0."
    );

    return;

  }


  const button =
    document.getElementById(
      "saveWithdrawModalButton"
    );


  try {

    setButtonLoading(
      button,
      true,
      "Memproses..."
    );


    const result =
      await TradingAPI.withdrawCapital(
        nominal,
        catatan,
        tanggal
      );


    if (form) {

      form.reset();

    }


    setInputValue(
      "withdrawModalTanggal",
      todayStringFinal()
    );


    closeModal(
      "withdrawModal"
    );


    showToast(
      "success",
      "Berhasil",
      result?.message ||
      "Modal berhasil ditarik."
    );


    await loadTransactionsFinal();


  } catch (error) {

    console.error(
      "[Trading] Withdraw capital error:",
      error
    );


    showToast(
      "error",
      "Gagal",
      getErrorMessage(error)
    );


  } finally {

    setButtonLoading(
      button,
      false,
      "Tarik Modal"
    );

  }

}


/* =========================================================
   OPEN ADD CAPITAL
========================================================= */

function openAddCapitalModalFinal() {

  const form =
    document.getElementById(
      "addModalForm"
    );


  if (form) {

    form.reset();

  }


  setInputValue(
    "addModalTanggal",
    todayStringFinal()
  );


  openModal(
    "addModal"
  );

}


/* =========================================================
   OPEN WITHDRAW CAPITAL
========================================================= */

function openWithdrawCapitalModalFinal() {

  const form =
    document.getElementById(
      "withdrawModalForm"
    );


  if (form) {

    form.reset();

  }


  setInputValue(
    "withdrawModalTanggal",
    todayStringFinal()
  );


  openModal(
    "withdrawModal"
  );

}


/* =========================================================
   CANCEL BUTTON
========================================================= */

function createCancelEditButtonFinal() {

  const form =
    document.getElementById(
      "transactionForm"
    );


  const saveButton =
    document.getElementById(
      "saveTransactionButton"
    );


  if (
    !form ||
    !saveButton
  ) {

    return;

  }


  if (
    document.getElementById(
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
    function () {

      cancelEditTransactionFinal();

    }
  );


  saveButton.parentNode.insertBefore(
    button,
    saveButton
  );

}


/* =========================================================
   UPDATE CANCEL BUTTON
========================================================= */

function updateCancelEditButtonFinal() {

  const button =
    document.getElementById(
      "cancelEditButton"
    );


  if (!button) {

    return;

  }


  button.style.display =
    TradingState.editingId
      ? "block"
      : "none";

}


/* =========================================================
   MODAL BACKDROP
========================================================= */

function handleModalOverlayClickFinal(
  event
) {

  const overlay =
    event.currentTarget;


  if (
    event.target ===
    overlay
  ) {

    closeModal(
      overlay.id
    );

  }

}


/* =========================================================
   KEYBOARD
========================================================= */

function handleKeyboardFinal(
  event
) {

  if (
    event.key ===
    "Escape"
  ) {

    closeAllModals();

  }

}


/* =========================================================
   SETUP STAGE 2
========================================================= */

function setupTradingStage2Final() {

  /*
   * =====================================================
   * JANGAN PASANG SUBMIT LISTENER LAGI.
   *
   * Stage 1 sudah memasangnya.
   *
   * Kita hanya override fungsi submit yang dipakai
   * apabila dipanggil secara langsung.
   * =====================================================
   */


  /*
   * TABLE
   */

  const tableBody =
    document.getElementById(
      "transactionTableBody"
    );


  if (tableBody) {

    /*
     * Stage 1 sudah punya listener edit/delete
     * langsung di masing-masing button.
     *
     * Jadi jangan tambah listener table lagi.
     */

  }


  /*
   * Tombol tambah modal.
   */

  const addButton =
    document.getElementById(
      "addModalButton"
    );


  if (
    addButton &&
    !addButton.dataset.stage2Bound
  ) {

    addButton.dataset.stage2Bound =
      "true";


    addButton.addEventListener(
      "click",
      function () {

        openAddCapitalModalFinal();

      }
    );

  }


  /*
   * Tombol tarik modal.
   */

  const withdrawButton =
    document.getElementById(
      "withdrawModalButton"
    );


  if (
    withdrawButton &&
    !withdrawButton.dataset.stage2Bound
  ) {

    withdrawButton.dataset.stage2Bound =
      "true";


    withdrawButton.addEventListener(
      "click",
      function () {

        openWithdrawCapitalModalFinal();

      }
    );

  }


  /*
   * Tombol close.
   */

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(
      function (button) {

        if (
          button.dataset.stage2Bound
        ) {

          return;

        }


        button.dataset.stage2Bound =
          "true";


        button.addEventListener(
          "click",
          function () {

            const modal =
              button.closest(
                ".modal-overlay"
              );


            if (modal) {

              closeModal(
                modal.id
              );

            }

          }
        );

      }
    );


  /*
   * Backdrop modal.
   */

  document
    .querySelectorAll(
      ".modal-overlay"
    )
    .forEach(
      function (modal) {

        if (
          modal.dataset.stage2Bound
        ) {

          return;

        }


        modal.dataset.stage2Bound =
          "true";


        modal.addEventListener(
          "click",
          handleModalOverlayClickFinal
        );

      }
    );


  /*
   * ESC.
   */

  if (
    !document.body.dataset.tradingKeyboardBound
  ) {

    document.body.dataset.tradingKeyboardBound =
      "true";


    document.addEventListener(
      "keydown",
      handleKeyboardFinal
    );

  }


  /*
   * Cancel edit.
   */

  createCancelEditButtonFinal();

  updateCancelEditButtonFinal();

}


/* =========================================================
   REFRESH
========================================================= */

async function refreshTradingDataFinal() {

  try {

    setLoading(
      true,
      "Memuat data terbaru..."
    );


    await loadTransactionsFinal();


  } catch (error) {

    console.error(
      "[Trading] Refresh error:",
      error
    );


    showToast(
      "error",
      "Gagal",
      getErrorMessage(error)
    );


  } finally {

    setLoading(
      false
    );

  }

}


/* =========================================================
   OVERRIDE SUBMIT
========================================================= */

/*
 * Karena Stage 1 sudah memasang listener submit,
 * kita tidak menambahkan listener baru.
 *
 * Kita mengganti fungsi global yang bisa dipanggil
 * oleh bagian lain.
 */

window.saveTradingTransaction =
  function () {

    const form =
      document.getElementById(
        "transactionForm"
      );


    if (form) {

      return saveTransactionFinal(
        form
      );

    }

  };


/* =========================================================
   GLOBAL FINAL API
========================================================= */

window.TradingPageStage2 = {

  load:
    loadTransactionsFinal,

  refresh:
    refreshTradingDataFinal,

  edit:
    startEditTransactionFinal,

  delete:
    deleteTransactionFinal,

  cancelEdit:
    cancelEditTransactionFinal,

  addCapital:
    openAddCapitalModalFinal,

  withdrawCapital:
    openWithdrawCapitalModalFinal

};


/* =========================================================
   INITIALIZE STAGE 2
========================================================= */

function initTradingStage2Final() {

  console.log(
    "[Trading] Stage 2 initializing..."
  );


  /*
   * Pastikan state edit menggunakan state Stage 1.
   */

  if (
    typeof TradingState !== "undefined"
  ) {

    if (
      TradingState.editingId ===
      undefined
    ) {

      TradingState.editingId =
        null;

    }

  }


  setupTradingStage2Final();


  console.log(
    "[Trading] Stage 2 ready."
  );

}


/* =========================================================
   START STAGE 2
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initTradingStage2Final
  );

} else {

  initTradingStage2Final();

}


/* =========================================================
   FINAL LOG
========================================================= */

console.log(
  "[Trading] Stage 2 FIX loaded."
);

console.log(
  "[Trading] ADD + EDIT + DELETE + MODAL + REFRESH enabled."
);
