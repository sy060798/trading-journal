/* =========================================================
   TRADING JOURNAL
   trading.js
   VERSION: STAGE 2
   EDIT + DELETE + PROFIT/LOSS
   NO GLOBAL LOADING SPINNER
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let transactions = [];
let capitalData = {};
let summaryData = {};

let currentTransactionId = null;

let isLoadingTradingData = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeTradingPage();

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeTradingPage() {

  setDefaultDate();

  setupFormEvents();

  setupModalEvents();

  setupActionButtons();

  setupProfitLossEvents();

  await loadTradingData();

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDate() {

  const inputs = [

    "tanggal",
    "addModalTanggal",
    "withdrawModalTanggal"

  ];


  const today =
    getTodayDate();


  inputs.forEach(
    function (id) {

      const input =
        document.getElementById(id);


      if (
        input &&
        !input.value
      ) {

        input.value =
          today;

      }

    }
  );

}


/* =========================================================
   TODAY
========================================================= */

function getTodayDate() {

  const today =
    new Date();


  return (
    today.getFullYear() +
    "-" +
    String(
      today.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      today.getDate()
    ).padStart(2, "0")
  );

}


/* =========================================================
   FORM EVENTS
========================================================= */

function setupFormEvents() {

  const form =
    document.getElementById(
      "transactionForm"
    );


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    handleTransactionSubmit
  );


  const resetButton =
    document.getElementById(
      "resetFormButton"
    );


  if (resetButton) {

    resetButton.addEventListener(
      "click",
      resetTransactionForm
    );

  }

}


/* =========================================================
   ACTION BUTTONS
========================================================= */

function setupActionButtons() {

  const addModalButton =
    document.getElementById(
      "addModalButton"
    );


  if (addModalButton) {

    addModalButton.addEventListener(
      "click",
      function () {

        openCapitalModal("add");

      }
    );

  }


  const withdrawModalButton =
    document.getElementById(
      "withdrawModalButton"
    );


  if (withdrawModalButton) {

    withdrawModalButton.addEventListener(
      "click",
      function () {

        openCapitalModal("withdraw");

      }
    );

  }


  const refreshButton =
    document.getElementById(
      "refreshButton"
    );


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      loadTradingData
    );

  }

}


/* =========================================================
   PROFIT LOSS
========================================================= */

