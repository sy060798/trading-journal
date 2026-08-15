/* =========================================================
   TRADING JOURNAL
   js/trading.js
   STAGE 1 / 2

   FUNGSI:
   - Load data
   - Summary
   - Tabel transaksi
   - Tambah transaksi
   - Tambah modal
   - Tarik modal
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

  setupCloseModal();

  setupKeyboardEvents();

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

    const data =
      await TradingAPI.getAllData();


    TradingState.transaksi =
      Array.isArray(
        data.transaksi
      )
        ? data.transaksi
        : [];


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
      "error",
      "Gagal memuat",
      getErrorMessage(error)
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
      "profit-negative"
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


  /*
   * Warna nilai profit/loss.
   */

  const profitValue =
    document.getElementById(
      "profitLossValue"
    );


  if (profitValue) {

    profitValue.classList.remove(
      "profit-positive",
      "profit-negative"
    );


    if (netProfit > 0) {

      profitValue.classList.add(
        "profit-positive"
      );

    }


    if (netProfit < 0) {

      profitValue.classList.add(
        "profit-negative"
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
   * Ambil maksimal transaksi terbaru.
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
   CREATE TRANSACTION ROW
========================================================= */

function createTransactionRow(
  transaction
) {

  const row =
    document.createElement(
      "tr"
    );


  const id =
    getTransactionId(
      transaction
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
      "profitRugi"
    );


  const nominal =
    toNumber(
      getField(
        transaction,
        "Nominal",
        "nominal"
      )
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
        data-id="${escapeAttribute(id)}"
      >
        Edit
      </button>

      <button
        type="button"
        class="table-action-button delete-transaction-button"
        data-id="${escapeAttribute(id)}"
      >
        Hapus
      </button>

    </td>

  `;


  const editButton =
    row.querySelector(
      ".edit-transaction-button"
    );


  const deleteButton =
    row.querySelector(
      ".delete-transaction-button"
    );


  if (editButton) {

    editButton.addEventListener(
      "click",
      function () {

        handleEditTransaction(
          id
        );

      }
    );

  }


  if (deleteButton) {

    deleteButton.addEventListener(
      "click",
      function () {

        handleDeleteTransaction(
          id
        );

      }
    );

  }


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
      <span class="result-badge result-profit">
        PROFIT
      </span>
    `;

  }


  if (value === "RUGI") {

    return `
      <span class="result-badge result-loss">
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
    .toUpperCase();


  if (value === "BUY") {

    return "action-buy";

  }


  if (value === "SELL") {

    return "action-sell";

  }


  return "";

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
   SUBMIT TRANSACTION
========================================================= */

async function handleTransactionSubmit(
  form
) {

  const button =
    document.getElementById(
      "saveTransactionButton"
    );


  const data = {

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


  try {

    setButtonLoading(
      button,
      true,
      "Menyimpan..."
    );


    /*
     * Kalau sedang edit.
     */

    if (
      TradingState.editingId
    ) {

      await TradingAPI.updateTransaction(
        TradingState.editingId,
        data
      );


      showToast(
        "success",
        "Berhasil",
        "Transaksi berhasil diperbarui."
      );


    } else {

      await TradingAPI.addTransaction(
        data
      );


      showToast(
        "success",
        "Berhasil",
        "Transaksi berhasil disimpan."
      );

    }


    resetTransactionForm();

    TradingState.editingId =
      null;


    await loadTradingData();


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
   EDIT TRANSACTION
========================================================= */

function handleEditTransaction(
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
      "error",
      "Gagal",
      "Data transaksi tidak ditemukan."
    );

    return;

  }


  TradingState.editingId =
    id;


  setInputValue(
    "tanggal",
    getField(
      transaction,
      "Tanggal",
      "tanggal"
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


  const button =
    document.getElementById(
      "saveTransactionButton"
    );


  if (button) {

    const span =
      button.querySelector(
        "span:first-child"
      );


    if (span) {

      span.textContent =
        "Update Transaksi";

    } else {

      button.textContent =
        "Update Transaksi";

    }

  }


  const panel =
    document.querySelector(
      ".transaction-panel"
    );


  if (panel) {

    panel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  showToast(
    "success",
    "Mode Edit",
    "Silakan ubah data transaksi."
  );

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function handleDeleteTransaction(
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


    await TradingAPI.deleteTransaction(
      id
    );


    showToast(
      "success",
      "Berhasil",
      "Transaksi berhasil dihapus."
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "[Trading] Delete error:",
      error
    );


    showToast(
      "error",
      "Gagal menghapus",
      getErrorMessage(error)
    );


  } finally {

    setLoading(
      false
    );

  }

}


/* =========================================================
   RESET FORM
========================================================= */

function resetTransactionForm() {

  const form =
    document.getElementById(
      "transactionForm"
    );


  if (form) {

    form.reset();

  }


  TradingState.editingId =
    null;


  setInputValue(
    "tanggal",
    getTodayString()
  );


  setInputValue(
    "profitRugi",
    ""
  );


  updateNominalVisibility();


  const button =
    document.getElementById(
      "saveTransactionButton"
    );


  if (button) {

    const span =
      button.querySelector(
        "span:first-child"
      );


    if (span) {

      span.textContent =
        "Simpan Transaksi";

    }

  }

}


/* =========================================================
   PROFIT FIELD
========================================================= */

function setupProfitField() {

  const select =
    document.getElementById(
      "profitRugi"
    );


  if (!select) {

    return;

  }


  select.addEventListener(
    "change",
    updateNominalVisibility
  );


  updateNominalVisibility();

}


/* =========================================================
   NOMINAL VISIBILITY
========================================================= */

function updateNominalVisibility() {

  const select =
    document.getElementById(
      "profitRugi"
    );


  const group =
    document.getElementById(
      "nominalGroup"
    );


  const input =
    document.getElementById(
      "nominal"
    );


  if (!select) {

    return;

  }


  const value =
    String(
      select.value || ""
    )
    .toUpperCase();


  const hasResult =
    value === "PROFIT" ||
    value === "RUGI";


  if (group) {

    if (hasResult) {

      group.classList.remove(
        "hidden"
      );

    } else {

      group.classList.add(
        "hidden"
      );

    }

  }


  if (input) {

    input.required =
      hasResult;


    if (!hasResult) {

      input.value =
        "";

    }

  }

}


/* =========================================================
   MODAL BUTTONS
========================================================= */

function setupModalButtons() {

  const addButton =
    document.getElementById(
      "addModalButton"
    );


  const withdrawButton =
    document.getElementById(
      "withdrawModalButton"
    );


  if (addButton) {

    addButton.addEventListener(
      "click",
      function () {

        openModal(
          "addModal"
        );

      }
    );

  }


  if (withdrawButton) {

    withdrawButton.addEventListener(
      "click",
      function () {

        openModal(
          "withdrawModal"
        );

      }
    );

  }

}


/* =========================================================
   MODAL FORMS
========================================================= */

function setupModalForms() {

  const addForm =
    document.getElementById(
      "addModalForm"
    );


  const withdrawForm =
    document.getElementById(
      "withdrawModalForm"
    );


  if (addForm) {

    addForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();

        await handleAddCapital(
          addForm
        );

      }
    );

  }


  if (withdrawForm) {

    withdrawForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();

        await handleWithdrawCapital(
          withdrawForm
        );

      }
    );

  }

}


/* =========================================================
   ADD CAPITAL
========================================================= */

async function handleAddCapital(
  form
) {

  const button =
    document.getElementById(
      "saveAddModalButton"
    );


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


  try {

    setButtonLoading(
      button,
      true,
      "Menyimpan..."
    );


    await TradingAPI.addCapital(
      nominal,
      catatan,
      tanggal
    );


    closeAllModals();

    form.reset();


    setInputValue(
      "addModalTanggal",
      getTodayString()
    );


    showToast(
      "success",
      "Berhasil",
      "Modal berhasil ditambahkan."
    );


    await loadTradingData();


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

async function handleWithdrawCapital(
  form
) {

  const button =
    document.getElementById(
      "saveWithdrawModalButton"
    );


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


  try {

    setButtonLoading(
      button,
      true,
      "Memproses..."
    );


    await TradingAPI.withdrawCapital(
      nominal,
      catatan,
      tanggal
    );


    closeAllModals();

    form.reset();


    setInputValue(
      "withdrawModalTanggal",
      getTodayString()
    );


    showToast(
      "success",
      "Berhasil",
      "Modal berhasil ditarik."
    );


    await loadTradingData();


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
   OPEN MODAL
========================================================= */

function openModal(
  id
) {

  const modal =
    document.getElementById(
      id
    );


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "hidden"
  );


  document.body.classList.add(
    "modal-open"
  );


  if (
    id === "addModal"
  ) {

    setInputValue(
      "addModalTanggal",
      getTodayString()
    );

  }


  if (
    id === "withdrawModal"
  ) {

    setInputValue(
      "withdrawModalTanggal",
      getTodayString()
    );

  }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal(
  id
) {

  const modal =
    document.getElementById(
      id
    );


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
   CLOSE ALL
========================================================= */

function closeAllModals() {

  document
    .querySelectorAll(
      ".modal-overlay"
    )
    .forEach(
      function (modal) {

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
   CLOSE EVENTS
========================================================= */

function setupCloseModal() {

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(
      function (button) {

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


  document
    .querySelectorAll(
      ".modal-overlay"
    )
    .forEach(
      function (overlay) {

        overlay.addEventListener(
          "click",
          function (event) {

            if (
              event.target ===
              overlay
            ) {

              closeModal(
                overlay.id
              );

            }

          }
        );

      }
    );

}


/* =========================================================
   KEYBOARD
========================================================= */

function setupKeyboardEvents() {

  document.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key === "Escape"
      ) {

        closeAllModals();

      }

    }
  );

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
  active,
  message = "Memuat..."
) {

  TradingState.loading =
    active;


  const loading =
    document.getElementById(
      "transactionLoading"
    );


  const loadingText =
    loading
      ? loading.querySelector(
          "span"
        )
      : null;


  if (active) {

    if (loading) {

      loading.classList.remove(
        "hidden"
      );

    }


    if (loadingText) {

      loadingText.textContent =
        message;

    }

  } else {

    if (loading) {

      loading.classList.add(
        "hidden"
      );

    }

  }


  /*
   * Global loading jika tersedia.
   */

  const global =
    document.getElementById(
      "globalLoading"
    );


  const globalText =
    document.getElementById(
      "globalLoadingText"
    );


  if (global) {

    if (active) {

      global.classList.remove(
        "hidden"
      );

    } else {

      global.classList.add(
        "hidden"
      );

    }

  }


  if (
    globalText &&
    active
  ) {

    globalText.textContent =
      message;

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

    button.disabled =
      true;


    button.dataset.originalText =
      button.textContent;


    button.textContent =
      text;

  } else {

    button.disabled =
      false;


    button.textContent =
      text ||
      button.dataset.originalText ||
      "Simpan";

  }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  type,
  title,
  message
) {

  const toast =
    document.getElementById(
      "toast"
    );


  const toastIcon =
    document.getElementById(
      "toastIcon"
    );


  const toastTitle =
    document.getElementById(
      "toastTitle"
    );


  const toastMessage =
    document.getElementById(
      "toastMessage"
    );


  if (!toast) {

    console.log(
      title + ": " + message
    );

    return;

  }


  toast.classList.remove(
    "hidden",
    "toast-success",
    "toast-error"
  );


  if (
    type === "error"
  ) {

    toast.classList.add(
      "toast-error"
    );

    if (toastIcon) {

      toastIcon.textContent =
        "×";

    }

  } else {

    toast.classList.add(
      "toast-success"
    );

    if (toastIcon) {

      toastIcon.textContent =
        "✓";

    }

  }


  if (toastTitle) {

    toastTitle.textContent =
      title;

  }


  if (toastMessage) {

    toastMessage.textContent =
      message;

  }


  clearTimeout(
    window.__tradingToastTimer
  );


  window.__tradingToastTimer =
    setTimeout(
      function () {

        toast.classList.add(
          "hidden"
        );

      },
      4000
    );

}


/* =========================================================
   HELPERS
========================================================= */

function getInputValue(
  id
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {

    return "";

  }


  return String(
    element.value || ""
  ).trim();

}


function getInputNumber(
  id
) {

  const value =
    getInputValue(
      id
    );


  if (!value) {

    return 0;

  }


  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


function setInputValue(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.value =
      value ??
      "";

  }

}


function setText(
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


  const number =
    Number(
      String(value)
        .replace(
          /[^\d.-]/g,
          ""
        )
    );


  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


function formatNumber(
  value
) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    toNumber(value)
  );

}


function formatRupiah(
  value
) {

  return (
    "Rp" +
    new Intl.NumberFormat(
      "id-ID"
    ).format(
      toNumber(value)
    )
  );

}


function formatDisplayDate(
  value
) {

  if (!value) {

    return "-";

  }


  const string =
    String(value)
      .trim();


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      string
    )
  ) {

    const parts =
      string.split("-");


    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  return string;

}


function getField(
  object,
  primary,
  secondary
) {

  if (
    object &&
    object[primary] !== undefined
  ) {

    return object[primary];

  }


  if (
    object &&
    object[secondary] !== undefined
  ) {

    return object[secondary];

  }


  return "";

}


function getTransactionId(
  transaction
) {

  return getField(
    transaction,
    "ID",
    "id"
  );

}


function getErrorMessage(
  error
) {

  if (!error) {

    return "Terjadi kesalahan.";

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


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.TradingPage = {

  load:
    loadTradingData,

  refresh:
    refreshTradingData,

  edit:
    handleEditTransaction,

  remove:
    handleDeleteTransaction,

  openModal:
    openModal,

  closeModal:
    closeModal,

  closeAllModals:
    closeAllModals

};


console.log(
  "[Trading] Stage 1 loaded."
);

/* =========================================================
   TRADING JOURNAL
   trading.js
   STAGE 2 / FINAL
   EDIT + DELETE + MODAL + REFRESH + UI
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let editingTransactionId = null;


/* =========================================================
   DOM HELPER
========================================================= */

function el(id) {
  return document.getElementById(id);
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(value) {

  const number = Number(value) || 0;

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

  const text = String(value);

  /*
   * YYYY-MM-DD
   */

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {

    const parts = text.split("-");

    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }

  /*
   * Jika sudah tanggal lain,
   * coba Date.
   */

  const date = new Date(value);

  if (!isNaN(date.getTime())) {

    return new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    ).format(date);

  }

  return escapeHtml(value);

}


/* =========================================================
   TODAY
========================================================= */

function todayString() {

  const now = new Date();

  return (
    now.getFullYear() +
    "-" +
    String(
      now.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      now.getDate()
    ).padStart(2, "0")
  );

}


/* =========================================================
   SET INPUT TODAY
========================================================= */

function setDefaultDates() {

  const today = todayString();

  const tanggal = el("tanggal");
  const addTanggal = el("addModalTanggal");
  const withdrawTanggal = el("withdrawModalTanggal");

  if (tanggal && !tanggal.value) {
    tanggal.value = today;
  }

  if (addTanggal && !addTanggal.value) {
    addTanggal.value = today;
  }

  if (withdrawTanggal && !withdrawTanggal.value) {
    withdrawTanggal.value = today;
  }

}


/* =========================================================
   SHOW GLOBAL LOADING
========================================================= */

function showLoading(message = "Memproses...") {

  const loading = el("globalLoading");
  const text = el("globalLoadingText");

  if (text) {
    text.textContent = message;
  }

  if (loading) {
    loading.classList.remove("hidden");
  }

}


/* =========================================================
   HIDE GLOBAL LOADING
========================================================= */

function hideLoading() {

  const loading = el("globalLoading");

  if (loading) {
    loading.classList.add("hidden");
  }

}


/* =========================================================
   SHOW TOAST
========================================================= */

let toastTimer = null;

function showToast(
  message,
  type = "success",
  title = ""
) {

  const toast = el("toast");
  const toastIcon = el("toastIcon");
  const toastTitle = el("toastTitle");
  const toastMessage = el("toastMessage");

  if (!toast) {
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
    toastTitle.textContent = title;
  }

  if (toastMessage) {
    toastMessage.textContent = message;
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
    "warning"
  );

  toast.classList.add(type);

  clearTimeout(toastTimer);

  toastTimer = setTimeout(
    function () {

      toast.classList.add("hidden");

    },
    3500
  );

}


/* =========================================================
   CLOSE TOAST
========================================================= */

function hideToast() {

  const toast = el("toast");

  if (toast) {
    toast.classList.add("hidden");
  }

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openModal(id) {

  const modal = el(id);

  if (!modal) {
    return;
  }

  modal.classList.remove("hidden");

  document.body.classList.add("modal-open");

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal(id) {

  const modal = el(id);

  if (!modal) {
    return;
  }

  modal.classList.add("hidden");

  document.body.classList.remove("modal-open");

}


/* =========================================================
   CLOSE ALL MODAL
========================================================= */

function closeAllModals() {

  closeModal("addModal");
  closeModal("withdrawModal");

}


/* =========================================================
   NORMALIZE ROW
========================================================= */

function normalizeRow(row) {

  if (!row || typeof row !== "object") {
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
   GET TRANSACTION DATA
========================================================= */

async function loadTransactions() {

  setTransactionLoading(true);

  try {

    const result =
      await TradingAPI.getAllData();

    const data =
      result?.data ||
      result ||
      {};

    const transaksi =
      Array.isArray(data.transaksi)
        ? data.transaksi
        : Array.isArray(data.transactions)
          ? data.transactions
          : [];

    renderTransactions(transaksi);

    renderSummary(
      data.summary || {}
    );

  } catch (error) {

    console.error(
      "[Trading] loadTransactions:",
      error
    );

    renderTransactions([]);

    showToast(
      error.message ||
      "Gagal mengambil data dari Google Sheets.",
      "error"
    );

  } finally {

    setTransactionLoading(false);

  }

}


/* =========================================================
   LOADING TRANSACTION STATE
========================================================= */

function setTransactionLoading(isLoading) {

  const loading =
    el("transactionLoading");

  const empty =
    el("transactionEmpty");

  const table =
    el("transactionTableWrapper");

  if (isLoading) {

    if (loading) {
      loading.classList.remove("hidden");
    }

    if (empty) {
      empty.classList.add("hidden");
    }

    if (table) {
      table.classList.add("hidden");
    }

    return;

  }

  if (loading) {
    loading.classList.add("hidden");
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
    return;
  }

  tbody.innerHTML = "";

  if (
    !Array.isArray(transactions) ||
    transactions.length === 0
  ) {

    if (empty) {
      empty.classList.remove("hidden");
    }

    if (table) {
      table.classList.add("hidden");
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
        normalizeRow(raw);

      const tr =
        document.createElement("tr");

      const hasil =
        String(
          row.profitRugi || ""
        ).toUpperCase();

      let hasilClass = "";

      if (hasil === "PROFIT") {
        hasilClass = "profit";
      }

      if (hasil === "RUGI") {
        hasilClass = "loss";
      }

      const aksi =
        String(row.aksi || "")
          .toUpperCase();

      const aksiClass =
        aksi === "BUY"
          ? "buy"
          : aksi === "SELL"
            ? "sell"
            : "";

      tr.innerHTML = `

        <td>
          ${escapeHtml(
            formatTanggal(row.tanggal)
          )}
        </td>

        <td>
          <strong>
            ${escapeHtml(row.saham)}
          </strong>
        </td>

        <td>
          <span class="trade-badge ${aksiClass}">
            ${escapeHtml(aksi)}
          </span>
        </td>

        <td>
          ${formatNumber(row.harga)}
        </td>

        <td>
          ${formatNumber(row.lot)}
        </td>

        <td>
          ${
            hasil
              ? `
                <span class="result-badge ${hasilClass}">
                  ${escapeHtml(hasil)}
                </span>
              `
              : "-"
          }
        </td>

        <td>
          ${
            hasil
              ? formatRupiah(row.nominal)
              : "-"
          }
        </td>

        <td class="transaction-actions">

          <button
            type="button"
            class="table-action edit"
            data-action="edit"
            data-id="${escapeHtml(row.id)}"
          >
            Edit
          </button>

          <button
            type="button"
            class="table-action delete"
            data-action="delete"
            data-id="${escapeHtml(row.id)}"
          >
            Hapus
          </button>

        </td>

      `;

      tbody.appendChild(tr);

    }
  );

  if (empty) {
    empty.classList.add("hidden");
  }

  if (table) {
    table.classList.remove("hidden");
  }

}


/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary(summary) {

  if (!summary) {
    summary = {};
  }

  const modal =
    Number(summary.modal) || 0;

  const netProfit =
    Number(summary.netProfit) || 0;

  const total =
    Number(summary.total) ||
    modal + netProfit;

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
      formatRupiah(modal);
  }

  if (profitLossValue) {

    profitLossValue.textContent =
      formatRupiah(netProfit);

    profitLossValue.classList.remove(
      "positive",
      "negative"
    );

    if (netProfit > 0) {
      profitLossValue.classList.add(
        "positive"
      );
    }

    if (netProfit < 0) {
      profitLossValue.classList.add(
        "negative"
      );
    }

  }

  if (totalValue) {
    totalValue.textContent =
      formatRupiah(total);
  }

  if (profitDescription) {

    if (netProfit > 0) {

      profitDescription.textContent =
        "Trading menghasilkan profit";

    } else if (netProfit < 0) {

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
   READ TRANSACTION FORM
========================================================= */

function getTransactionFormData() {

  const data = {

    tanggal:
      el("tanggal")?.value || "",

    saham:
      el("saham")?.value || "",

    aksi:
      el("aksi")?.value || "",

    harga:
      Number(
        el("harga")?.value || 0
      ),

    lot:
      Number(
        el("lot")?.value || 0
      ),

    profitRugi:
      el("profitRugi")?.value || "",

    nominal:
      Number(
        el("nominal")?.value || 0
      ),

    catatan:
      el("catatan")?.value || ""

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
    aksi.value = "BUY";
  }

  const profitRugi =
    el("profitRugi");

  if (profitRugi) {
    profitRugi.value = "";
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

  if (!select || !group) {
    return;
  }

  const hasResult =
    select.value === "PROFIT" ||
    select.value === "RUGI";

  if (hasResult) {

    group.classList.remove("hidden");

    if (nominal) {
      nominal.required = true;
    }

  } else {

    group.classList.add("hidden");

    if (nominal) {

      nominal.required = false;
      nominal.value = "";

    }

  }

}


/* =========================================================
   SAVE TRANSACTION
========================================================= */

async function handleTransactionSubmit(event) {

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

    showLoading(
      editingTransactionId
        ? "Mengubah transaksi..."
        : "Menyimpan transaksi..."
    );

    let result;

    if (editingTransactionId) {

      result =
        await TradingAPI.updateTransaction(
          editingTransactionId,
          data
        );

    } else {

      result =
        await TradingAPI.addTransaction(
          data
        );

    }

    console.log(
      "[Trading] save result:",
      result
    );

    editingTransactionId = null;

    clearTransactionForm();

    setTransactionEditMode(false);

    await loadTransactions();

    showToast(
      result?.message ||
      "Transaksi berhasil disimpan.",
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
   EDIT MODE
========================================================= */

function setTransactionEditMode(isEdit) {

  const button =
    el("saveTransactionButton");

  if (!button) {
    return;
  }

  const span =
    button.querySelector("span");

  if (span) {

    span.textContent =
      isEdit
        ? "Update Transaksi"
        : "Simpan Transaksi";

  }

}


/* =========================================================
   FIND TRANSACTION
========================================================= */

async function findTransactionById(id) {

  const result =
    await TradingAPI.getAllData();

  const data =
    result?.data ||
    result ||
    {};

  const transactions =
    Array.isArray(data.transaksi)
      ? data.transaksi
      : [];

  return transactions
    .map(normalizeRow)
    .find(
      function(row) {

        return String(row.id) ===
          String(id);

      }
    );

}


/* =========================================================
   START EDIT
========================================================= */

async function startEditTransaction(id) {

  if (!id) {

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

    const row =
      await findTransactionById(id);

    if (!row) {

      throw new Error(
        "Transaksi tidak ditemukan."
      );

    }

    editingTransactionId =
      id;

    if (el("tanggal")) {
      el("tanggal").value =
        convertDateForInput(
          row.tanggal
        );
    }

    if (el("saham")) {
      el("saham").value =
        row.saham || "";
    }

    if (el("aksi")) {
      el("aksi").value =
        row.aksi || "BUY";
    }

    if (el("harga")) {
      el("harga").value =
        row.harga || "";
    }

    if (el("lot")) {
      el("lot").value =
        row.lot || "";
    }

    if (el("profitRugi")) {
      el("profitRugi").value =
        row.profitRugi || "";
    }

    if (el("nominal")) {
      el("nominal").value =
        row.nominal || "";
    }

    if (el("catatan")) {
      el("catatan").value =
        row.catatan || "";
    }

    updateNominalVisibility();

    setTransactionEditMode(true);

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
      "success"
    );

  } catch (error) {

    console.error(
      "[Trading] edit:",
      error
    );

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

function convertDateForInput(value) {

  if (!value) {
    return "";
  }

  const text =
    String(value).trim();

  /*
   * Sudah YYYY-MM-DD
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(text)
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
    new Date(text);

  if (isNaN(date.getTime())) {
    return "";
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


/* =========================================================
   CANCEL EDIT
========================================================= */

function cancelEditTransaction() {

  editingTransactionId = null;

  clearTransactionForm();

  setTransactionEditMode(false);

  showToast(
    "Edit transaksi dibatalkan.",
    "success"
  );

}


/* =========================================================
   DELETE CONFIRM
========================================================= */

async function handleDeleteTransaction(id) {

  if (!id) {

    showToast(
      "ID transaksi tidak ditemukan.",
      "error"
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

    const result =
      await TradingAPI.deleteTransaction(
        id
      );

    if (
      String(editingTransactionId) ===
      String(id)
    ) {

      editingTransactionId = null;

      clearTransactionForm();

      setTransactionEditMode(false);

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

function handleTableClick(event) {

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

  if (action === "edit") {

    startEditTransaction(id);

    return;

  }

  if (action === "delete") {

    handleDeleteTransaction(id);

  }

}


/* =========================================================
   ADD MODAL FORM
========================================================= */

async function handleAddModalSubmit(event) {

  event.preventDefault();

  const tanggal =
    el("addModalTanggal")?.value ||
    todayString();

  const nominal =
    Number(
      el("addModalNominal")?.value || 0
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
    !Number.isFinite(nominal) ||
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

    if (el("addModalTanggal")) {
      el("addModalTanggal").value =
        todayString();
    }

    closeModal("addModal");

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
   WITHDRAW MODAL FORM
========================================================= */

async function handleWithdrawModalSubmit(event) {

  event.preventDefault();

  const tanggal =
    el("withdrawModalTanggal")?.value ||
    todayString();

  const nominal =
    Number(
      el("withdrawModalNominal")?.value || 0
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
    !Number.isFinite(nominal) ||
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

    if (el("withdrawModalTanggal")) {
      el("withdrawModalTanggal").value =
        todayString();
    }

    closeModal("withdrawModal");

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
   OPEN ADD MODAL
========================================================= */

function openAddCapitalModal() {

  const form =
    el("addModalForm");

  if (form) {
    form.reset();
  }

  if (el("addModalTanggal")) {
    el("addModalTanggal").value =
      todayString();
  }

  openModal("addModal");

}


/* =========================================================
   OPEN WITHDRAW MODAL
========================================================= */

function openWithdrawCapitalModal() {

  const form =
    el("withdrawModalForm");

  if (form) {
    form.reset();
  }

  if (el("withdrawModalTanggal")) {
    el("withdrawModalTanggal").value =
      todayString();
  }

  openModal("withdrawModal");

}


/* =========================================================
   MODAL BACKDROP
========================================================= */

function handleModalOverlayClick(event) {

  if (
    event.target.classList.contains(
      "modal-overlay"
    )
  ) {

    event.target.classList.add(
      "hidden"
    );

    document.body.classList.remove(
      "modal-open"
    );

  }

}


/* =========================================================
   KEYBOARD ESC
========================================================= */

function handleKeyboard(event) {

  if (event.key !== "Escape") {
    return;
  }

  closeAllModals();

}


/* =========================================================
   BUTTON EVENT SETUP
========================================================= */

function setupButtons() {

  const addButton =
    el("addModalButton");

  if (addButton) {

    addButton.addEventListener(
      "click",
      openAddCapitalModal
    );

  }


  const withdrawButton =
    el("withdrawModalButton");

  if (withdrawButton) {

    withdrawButton.addEventListener(
      "click",
      openWithdrawCapitalModal
    );

  }


  const transactionForm =
    el("transactionForm");

  if (transactionForm) {

    transactionForm.addEventListener(
      "submit",
      handleTransactionSubmit
    );

  }


  const addForm =
    el("addModalForm");

  if (addForm) {

    addForm.addEventListener(
      "submit",
      handleAddModalSubmit
    );

  }


  const withdrawForm =
    el("withdrawModalForm");

  if (withdrawForm) {

    withdrawForm.addEventListener(
      "submit",
      handleWithdrawModalSubmit
    );

  }


  const tableBody =
    el("transactionTableBody");

  if (tableBody) {

    tableBody.addEventListener(
      "click",
      handleTableClick
    );

  }


  const profitRugi =
    el("profitRugi");

  if (profitRugi) {

    profitRugi.addEventListener(
      "change",
      updateNominalVisibility
    );

  }


  /*
   * Tombol tutup modal
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

            closeAllModals();

          }
        );

      }
    );


  /*
   * Klik backdrop
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


  document.addEventListener(
    "keydown",
    handleKeyboard
  );

}


/* =========================================================
   ADD CANCEL EDIT BUTTON
   Dibuat otomatis jika HTML belum punya.
========================================================= */

function createCancelEditButton() {

  const form =
    el("transactionForm");

  const saveButton =
    el("saveTransactionButton");

  if (!form || !saveButton) {
    return;
  }

  if (
    el("cancelEditButton")
  ) {
    return;
  }

  const button =
    document.createElement("button");

  button.type = "button";
  button.id = "cancelEditButton";
  button.className = "secondary-button";
  button.textContent = "Batal Edit";
  button.style.display = "none";

  button.addEventListener(
    "click",
    function() {

      cancelEditTransaction();

      button.style.display = "none";

    }
  );

  saveButton.parentNode.insertBefore(
    button,
    saveButton
  );

}


/* =========================================================
   UPDATE EDIT BUTTON STATE
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
   WATCH EDIT STATE
========================================================= */

function setEditState() {

  const original =
    setTransactionEditMode;

  /*
   * Tidak mengganti fungsi asli.
   * State tombol diperbarui setelah interval kecil.
   */

  setInterval(
    updateCancelEditButton,
    300
  );

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

    setupButtons();

    createCancelEditButton();

    setDefaultDates();

    updateNominalVisibility();

    setEditState();

    await loadTransactions();

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

  addCapital:
    openAddCapitalModal,

  withdrawCapital:
    openWithdrawCapitalModal,

  closeModals:
    closeAllModals,

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
  "[Trading] trading.js Stage 2 loaded."
);

console.log(
  "[Trading] ADD + EDIT + DELETE + MODAL enabled."
);