function setupProfitLossEvents() {

  const select =
    document.getElementById(
      "profitRugi"
    );


  const nominal =
    document.getElementById(
      "nominal"
    );


  const nominalGroup =
    document.getElementById(
      "nominalGroup"
    );


  if (!select || !nominal) {
    return;
  }


  function updateNominalState() {

    const value =
      select.value;


    const active =
      value === "PROFIT" ||
      value === "RUGI";


    nominal.disabled =
      !active;


    nominal.required =
      active;


    if (nominalGroup) {

      nominalGroup.classList.toggle(
        "disabled",
        !active
      );

    }


    if (!active) {

      nominal.value = "";

    }

  }


  select.addEventListener(
    "change",
    updateNominalState
  );


  updateNominalState();

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadTradingData() {

  if (isLoadingTradingData) {
    return;
  }


  isLoadingTradingData = true;


  try {

    let result;


    if (
      window.TradingAPI &&
      typeof window.TradingAPI.getAllData === "function"
    ) {

      result =
        await window.TradingAPI.getAllData();

    } else {

      throw new Error(
        "TradingAPI belum tersedia. Pastikan api.js dimuat sebelum trading.js."
      );

    }


    if (
      result &&
      result.data
    ) {

      result =
        result.data;

    }


    transactions =
      Array.isArray(
        result?.transaksi
      )
        ? result.transaksi
        : [];


    summaryData =
      result?.summary ||
      {};


    capitalData =
      summaryData;


    updateCapitalDisplay();

    renderTransactions();

    updateTransactionCount();


  } catch (error) {

    console.error(
      "Load trading data error:",
      error
    );


    showToast(
      "Gagal memuat data",
      getApiErrorMessage(error),
      "error"
    );


  } finally {

    isLoadingTradingData = false;

  }

}


/* =========================================================
   SUBMIT NEW TRANSACTION
========================================================= */

async function handleTransactionSubmit(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  const formData =
    new FormData(form);


  const transaction =
    collectTransactionData(
      formData
    );


  const validation =
    validateTransaction(
      transaction
    );


  if (!validation.valid) {

    showToast(
      "Data belum lengkap",
      validation.message,
      "error"
    );

    return;

  }


  try {

    if (
      !window.TradingAPI ||
      typeof window.TradingAPI.addTransaction !== "function"
    ) {

      throw new Error(
        "Fungsi addTransaction tidak tersedia di api.js."
      );

    }


    await window.TradingAPI.addTransaction(
      transaction
    );


    showToast(
      "Berhasil",
      "Transaksi berhasil disimpan.",
      "success"
    );


    resetTransactionForm();

    await loadTradingData();


  } catch (error) {

    console.error(
      "Add transaction error:",
      error
    );


    showToast(
      "Gagal menyimpan",
      getApiErrorMessage(error),
      "error"
    );

  }

}


/* =========================================================
   COLLECT TRANSACTION
========================================================= */

function collectTransactionData(
  formData
) {

  const tanggal =
    formData.get("tanggal") ||
    getValue("tanggal");


  const saham =
    formData.get("saham") ||
    getValue("saham");


  const aksi =
    formData.get("aksi") ||
    getValue("aksi");


  const harga =
    formData.get("harga") ||
    getValue("harga");


  const lot =
    formData.get("lot") ||
    getValue("lot");


  const hasil =
    formData.get("hasil") ||
    formData.get("profitRugi") ||
    getValue("hasil") ||
    getValue("profitRugi");


  const nominal =
    formData.get("nominal") ||
    getValue("nominal");


  const catatan =
    formData.get("catatan") ||
    getValue("catatan");


  return {

    tanggal:
      String(
        tanggal || ""
      ).trim(),


    saham:
      String(
        saham || ""
      )
      .trim()
      .toUpperCase(),


    aksi:
      String(
        aksi || ""
      )
      .trim()
      .toUpperCase(),


    harga:
      parseNumber(harga),


    lot:
      parseNumber(lot),


    profitRugi:
      normalizeResult(hasil),


    nominal:
      parseNumber(nominal),


    catatan:
      String(
        catatan || ""
      ).trim()

  };

}


/* =========================================================
   VALIDATE
========================================================= */

function validateTransaction(
  transaction
) {

  if (!transaction.tanggal) {

    return {
      valid: false,
      message: "Tanggal wajib diisi."
    };

  }


  if (!transaction.saham) {

    return {
      valid: false,
      message: "Kode saham wajib diisi."
    };

  }


  if (
    !["BUY", "SELL"].includes(
      transaction.aksi
    )
  ) {

    return {
      valid: false,
      message: "Aksi harus BUY atau SELL."
    };

  }


  if (
    !Number.isFinite(transaction.harga) ||
    transaction.harga <= 0
  ) {

    return {
      valid: false,
      message: "Harga harus lebih dari 0."
    };

  }


  if (
    !Number.isFinite(transaction.lot) ||
    transaction.lot <= 0
  ) {

    return {
      valid: false,
      message: "Lot harus lebih dari 0."
    };

  }


  if (
    transaction.profitRugi &&
    ![
      "PROFIT",
      "RUGI"
    ].includes(
      transaction.profitRugi
    )
  ) {

    return {
      valid: false,
      message: "Hasil harus PROFIT atau RUGI."
    };

  }


  if (
    transaction.profitRugi &&
    (
      !Number.isFinite(transaction.nominal) ||
      transaction.nominal <= 0
    )
  ) {

    return {
      valid: false,
      message:
        "Nominal profit/rugi wajib diisi."
    };

  }


  return {
    valid: true
  };

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


  setDefaultDate();


  const aksi =
    document.getElementById(
      "aksi"
    );


  if (aksi) {

    aksi.value =
      "BUY";

  }


  const profitRugi =
    document.getElementById(
      "profitRugi"
    );


  if (profitRugi) {

    profitRugi.value =
      "";

  }


  const nominal =
    document.getElementById(
      "nominal"
    );


  if (nominal) {

    nominal.value =
      "";

    nominal.disabled =
      true;

  }


  currentTransactionId =
    null;

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

  const tbody =
    document.getElementById(
      "transactionTableBody"
    );


  if (!tbody) {
    return;
  }


  tbody.innerHTML = "";


  if (
    !Array.isArray(transactions) ||
    transactions.length === 0
  ) {

    showElement(
      "transactionEmpty",
      true
    );


    showElement(
      "transactionTableWrapper",
      false
    );


    return;

  }


  showElement(
    "transactionEmpty",
    false
  );


  showElement(
    "transactionTableWrapper",
    true
  );


  const sorted =
    [...transactions]
      .sort(sortTransactions);


  sorted.forEach(
    function (transaction) {

      const row =
        document.createElement(
          "tr"
        );


      const id =
        getTransactionId(
          transaction
        );


      const tanggal =
        formatDate(
          transaction.Tanggal ??
          transaction.tanggal
        );


      const saham =
        escapeHtml(
          transaction.Saham ??
          transaction.saham ??
          "-"
        );


      const aksi =
        String(
          transaction.Aksi ??
          transaction.aksi ??
          "-"
        )
        .toUpperCase();


      const harga =
        parseNumber(
          transaction.Harga ??
          transaction.harga
        );


      const lot =
        parseNumber(
          transaction.Lot ??
          transaction.lot
        );


      const hasil =
        normalizeResult(
          transaction["Profit/Rugi"] ??
          transaction.profitRugi ??
          transaction.hasil
        );


      const nominal =
        parseNumber(
          transaction.Nominal ??
          transaction.nominal
        );


      const canEdit =
        id !== null &&
        id !== "";


      row.innerHTML = `

        <td>
          ${tanggal}
        </td>

        <td>
          <strong>
            ${saham}
          </strong>
        </td>

        <td>
          <span class="badge ${getActionClass(aksi)}">
            ${escapeHtml(aksi)}
          </span>
        </td>

        <td>
          ${formatRupiah(harga)}
        </td>

        <td>
          ${formatNumber(lot)}
        </td>

        <td class="${getAmountClassByResult(hasil)}">

          ${
            hasil
              ? `
                <span class="badge ${getResultClass(hasil)}">
                  ${escapeHtml(hasil)}
                </span>
              `
              : `
                <span class="text-muted">
                  -
                </span>
              `
          }

        </td>

        <td class="${getAmountClassByResult(hasil)}">

          ${
            nominal > 0
              ? formatRupiah(nominal)
              : "-"
          }

        </td>

        <td class="transaction-actions">

          ${
            canEdit
              ? `
                <button
                  type="button"
                  class="transaction-edit-btn"
                  data-transaction-id="${escapeHtml(id)}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="transaction-delete-btn"
                  data-transaction-id="${escapeHtml(id)}"
                >
                  Hapus
                </button>
              `
              : `
                <span class="text-muted">
                  -
                </span>
              `
          }

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );


  setupTransactionRowButtons();

}


/* =========================================================
   TRANSACTION ID
========================================================= */

function getTransactionId(
  transaction
) {

  if (!transaction) {
    return null;
  }


  const possibleIds = [

    transaction.id,

    transaction.ID,

    transaction.Id,

    transaction.row,

    transaction.Row,

    transaction.rowNumber,

    transaction.RowNumber,

    transaction._row,

    transaction._rowNumber

  ];


  for (
    const value of possibleIds
  ) {

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {

      return String(value);

    }

  }


  return null;

}


/* =========================================================
   ROW BUTTON EVENTS
========================================================= */

function setupTransactionRowButtons() {

  const editButtons =
    document.querySelectorAll(
      ".transaction-edit-btn"
    );


  editButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const id =
            button.dataset.transactionId;


          openEditTransactionModal(
            id
          );

        }
      );

    }
  );


  const deleteButtons =
    document.querySelectorAll(
      ".transaction-delete-btn"
    );


  deleteButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const id =
            button.dataset.transactionId;


          handleDeleteTransaction(
            id
          );

        }
      );

    }
  );

}


/* =========================================================
   FIND TRANSACTION
========================================================= */

function findTransactionById(
  id
) {

  return transactions.find(
    function (transaction) {

      return String(
        getTransactionId(
          transaction
        )
      ) === String(id);

    }
  );

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditTransactionModal(
  id
) {

  const transaction =
    findTransactionById(
      id
    );


  if (!transaction) {

    showToast(
      "Tidak ditemukan",
      "Data transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  currentTransactionId =
    id;


  closeEditTransactionModal();


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "editTransactionModal";


  modal.className =
    "transaction-edit-modal";


  const tanggal =
    transaction.Tanggal ??
    transaction.tanggal ??
    "";


  const saham =
    transaction.Saham ??
    transaction.saham ??
    "";


  const aksi =
    String(
      transaction.Aksi ??
      transaction.aksi ??
      "BUY"
    ).toUpperCase();


  const harga =
    parseNumber(
      transaction.Harga ??
      transaction.harga
    );


  const lot =
    parseNumber(
      transaction.Lot ??
      transaction.lot
    );


  const hasil =
    normalizeResult(
      transaction["Profit/Rugi"] ??
      transaction.profitRugi ??
      transaction.hasil
    );


  const nominal =
    parseNumber(
      transaction.Nominal ??
      transaction.nominal
    );


  const catatan =
    transaction.Catatan ??
    transaction.catatan ??
    "";


  modal.innerHTML = `

    <div class="transaction-edit-overlay">

      <div
        class="transaction-edit-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editTransactionTitle"
      >

        <div class="transaction-edit-header">

          <div>

            <h3 id="editTransactionTitle">
              Edit Transaksi
            </h3>

            <p>
              Perbarui data trading ini.
            </p>

          </div>

          <button
            type="button"
            id="closeEditTransaction"
            class="transaction-modal-close"
          >
            ×
          </button>

        </div>


        <form id="editTransactionForm">

          <div class="edit-grid">

            <div class="edit-field">

              <label>
                Tanggal
              </label>

              <input
                type="date"
                id="editTanggal"
                value="${escapeAttribute(normalizeDateInput(tanggal))}"
                required
              >

            </div>


            <div class="edit-field">

              <label>
                Saham
              </label>

              <input
                type="text"
                id="editSaham"
                value="${escapeAttribute(saham)}"
                maxlength="10"
                required
              >

            </div>


            <div class="edit-field">

              <label>
                Aksi
              </label>

              <select
                id="editAksi"
                required
              >

                <option
                  value="BUY"
                  ${aksi === "BUY" ? "selected" : ""}
                >
                  BUY
                </option>

                <option
                  value="SELL"
                  ${aksi === "SELL" ? "selected" : ""}
                >
                  SELL
                </option>

              </select>

            </div>


            <div class="edit-field">

              <label>
                Harga
              </label>

              <input
                type="number"
                id="editHarga"
                value="${harga || ""}"
                min="1"
                required
              >

            </div>


            <div class="edit-field">

              <label>
                Lot
              </label>

              <input
                type="number"
                id="editLot"
                value="${lot || ""}"
                min="1"
                required
              >

            </div>


            <div class="edit-field">

              <label>
                Hasil
              </label>

              <select
                id="editProfitRugi"
              >

                <option
                  value=""
                  ${!hasil ? "selected" : ""}
                >
                  -
                </option>

                <option
                  value="PROFIT"
                  ${hasil === "PROFIT" ? "selected" : ""}
                >
                  PROFIT
                </option>

                <option
                  value="RUGI"
                  ${hasil === "RUGI" ? "selected" : ""}
                >
                  RUGI
                </option>

              </select>

            </div>


            <div
              class="edit-field"
              id="editNominalGroup"
            >

              <label>
                Nominal Profit / Rugi
              </label>

              <input
                type="number"
                id="editNominal"
                value="${nominal || ""}"
                min="1"
                ${hasil ? "" : "disabled"}
              >

            </div>


            <div class="edit-field edit-field-full">

              <label>
                Catatan
              </label>

              <textarea
                id="editCatatan"
                rows="3"
              >${escapeHtml(catatan)}</textarea>

            </div>

          </div>


          <div class="transaction-edit-footer">

            <button
              type="button"
              id="cancelEditTransaction"
              class="edit-cancel-button"
            >
              Batal
            </button>

            <button
              type="submit"
              class="edit-save-button"
            >
              Simpan Perubahan
            </button>

          </div>

        </form>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  setupEditModalEvents();


  modal
    .querySelector(
      "#editSaham"
    )
    ?.focus();


  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   EDIT MODAL EVENTS
========================================================= */

function setupEditModalEvents() {

  const modal =
    document.getElementById(
      "editTransactionModal"
    );


  if (!modal) {
    return;
  }


  const closeButton =
    modal.querySelector(
      "#closeEditTransaction"
    );


  const cancelButton =
    modal.querySelector(
      "#cancelEditTransaction"
    );


  const form =
    modal.querySelector(
      "#editTransactionForm"
    );


  const hasil =
    modal.querySelector(
      "#editProfitRugi"
    );


  const nominal =
    modal.querySelector(
      "#editNominal"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeEditTransactionModal
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeEditTransactionModal
    );

  }


  if (hasil) {

    hasil.addEventListener(
      "change",
      function () {

        const active =
          hasil.value === "PROFIT" ||
          hasil.value === "RUGI";


        nominal.disabled =
          !active;


        if (!active) {

          nominal.value =
            "";

        }

      }
    );

  }


  if (form) {

    form.addEventListener(
      "submit",
      handleEditTransactionSubmit
    );

  }


  modal
    .querySelector(
      ".transaction-edit-overlay"
    )
    ?.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          event.currentTarget
        ) {

          closeEditTransactionModal();

        }

      }
    );

}


/* =========================================================
   CLOSE EDIT MODAL
========================================================= */

function closeEditTransactionModal() {

  const modal =
    document.getElementById(
      "editTransactionModal"
    );


  if (modal) {

    modal.remove();

  }


  currentTransactionId =
    null;


  document.body.style.overflow =
    "";

}


/* =========================================================
   SAVE EDIT
========================================================= */

async function handleEditTransactionSubmit(
  event
) {

  event.preventDefault();


  if (!currentTransactionId) {

    showToast(
      "Error",
      "ID transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  const transaction = {

    tanggal:
      getValue("editTanggal"),

    saham:
      getValue("editSaham")
        .trim()
        .toUpperCase(),

    aksi:
      getValue("editAksi")
        .trim()
        .toUpperCase(),

    harga:
      parseNumber(
        getValue("editHarga")
      ),

    lot:
      parseNumber(
        getValue("editLot")
      ),

    profitRugi:
      normalizeResult(
        getValue("editProfitRugi")
      ),

    nominal:
      parseNumber(
        getValue("editNominal")
      ),

    catatan:
      getValue("editCatatan")
        .trim()

  };


  const validation =
    validateTransaction(
      transaction
    );


  if (!validation.valid) {

    showToast(
      "Data belum lengkap",
      validation.message,
      "error"
    );

    return;

  }


  try {

    if (
      !window.TradingAPI ||
      typeof window.TradingAPI.updateTransaction !== "function"
    ) {

      throw new Error(
        "Fungsi updateTransaction belum tersedia di api.js."
      );

    }


    await window.TradingAPI.updateTransaction(
      currentTransactionId,
      transaction
    );


    closeEditTransactionModal();


    showToast(
      "Berhasil",
      "Transaksi berhasil diperbarui.",
      "success"
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "Update transaction error:",
      error
    );


    showToast(
      "Gagal mengubah transaksi",
      getApiErrorMessage(error),
      "error"
    );

  }

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function handleDeleteTransaction(
  id
) {

  const transaction =
    findTransactionById(
      id
    );


  if (!transaction) {

    showToast(
      "Tidak ditemukan",
      "Data transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  const saham =
    transaction.Saham ??
    transaction.saham ??
    "-";


  const tanggal =
    formatDate(
      transaction.Tanggal ??
      transaction.tanggal
    );


  const confirmed =
    window.confirm(
      "Hapus transaksi " +
      saham +
      " tanggal " +
      tanggal +
      "?\n\n" +
      "Data yang sudah dihapus tidak dapat dikembalikan."
    );


  if (!confirmed) {
    return;
  }


  try {

    if (
      !window.TradingAPI ||
      typeof window.TradingAPI.deleteTransaction !== "function"
    ) {

      throw new Error(
        "Fungsi deleteTransaction belum tersedia di api.js."
      );

    }


    await window.TradingAPI.deleteTransaction(
      id
    );


    showToast(
      "Berhasil",
      "Transaksi berhasil dihapus.",
      "success"
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "Delete transaction error:",
      error
    );


    showToast(
      "Gagal menghapus",
      getApiErrorMessage(error),
      "error"
    );

  }

}


/* =========================================================
   SORT
========================================================= */

function sortTransactions(
  a,
  b
) {

  const dateA =
    parseDateValue(
      a.Tanggal ??
      a.tanggal
    );


  const dateB =
    parseDateValue(
      b.Tanggal ??
      b.tanggal
    );


  return dateB - dateA;

}


/* =========================================================
   COUNT
========================================================= */

function updateTransactionCount() {

  const element =
    document.getElementById(
      "transactionCount"
    );


  if (!element) {
    return;
  }


  element.textContent =
    formatNumber(
      transactions.length
    );

}


/* =========================================================
   CAPITAL DISPLAY
========================================================= */

function updateCapitalDisplay() {

  const modalAwal =
    getSummaryNumber(
      "modalAwal"
    );


  const totalTambah =
    getSummaryNumber(
      "totalTambah"
    );


  const totalTarik =
    getSummaryNumber(
      "totalTarik"
    );


  let modal =
    getSummaryNumber(
      "modal"
    );


  if (
    modal === 0 &&
    (
      modalAwal !== 0 ||
      totalTambah !== 0 ||
      totalTarik !== 0
    )
  ) {

    modal =
      modalAwal +
      totalTambah -
      totalTarik;

  }


  const totalProfit =
    getSummaryNumber(
      "totalProfit"
    );


  const totalRugi =
    getSummaryNumber(
      "totalRugi"
    );


  const netProfit =
    getSummaryNumber(
      "netProfit"
    );


  const total =
    getSummaryNumber(
      "total"
    );


  capitalData = {

    modalAwal,
    totalTambah,
    totalTarik,
    modal,
    totalProfit,
    totalRugi,
    netProfit,
    total

  };


  setText(
    "modalAwal",
    formatRupiah(modalAwal)
  );


  setText(
    "tambahModal",
    formatRupiah(totalTambah)
  );


  setText(
    "tarikModal",
    formatRupiah(totalTarik)
  );


  setText(
    "modalSekarang",
    formatRupiah(modal)
  );


  setText(
    "currentCapital",
    formatRupiah(modal)
  );


  setText(
    "capitalValue",
    formatRupiah(modal)
  );


  setText(
    "totalProfit",
    formatRupiah(totalProfit)
  );


  setText(
    "totalRugi",
    formatRupiah(totalRugi)
  );


  setText(
    "netProfit",
    formatSignedRupiah(netProfit)
  );


  setText(
    "totalCapital",
    formatRupiah(total)
  );


  setText(
    "modalValue",
    formatRupiah(modal)
  );


  setText(
    "profitLossValue",
    formatSignedRupiah(netProfit)
  );


  setText(
    "totalValue",
    formatRupiah(
      modal + netProfit
    )
  );


  const profitElement =
    document.getElementById(
      "profitLossValue"
    );


  if (profitElement) {

    profitElement.classList.remove(
      "text-profit",
      "text-loss"
    );


    if (netProfit > 0) {

      profitElement.classList.add(
        "text-profit"
      );

    }


    if (netProfit < 0) {

      profitElement.classList.add(
        "text-loss"
      );

    }

  }

}


/* =========================================================
   SUMMARY NUMBER
========================================================= */

function getSummaryNumber(
  key
) {

  const number =
    Number(
      summaryData?.[key]
    );


  return Number.isFinite(number)
    ? number
    : 0;

}


/* =========================================================
   CAPITAL MODAL EVENTS
========================================================= */

function setupModalEvents() {

  const closeButtons =
    document.querySelectorAll(
      "[data-close-modal]"
    );


  closeButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        closeCapitalModal
      );

    }
  );


  ["addModal", "withdrawModal"]
    .forEach(
      function (id) {

        const modal =
          document.getElementById(id);


        if (modal) {

          modal.addEventListener(
            "click",
            function (event) {

              if (
                event.target === modal
              ) {

                closeCapitalModal();

              }

            }
          );

        }

      }
    );


  const addForm =
    document.getElementById(
      "addModalForm"
    );


  if (addForm) {

    addForm.addEventListener(
      "submit",
      handleAddModalSubmit
    );

  }


  const withdrawForm =
    document.getElementById(
      "withdrawModalForm"
    );


  if (withdrawForm) {

    withdrawForm.addEventListener(
      "submit",
      handleWithdrawModalSubmit
    );

  }


  document.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key === "Escape"
      ) {

        closeCapitalModal();

        closeEditTransactionModal();

      }

    }
  );

}


/* =========================================================
   CAPITAL MODAL
========================================================= */

function openCapitalModal(
  type
) {

  closeCapitalModal();


  const modalId =
    type === "add"
      ? "addModal"
      : "withdrawModal";


  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {
    return;
  }


  const dateId =
    type === "add"
      ? "addModalTanggal"
      : "withdrawModalTanggal";


  const amountId =
    type === "add"
      ? "addModalNominal"
      : "withdrawModalNominal";


  const noteId =
    type === "add"
      ? "addModalCatatan"
      : "withdrawModalCatatan";


  const dateInput =
    document.getElementById(
      dateId
    );


  const amountInput =
    document.getElementById(
      amountId
    );


  const noteInput =
    document.getElementById(
      noteId
    );


  if (dateInput) {

    dateInput.value =
      getTodayDate();

  }


  if (amountInput) {

    amountInput.value =
      "";

  }


  if (noteInput) {

    noteInput.value =
      "";

  }


  modal.classList.remove(
    "hidden"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";


  setTimeout(
    function () {

      amountInput?.focus();

    },
    100
  );

}


/* =========================================================
   CLOSE CAPITAL MODAL
========================================================= */

function closeCapitalModal() {

  [
    "addModal",
    "withdrawModal"
  ]
  .forEach(
    function (id) {

      const modal =
        document.getElementById(id);


      if (!modal) {
        return;
      }


      modal.classList.add(
        "hidden"
      );


      modal.setAttribute(
        "aria-hidden",
        "true"
      );

    }
  );


  if (
    !document.getElementById(
      "editTransactionModal"
    )
  ) {

    document.body.style.overflow =
      "";

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
    getValue(
      "addModalTanggal"
    );


  const nominal =
    parseNumber(
      getValue(
        "addModalNominal"
      )
    );


  const catatan =
    getValue(
      "addModalCatatan"
    ).trim();


  if (!tanggal) {

    showToast(
      "Data belum lengkap",
      "Tanggal wajib diisi.",
      "error"
    );

    return;

  }


  if (
    !Number.isFinite(nominal) ||
    nominal <= 0
  ) {

    showToast(
      "Nominal tidak valid",
      "Masukkan nominal lebih dari 0.",
      "error"
    );

    return;

  }


  try {

    await window.TradingAPI.addCapital(
      nominal,
      catatan,
      tanggal
    );


    closeCapitalModal();


    showToast(
      "Berhasil",
      "Modal berhasil ditambahkan.",
      "success"
    );


    await loadTradingData();


  } catch (error) {

    showToast(
      "Gagal menambah modal",
      getApiErrorMessage(error),
      "error"
    );

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
    getValue(
      "withdrawModalTanggal"
    );


  const nominal =
    parseNumber(
      getValue(
        "withdrawModalNominal"
      )
    );


  const catatan =
    getValue(
      "withdrawModalCatatan"
    ).trim();


  if (!tanggal) {

    showToast(
      "Data belum lengkap",
      "Tanggal wajib diisi.",
      "error"
    );

    return;

  }


  if (
    !Number.isFinite(nominal) ||
    nominal <= 0
  ) {

    showToast(
      "Nominal tidak valid",
      "Masukkan nominal lebih dari 0.",
      "error"
    );

    return;

  }


  const currentCapital =
    getSummaryNumber(
      "modal"
    );


  if (
    nominal > currentCapital
  ) {

    showToast(
      "Penarikan ditolak",
      "Nominal penarikan melebihi modal yang tersedia.",
      "error"
    );

    return;

  }


  try {

    await window.TradingAPI.withdrawCapital(
      nominal,
      catatan,
      tanggal
    );


    closeCapitalModal();


    showToast(
      "Berhasil",
      "Modal berhasil ditarik.",
      "success"
    );


    await loadTradingData();


  } catch (error) {

    showToast(
      "Gagal menarik modal",
      getApiErrorMessage(error),
      "error"
    );

  }

}


/* =========================================================
   NORMALIZE RESULT
========================================================= */

function normalizeResult(
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
   CLASSES
========================================================= */

function getActionClass(
  action
) {

  const value =
    String(
      action || ""
    ).toUpperCase();


  if (value === "BUY") {
    return "badge-buy";
  }


  if (value === "SELL") {
    return "badge-sell";
  }


  return "";

}


function getResultClass(
  result
) {

  if (result === "PROFIT") {
    return "badge-profit";
  }


  if (result === "RUGI") {
    return "badge-loss";
  }


  return "";

}


function getAmountClassByResult(
  result
) {

  if (result === "PROFIT") {
    return "text-profit";
  }


  if (result === "RUGI") {
    return "text-loss";
  }


  return "text-muted";

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(
  value
) {

  const number =
    Number(value) || 0;


  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(number);

}


function formatSignedRupiah(
  value
) {

  const number =
    Number(value) || 0;


  if (number > 0) {

    return "+" +
      formatRupiah(number);

  }


  if (number < 0) {

    return "-" +
      formatRupiah(
        Math.abs(number)
      );

  }


  return formatRupiah(0);

}


function formatNumber(
  value
) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(value) || 0
  );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }


  const stringValue =
    String(value);


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


  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      stringValue
    )
  ) {

    return stringValue;

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return stringValue;

  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(date);

}


/* =========================================================
   NORMALIZE DATE INPUT
========================================================= */

function normalizeDateInput(
  value
) {

  if (!value) {
    return "";
  }


  const stringValue =
    String(value);


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {

    return stringValue;

  }


  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      stringValue
    )
  ) {

    const parts =
      stringValue.split("/");


    return (
      parts[2] +
      "-" +
      parts[1] +
      "-" +
      parts[0]
    );

  }


  const date =
    new Date(value);


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
    ).padStart(2, "0") +
    "-" +
    String(
      date.getDate()
    ).padStart(2, "0")
  );

}


/* =========================================================
   PARSE DATE
========================================================= */

function parseDateValue(
  value
) {

  if (!value) {
    return 0;
  }


  const stringValue =
    String(value);


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {

    return new Date(
      stringValue +
      "T00:00:00"
    ).getTime();

  }


  const parts =
    stringValue.split("/");


  if (
    parts.length === 3 &&
    parts[0].length === 2 &&
    parts[1].length === 2 &&
    parts[2].length === 4
  ) {

    return new Date(
      Number(parts[2]),
      Number(parts[1]) - 1,
      Number(parts[0])
    ).getTime();

  }


  const date =
    new Date(value);


  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();

}


/* =========================================================
   PARSE NUMBER
========================================================= */

function parseNumber(
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


  const result =
    Number(stringValue);


  return Number.isFinite(result)
    ? result
    : 0;

}


/* =========================================================
   GET VALUE
========================================================= */

function getValue(
  id
) {

  const element =
    document.getElementById(
      id
    );


  return element
    ? element.value
    : "";

}


/* =========================================================
   SET TEXT
========================================================= */

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


/* =========================================================
   SHOW ELEMENT
========================================================= */

function showElement(
  id,
  show
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.classList.toggle(
    "hidden",
    !show
  );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
  title,
  message,
  type = "success"
) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    console[
      type === "error"
        ? "error"
        : "log"
    ](
      title + ":",
      message
    );

    return;

  }


  const icon =
    document.getElementById(
      "toastIcon"
    );


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
   API ERROR
========================================================= */

function getApiErrorMessage(
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
   ESCAPE
========================================================= */

function escapeHtml(
  value
) {

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
