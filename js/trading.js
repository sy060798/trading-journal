/* =========================================================
   TRADING JOURNAL
   trading.js
   FULL SYSTEM - TAHAP 1
   ---------------------------------------------------------
   Fitur:
   - Load transaksi
   - Load modal
   - Tambah transaksi
   - Edit transaksi
   - Hapus transaksi
   - Tambah modal
   - Tarik modal
   - Refresh
   - Sinkron dengan TradingAPI dari api.js
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

let tradingTransactions = [];
let tradingCapital = {};

let editingTransactionId = null;

let tradingLoading = false;
let deletingTransaction = false;
let savingTransaction = false;


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

  try {

    setupTradingEvents();

    setupTradingForms();

    setTradingToday();

    await loadTradingData();

  } catch (error) {

    console.error(
      "[Trading] Initialize error:",
      error
    );

    showTradingToast(
      "Gagal",
      getTradingErrorMessage(error),
      "error"
    );

  }

}


/* =========================================================
   API CHECK
========================================================= */

function ensureTradingAPI() {

  if (
    window.TradingAPI &&
    typeof window.TradingAPI.getTransactions ===
      "function"
  ) {

    return true;

  }


  throw new Error(
    "TradingAPI belum tersedia. Pastikan api.js dimuat sebelum trading.js."
  );

}


/* =========================================================
   EVENTS
========================================================= */

function setupTradingEvents() {

  /*
   * Refresh
   */

  const refreshButtons =
    document.querySelectorAll(
      "#refreshButton, #refreshTradingButton, [data-action='refresh']"
    );


  refreshButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          loadTradingData();

        }
      );

    }
  );


  /*
   * Form transaksi
   */

  const transactionForm =
    document.getElementById(
      "transactionForm"
    );


  if (transactionForm) {

    transactionForm.addEventListener(
      "submit",
      handleTransactionSubmit
    );

  }


  /*
   * Tombol tambah transaksi
   */

  const addButtons =
    document.querySelectorAll(
      "#addTransactionButton, #saveTransactionButton, [data-action='add-transaction']"
    );


  addButtons.forEach(
    button => {

      /*
       * Jangan memasang handler kedua
       * pada tombol submit form.
       */

      if (
        button.type === "submit" &&
        button.form
      ) {

        return;

      }


      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          handleTransactionSubmit(
            event
          );

        }
      );

    }
  );


  /*
   * Tombol modal
   */

  const addCapitalButtons =
    document.querySelectorAll(
      "#addCapitalButton, #saveCapitalButton, [data-action='add-capital']"
    );


  addCapitalButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          handleAddCapital();

        }
      );

    }
  );


  /*
   * Tombol tarik modal
   */

  const withdrawButtons =
    document.querySelectorAll(
      "#withdrawCapitalButton, #saveWithdrawButton, [data-action='withdraw-capital']"
    );


  withdrawButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          handleWithdrawCapital();

        }
      );

    }
  );


  /*
   * Tombol cancel edit
   */

  const cancelButtons =
    document.querySelectorAll(
      "#cancelEditButton, #cancelTransactionButton, [data-action='cancel-edit']"
    );


  cancelButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          cancelTransactionEdit();

        }
      );

    }
  );


  /*
   * Delegasi tabel transaksi.
   * Berguna untuk tombol Edit/Hapus
   * yang dibuat secara dinamis.
   */

  document.addEventListener(
    "click",
    handleTradingDocumentClick
  );

}


/* =========================================================
   FORM SETUP
========================================================= */

function setupTradingForms() {

  /*
   * Default tanggal.
   */

  setTradingInputValue(
    [
      "tanggal",
      "transactionDate",
      "tradeDate"
    ],
    getTodayStringTrading()
  );


  /*
   * Perubahan hasil transaksi.
   */

  const resultInputs =
    document.querySelectorAll(
      "#hasil, #profitRugi, #transactionResult, input[name='hasil'], select[name='hasil']"
    );


  resultInputs.forEach(
    element => {

      element.addEventListener(
        "change",
        updateTradingResultUI
      );

    }
  );


  /*
   * Jika nominal berubah,
   * update preview.
   */

  const nominalInputs =
    document.querySelectorAll(
      "#nominal, #profitLossAmount, #transactionNominal, input[name='nominal']"
    );


  nominalInputs.forEach(
    element => {

      element.addEventListener(
        "input",
        updateTradingResultUI
      );

    }
  );


  updateTradingResultUI();

}


/* =========================================================
   DOCUMENT CLICK HANDLER
========================================================= */

function handleTradingDocumentClick(
  event
) {

  const target =
    event.target;


  if (
    !target ||
    !target.closest
  ) {

    return;

  }


  /*
   * EDIT
   */

  const editButton =
    target.closest(
      "[data-edit-id], .edit-transaction, #editTransactionButton"
    );


  if (editButton) {

    event.preventDefault();

    const id =
      editButton.dataset.editId ||
      editButton.dataset.id ||
      editButton.getAttribute(
        "data-id"
      );


    editTransaction(
      id
    );

    return;

  }


  /*
   * DELETE
   */

  const deleteButton =
    target.closest(
      "[data-delete-id], .delete-transaction, #deleteTransactionButton"
    );


  if (deleteButton) {

    event.preventDefault();

    const id =
      deleteButton.dataset.deleteId ||
      deleteButton.dataset.id ||
      deleteButton.getAttribute(
        "data-id"
      );


    deleteTradingTransaction(
      id
    );

    return;

  }

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadTradingData() {

  if (tradingLoading) {

    return;

  }


  tradingLoading =
    true;


  showTradingLoading(
    true
  );


  try {

    ensureTradingAPI();


    let result;


    if (
      typeof window.TradingAPI.getAllData ===
      "function"
    ) {

      result =
        await window.TradingAPI.getAllData();

    } else {

      const transactions =
        await window.TradingAPI.getTransactions();


      let capital =
        {};


      if (
        typeof window.TradingAPI.getCapital ===
        "function"
      ) {

        capital =
          await window.TradingAPI.getCapital();

      }


      result = {

        data: {

          transaksi:
            transactions,

          summary:
            capital

        }

      };

    }


    normalizeTradingData(
      result
    );


    renderTradingPage();


  } catch (error) {

    console.error(
      "[Trading] Load error:",
      error
    );


    showTradingToast(
      "Gagal memuat data",
      getTradingErrorMessage(error),
      "error"
    );


    tradingTransactions =
      [];

    tradingCapital =
      {};


    renderTradingPage();


  } finally {

    tradingLoading =
      false;


    showTradingLoading(
      false
    );

  }

}


/* =========================================================
   NORMALIZE DATA
========================================================= */

function normalizeTradingData(
  result
) {

  /*
   * Bentuk utama:
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

  let data =
    result?.data;


  if (
    !data ||
    typeof data !== "object"
  ) {

    data =
      {};

  }


  /*
   * TRANSACTIONS
   */

  if (
    Array.isArray(
      data.transaksi
    )
  ) {

    tradingTransactions =
      data.transaksi;

  } else if (
    Array.isArray(
      data.transactions
    )
  ) {

    tradingTransactions =
      data.transactions;

  } else if (
    Array.isArray(
      result?.transactions
    )
  ) {

    tradingTransactions =
      result.transactions;

  } else {

    tradingTransactions =
      [];

  }


  /*
   * CAPITAL
   */

  if (
    data.summary &&
    typeof data.summary ===
      "object"
  ) {

    tradingCapital =
      data.summary;

  } else if (
    data.capital &&
    typeof data.capital ===
      "object"
  ) {

    tradingCapital =
      data.capital;

  } else if (
    result?.capital &&
    typeof result.capital ===
      "object"
  ) {

    tradingCapital =
      result.capital;

  } else {

    tradingCapital =
      {};

  }


  /*
   * Pastikan array.
   */

  if (
    !Array.isArray(
      tradingTransactions
    )
  ) {

    tradingTransactions =
      [];

  }

}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderTradingPage() {

  renderTradingSummary();

  renderTradingCapital();

  renderTradingTable();

  updateTradingResultUI();

}


/* =========================================================
   SUMMARY
========================================================= */

function renderTradingSummary() {

  const total =
    tradingTransactions.length;


  let profit =
    0;

  let loss =
    0;


  tradingTransactions.forEach(
    transaction => {

      const nominal =
        getTradingNominal(
          transaction
        );


      if (
        nominal > 0
      ) {

        profit +=
          nominal;

      } else if (
        nominal < 0
      ) {

        loss +=
          Math.abs(
            nominal
          );

      }

    }
  );


  const net =
    profit -
    loss;


  setTradingText(
    "totalTransactions",
    formatTradingNumber(
      total
    )
  );


  setTradingText(
    "totalTrades",
    formatTradingNumber(
      total
    )
  );


  setTradingText(
    "totalProfit",
    formatTradingSignedRupiah(
      profit
    )
  );


  setTradingText(
    "profitValue",
    formatTradingSignedRupiah(
      profit
    )
  );


  setTradingText(
    "totalLoss",
    formatTradingSignedRupiah(
      -loss
    )
  );


  setTradingText(
    "lossValue",
    formatTradingSignedRupiah(
      -loss
    )
  );


  setTradingText(
    "netProfit",
    formatTradingSignedRupiah(
      net
    )
  );


  setTradingText(
    "netValue",
    formatTradingSignedRupiah(
      net
    )
  );

}


/* =========================================================
   CAPITAL
========================================================= */

function renderTradingCapital() {

  const initial =
    getTradingCapitalValue(
      [
        "modalAwal",
        "modal_awal",
        "initialCapital",
        "initial",
        "modal"
      ]
    );


  const added =
    getTradingCapitalValue(
      [
        "tambahModal",
        "tambah_modal",
        "addedCapital",
        "added"
      ]
    );


  const withdrawn =
    getTradingCapitalValue(
      [
        "tarikModal",
        "tarik_modal",
        "withdrawnCapital",
        "withdrawn"
      ]
    );


  const current =
    getTradingCapitalNullable(
      [
        "modalSekarang",
        "modal_sekarang",
        "currentCapital",
        "current",
        "saldo"
      ]
    );


  const finalCapital =
    current !== null
      ? current
      : initial +
        added -
        withdrawn;


  setTradingText(
    "modalAwal",
    formatTradingRupiah(
      initial
    )
  );


  setTradingText(
    "initialCapital",
    formatTradingRupiah(
      initial
    )
  );


  setTradingText(
    "tambahModal",
    formatTradingRupiah(
      added
    )
  );


  setTradingText(
    "addedCapital",
    formatTradingRupiah(
      added
    )
  );


  setTradingText(
    "tarikModal",
    formatTradingRupiah(
      withdrawn
    )
  );


  setTradingText(
    "withdrawnCapital",
    formatTradingRupiah(
      withdrawn
    )
  );


  setTradingText(
    "modalSekarang",
    formatTradingRupiah(
      finalCapital
    )
  );


  setTradingText(
    "currentCapital",
    formatTradingRupiah(
      finalCapital
    )
  );


  setTradingText(
    "capitalValue",
    formatTradingRupiah(
      finalCapital
    )
  );

}


/* =========================================================
   RENDER TRANSACTION TABLE
========================================================= */

function renderTradingTable() {

  const tbody =
    document.getElementById(
      "transactionTableBody"
    ) ||
    document.getElementById(
      "transactionsBody"
    ) ||
    document.getElementById(
      "tradingTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML =
    "";


  const data =
    [...tradingTransactions].sort(
      function (
        a,
        b
      ) {

        const dateA =
          parseTradingDate(
            a?.tanggal
          );


        const dateB =
          parseTradingDate(
            b?.tanggal
          );


        return (
          (dateB?.getTime() || 0) -
          (dateA?.getTime() || 0)
        );

      }
    );


  if (
    data.length ===
    0
  ) {

    renderTradingEmptyRow(
      tbody
    );

    return;

  }


  data.forEach(
    function (
      transaction,
      index
    ) {

      const row =
        document.createElement(
          "tr"
        );


      const id =
        getTradingTransactionId(
          transaction,
          index
        );


      const tanggal =
        formatTradingDate(
          transaction?.tanggal
        );


      const saham =
        String(
          transaction?.saham ||
          "-"
        )
          .trim()
          .toUpperCase();


      const aksi =
        String(
          transaction?.aksi ||
          "-"
        )
          .trim()
          .toUpperCase();


      const harga =
        getTradingNumber(
          transaction?.harga
        );


      const lot =
        getTradingNumber(
          transaction?.lot
        );


      const hasil =
        normalizeTradingResult(
          transaction?.hasil ??
          transaction?.profitRugi ??
          ""
        );


      const nominal =
        getTradingNominal(
          transaction
        );


      const catatan =
        transaction?.catatan ||
        "-";


      row.innerHTML = `

        <td>
          ${escapeTradingHtml(tanggal)}
        </td>

        <td>
          <strong>
            ${escapeTradingHtml(saham)}
          </strong>
        </td>

        <td>
          <span class="badge ${getTradingActionClass(aksi)}">
            ${escapeTradingHtml(aksi)}
          </span>
        </td>

        <td>
          ${formatTradingRupiah(harga)}
        </td>

        <td>
          ${formatTradingNumber(lot)}
        </td>

        <td>
          ${
            hasil
              ? `
                <span class="badge ${getTradingResultClass(hasil)}">
                  ${escapeTradingHtml(hasil)}
                </span>
              `
              : "-"
          }
        </td>

        <td class="${getTradingAmountClass(nominal)}">
          ${
            nominal !== 0
              ? formatTradingSignedRupiah(nominal)
              : "-"
          }
        </td>

        <td>
          ${escapeTradingHtml(catatan)}
        </td>

        <td>

          <div class="table-actions">

            <button
              type="button"
              class="edit-transaction"
              data-edit-id="${escapeTradingAttribute(id)}"
            >
              Edit
            </button>

            <button
              type="button"
              class="delete-transaction"
              data-delete-id="${escapeTradingAttribute(id)}"
            >
              Hapus
            </button>

          </div>

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   EMPTY TABLE
========================================================= */

function renderTradingEmptyRow(
  tbody
) {

  const row =
    document.createElement(
      "tr"
    );


  row.innerHTML = `

    <td
      colspan="10"
      style="text-align:center;"
    >
      Belum ada transaksi.
    </td>

  `;


  tbody.appendChild(
    row
  );

}


/* =========================================================
   SUBMIT TRANSACTION
========================================================= */

async function handleTransactionSubmit(
  event
) {

  if (
    event &&
    event.preventDefault
  ) {

    event.preventDefault();

  }


  if (savingTransaction) {

    return;

  }


  savingTransaction =
    true;


  setTradingButtonsDisabled(
    true
  );


  try {

    ensureTradingAPI();


    const transaction =
      collectTransactionForm();


    validateTradingTransaction(
      transaction
    );


    /*
     * EDIT
     */

    if (
      editingTransactionId !==
      null
    ) {

      await updateTradingTransaction(
        editingTransactionId,
        transaction
      );

    }


    /*
     * TAMBAH
     */

    else {

      await addTradingTransaction(
        transaction
      );

    }


  } catch (error) {

    console.error(
      "[Trading] Save error:",
      error
    );


    showTradingToast(
      "Gagal menyimpan",
      getTradingErrorMessage(error),
      "error"
    );

  } finally {

    savingTransaction =
      false;


    setTradingButtonsDisabled(
      false
    );

  }

}


/* =========================================================
   COLLECT FORM
========================================================= */

function collectTransactionForm() {

  const tanggal =
    getTradingInputValue(
      [
        "tanggal",
        "transactionDate",
        "tradeDate"
      ]
    );


  const saham =
    getTradingInputValue(
      [
        "saham",
        "stock",
        "kodeSaham"
      ]
    )
      .trim()
      .toUpperCase();


  const aksi =
    getTradingInputValue(
      [
        "aksi",
        "action",
        "transactionAction"
      ]
    )
      .trim()
      .toUpperCase();


  const harga =
    getTradingNumberFromInput(
      [
        "harga",
        "price",
        "transactionPrice"
      ]
    );


  const lot =
    getTradingNumberFromInput(
      [
        "lot",
        "quantity",
        "transactionLot"
      ]
    );


  const hasil =
    normalizeTradingResult(
      getTradingInputValue(
        [
          "hasil",
          "profitRugi",
          "transactionResult"
        ]
      )
    );


  let nominal =
    getTradingNumberFromInput(
      [
        "nominal",
        "profitLossAmount",
        "transactionNominal"
      ]
    );


  const catatan =
    getTradingInputValue(
      [
        "catatan",
        "note",
        "transactionNote"
      ]
    )
      .trim();


  /*
   * Jika hasil RUGI dipilih,
   * nominal dikirim negatif.
   *
   * Jika hasil PROFIT,
   * nominal positif.
   */

  if (
    hasil === "RUGI" &&
    nominal > 0
  ) {

    nominal =
      -Math.abs(
        nominal
      );

  }


  if (
    hasil === "PROFIT" &&
    nominal < 0
  ) {

    nominal =
      Math.abs(
        nominal
      );

  }


  return {

    tanggal:
      tanggal,

    saham:
      saham,

    aksi:
      aksi,

    harga:
      harga,

    lot:
      lot,

    hasil:
      hasil,

    profitRugi:
      hasil,

    nominal:
      nominal,

    catatan:
      catatan

  };

}


/* =========================================================
   VALIDATE TRANSACTION
========================================================= */

function validateTradingTransaction(
  transaction
) {

  if (
    !transaction.tanggal
  ) {

    throw new Error(
      "Tanggal transaksi wajib diisi."
    );

  }


  if (
    !transaction.saham
  ) {

    throw new Error(
      "Kode saham wajib diisi."
    );

  }


  if (
    transaction.aksi !== "BUY" &&
    transaction.aksi !== "SELL"
  ) {

    throw new Error(
      "Aksi harus BUY atau SELL."
    );

  }


  if (
    !Number.isFinite(
      transaction.harga
    ) ||
    transaction.harga <= 0
  ) {

    throw new Error(
      "Harga harus lebih besar dari 0."
    );

  }


  if (
    !Number.isFinite(
      transaction.lot
    ) ||
    transaction.lot <= 0
  ) {

    throw new Error(
      "Lot harus lebih besar dari 0."
    );

  }


  if (
    transaction.hasil !== "" &&
    transaction.hasil !== "PROFIT" &&
    transaction.hasil !== "RUGI"
  ) {

    throw new Error(
      "Hasil harus PROFIT atau RUGI."
    );

  }


  if (
    transaction.hasil &&
    transaction.nominal === 0
  ) {

    throw new Error(
      "Nominal wajib diisi jika PROFIT/RUGI dipilih."
    );

  }

}


/* =========================================================
   ADD TRANSACTION
========================================================= */

async function addTradingTransaction(
  transaction
) {

  if (
    !window.TradingAPI ||
    typeof window.TradingAPI.addTransaction !==
      "function"
  ) {

    throw new Error(
      "TradingAPI.addTransaction tidak tersedia."
    );

  }


  showTradingLoading(
    true,
    "Menyimpan transaksi..."
  );


  try {

    const result =
      await window.TradingAPI.addTransaction(
        transaction
      );


    console.log(
      "[Trading] Add response:",
      result
    );


    showTradingToast(
      "Berhasil",
      "Transaksi berhasil ditambahkan.",
      "success"
    );


    resetTransactionForm();


    await loadTradingData();


  } finally {

    showTradingLoading(
      false
    );

  }

}


/* =========================================================
   EDIT TRANSACTION
========================================================= */

async function editTransaction(
  id
) {

  const transaction =
    findTradingTransaction(
      id
    );


  if (!transaction) {

    showTradingToast(
      "Tidak ditemukan",
      "Data transaksi yang ingin diedit tidak ditemukan.",
      "error"
    );

    return;

  }


  editingTransactionId =
    getTradingTransactionId(
      transaction
    );


  fillTransactionForm(
    transaction
  );


  setTradingEditMode(
    true
  );


  window.scrollTo(
    {
      top:
        0,

      behavior:
        "smooth"
    }
  );


  showTradingToast(
    "Mode Edit",
    "Silakan ubah data transaksi lalu simpan.",
    "success"
  );

}


/* =========================================================
   UPDATE TRANSACTION
========================================================= */

async function updateTradingTransaction(
  id,
  transaction
) {

  /*
   * API yang sekarang belum memiliki
   * updateTransaction().
   *
   * Kita cek beberapa nama method
   * agar kompatibel dengan API versi baru.
   */

  let updateFunction =
    null;


  if (
    window.TradingAPI &&
    typeof window.TradingAPI.updateTransaction ===
      "function"
  ) {

    updateFunction =
      window.TradingAPI.updateTransaction;

  } else if (
    window.TradingAPI &&
    typeof window.TradingAPI.editTransaction ===
      "function"
  ) {

    updateFunction =
      window.TradingAPI.editTransaction;

  }


  if (!updateFunction) {

    throw new Error(
      "Fitur Edit belum tersedia di api.js. Tambahkan TradingAPI.updateTransaction dan action update_transaction di Apps Script."
    );

  }


  showTradingLoading(
    true,
    "Memperbarui transaksi..."
  );


  try {

    const payload = {

      id:
        id,

      ...transaction

    };


    const result =
      await updateFunction(
        payload
      );


    console.log(
      "[Trading] Update response:",
      result
    );


    showTradingToast(
      "Berhasil",
      "Transaksi berhasil diperbarui.",
      "success"
    );


    editingTransactionId =
      null;


    resetTransactionForm();

    setTradingEditMode(
      false
    );


    await loadTradingData();


  } finally {

    showTradingLoading(
      false
    );

  }

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTradingTransaction(
  id
) {

  if (
    deletingTransaction
  ) {

    return;

  }


  const transaction =
    findTradingTransaction(
      id
    );


  if (!transaction) {

    showTradingToast(
      "Tidak ditemukan",
      "Transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  const saham =
    transaction?.saham ||
    "transaksi";


  const confirmed =
    window.confirm(
      "Hapus transaksi " +
      saham +
      "?\n\nData yang sudah dihapus tidak dapat dikembalikan."
    );


  if (!confirmed) {

    return;

  }


  deletingTransaction =
    true;


  try {

    if (
      !window.TradingAPI ||
      typeof window.TradingAPI.deleteTransaction !==
        "function"
    ) {

      throw new Error(
        "TradingAPI.deleteTransaction tidak tersedia."
      );

    }


    showTradingLoading(
      true,
      "Menghapus transaksi..."
    );


    await window.TradingAPI.deleteTransaction(
      id
    );


    showTradingToast(
      "Berhasil",
      "Transaksi berhasil dihapus.",
      "success"
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "[Trading] Delete error:",
      error
    );


    showTradingToast(
      "Gagal menghapus",
      getTradingErrorMessage(error),
      "error"
    );


  } finally {

    deletingTransaction =
      false;


    showTradingLoading(
      false
    );

  }

}


/* =========================================================
   FIND TRANSACTION
========================================================= */

function findTradingTransaction(
  id
) {

  const target =
    String(
      id ?? ""
    );


  return tradingTransactions.find(
    function (
      transaction,
      index
    ) {

      return (
        String(
          getTradingTransactionId(
            transaction,
            index
          )
        ) ===
        target
      );

    }
  );

}


/* =========================================================
   TRANSACTION ID
========================================================= */

function getTradingTransactionId(
  transaction,
  index = 0
) {

  if (
    transaction?.id !==
      undefined &&
    transaction?.id !==
      null &&
    transaction?.id !==
      ""
  ) {

    return String(
      transaction.id
    );

  }


  if (
    transaction?.ID !==
      undefined &&
    transaction?.ID !==
      null &&
    transaction?.ID !==
      ""
  ) {

    return String(
      transaction.ID
    );

  }


  if (
    transaction?.rowId !==
      undefined &&
    transaction?.rowId !==
      null &&
    transaction?.rowId !==
      ""
  ) {

    return String(
      transaction.rowId
    );

  }


  /*
   * Fallback sementara.
   *
   * Backend sebaiknya mengembalikan
   * ID/rowId asli.
   */

  return String(
    index
  );

}


/* =========================================================
   FILL EDIT FORM
========================================================= */

function fillTransactionForm(
  transaction
) {

  setTradingInputValue(
    [
      "tanggal",
      "transactionDate",
      "tradeDate"
    ],
    transaction?.tanggal ||
    ""
  );


  setTradingInputValue(
    [
      "saham",
      "stock",
      "kodeSaham"
    ],
    transaction?.saham ||
    ""
  );


  setTradingInputValue(
    [
      "aksi",
      "action",
      "transactionAction"
    ],
    transaction?.aksi ||
    ""
  );


  setTradingInputValue(
    [
      "harga",
      "price",
      "transactionPrice"
    ],
    transaction?.harga ??
    ""
  );


  setTradingInputValue(
    [
      "lot",
      "quantity",
      "transactionLot"
    ],
    transaction?.lot ??
    ""
  );


  setTradingInputValue(
    [
      "hasil",
      "profitRugi",
      "transactionResult"
    ],
    normalizeTradingResult(
      transaction?.hasil ??
      transaction?.profitRugi ??
      ""
    )
  );


  setTradingInputValue(
    [
      "nominal",
      "profitLossAmount",
      "transactionNominal"
    ],
    Math.abs(
      getTradingNominal(
        transaction
      )
    )
  );


  setTradingInputValue(
    [
      "catatan",
      "note",
      "transactionNote"
    ],
    transaction?.catatan ||
    ""
  );


  updateTradingResultUI();

}


/* =========================================================
   CANCEL EDIT
========================================================= */

function cancelTransactionEdit() {

  editingTransactionId =
    null;


  resetTransactionForm();


  setTradingEditMode(
    false
  );


  showTradingToast(
    "Dibatalkan",
    "Mode edit dibatalkan.",
    "success"
  );

}


/* =========================================================
   RESET FORM
========================================================= */

function resetTransactionForm() {

  const form =
    document.getElementById(
      "transactionForm"
    );


  if (
    form &&
    typeof form.reset ===
      "function"
  ) {

    form.reset();

  }


  setTradingInputValue(
    [
      "tanggal",
      "transactionDate",
      "tradeDate"
    ],
    getTodayStringTrading()
  );


  editingTransactionId =
    null;


  updateTradingResultUI();

}


/* =========================================================
   EDIT MODE UI
========================================================= */

function setTradingEditMode(
  edit
) {

  const titles =
    document.querySelectorAll(
      "#transactionFormTitle, #formTitle, #transactionTitle"
    );


  titles.forEach(
    element => {

      element.textContent =
        edit
          ? "Edit Transaksi"
          : "Tambah Transaksi";

    }
  );


  const saveButtons =
    document.querySelectorAll(
      "#saveTransactionButton, #addTransactionButton"
    );


  saveButtons.forEach(
    button => {

      button.textContent =
        edit
          ? "Simpan Perubahan"
          : "Simpan Transaksi";

    }
  );


  const cancelButtons =
    document.querySelectorAll(
      "#cancelEditButton, #cancelTransactionButton"
    );


  cancelButtons.forEach(
    button => {

      button.classList.toggle(
        "hidden",
        !edit
      );

    }
  );

}


/* =========================================================
   ADD CAPITAL
========================================================= */

async function handleAddCapital() {

  const amount =
    getTradingNumberFromInput(
      [
        "addCapitalAmount",
        "capitalAmount",
        "modalAmount"
      ]
    );


  const note =
    getTradingInputValue(
      [
        "addCapitalNote",
        "capitalNote",
        "modalNote"
      ]
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showTradingToast(
      "Nominal tidak valid",
      "Masukkan nominal tambah modal yang benar.",
      "error"
    );

    return;

  }


  try {

    if (
      !window.TradingAPI ||
      typeof window.TradingAPI.addCapital !==
        "function"
    ) {

      throw new Error(
        "TradingAPI.addCapital tidak tersedia."
      );

    }


    showTradingLoading(
      true,
      "Menambah modal..."
    );


    await window.TradingAPI.addCapital(
      amount,
      note
    );


    showTradingToast(
      "Berhasil",
      "Modal berhasil ditambahkan.",
      "success"
    );


    clearCapitalForm(
      [
        "addCapitalAmount",
        "capitalAmount",
        "modalAmount"
      ],
      [
        "addCapitalNote",
        "capitalNote",
        "modalNote"
      ]
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "[Trading] Add capital error:",
      error
    );


    showTradingToast(
      "Gagal",
      getTradingErrorMessage(error),
      "error"
    );


  } finally {

    showTradingLoading(
      false
    );

  }

}


/* =========================================================
   WITHDRAW CAPITAL
========================================================= */

async function handleWithdrawCapital() {

  const amount =
    getTradingNumberFromInput(
      [
        "withdrawCapitalAmount",
        "withdrawAmount",
        "tarikModalAmount"
      ]
    );


  const note =
    getTradingInputValue(
      [
        "withdrawCapitalNote",
        "withdrawNote",
        "tarikModalNote"
      ]
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showTradingToast(
      "Nominal tidak valid",
      "Masukkan nominal penarikan yang benar.",
      "error"
    );

    return;

  }


  try {

    if (
      !window.TradingAPI ||
      typeof window.TradingAPI.withdrawCapital !==
        "function"
    ) {

      throw new Error(
        "TradingAPI.withdrawCapital tidak tersedia."
      );

    }


    showTradingLoading(
      true,
      "Menarik modal..."
    );


    await window.TradingAPI.withdrawCapital(
      amount,
      note
    );


    showTradingToast(
      "Berhasil",
      "Penarikan modal berhasil.",
      "success"
    );


    clearCapitalForm(
      [
        "withdrawCapitalAmount",
        "withdrawAmount",
        "tarikModalAmount"
      ],
      [
        "withdrawCapitalNote",
        "withdrawNote",
        "tarikModalNote"
      ]
    );


    await loadTradingData();


  } catch (error) {

    console.error(
      "[Trading] Withdraw error:",
      error
    );


    showTradingToast(
      "Gagal",
      getTradingErrorMessage(error),
      "error"
    );


  } finally {

    showTradingLoading(
      false
    );

  }

}


/* =========================================================
   CLEAR CAPITAL FORM
========================================================= */

function clearCapitalForm(
  amountIds,
  noteIds
) {

  amountIds.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.value =
          "";

      }

    }
  );


  noteIds.forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.value =
          "";

      }

    }
  );

}


/* =========================================================
   RESULT UI
========================================================= */

function updateTradingResultUI() {

  const result =
    normalizeTradingResult(
      getTradingInputValue(
        [
          "hasil",
          "profitRugi",
          "transactionResult"
        ]
      )
    );


  const nominal =
    getTradingNumberFromInput(
      [
        "nominal",
        "profitLossAmount",
        "transactionNominal"
      ]
    );


  const previews =
    document.querySelectorAll(
      "#nominalPreview, #profitLossPreview, #resultPreview"
    );


  previews.forEach(
    element => {

      let value =
        nominal;


      if (
        result === "RUGI"
      ) {

        value =
          -Math.abs(
            nominal
          );

      }


      element.textContent =
        formatTradingSignedRupiah(
          value
        );

      element.classList.remove(
        "text-profit",
        "text-loss",
        "positive",
        "negative"
      );


      if (
        value > 0
      ) {

        element.classList.add(
          "text-profit",
          "positive"
        );

      } else if (
        value < 0
      ) {

        element.classList.add(
          "text-loss",
          "negative"
        );

      }

    }
  );

}


/* =========================================================
   DISABLE BUTTONS
========================================================= */

function setTradingButtonsDisabled(
  disabled
) {

  const buttons =
    document.querySelectorAll(
      "#saveTransactionButton, #addTransactionButton, #submitTransactionButton"
    );


  buttons.forEach(
    button => {

      button.disabled =
        disabled;

    }
  );

}


/* =========================================================
   LOADING
========================================================= */

function showTradingLoading(
  show,
  message = "Memuat..."
) {

  const global =
    document.getElementById(
      "globalLoading"
    );


  const loadingText =
    document.getElementById(
      "globalLoadingText"
    );


  if (loadingText) {

    loadingText.textContent =
      message;

  }


  if (global) {

    global.classList.toggle(
      "hidden",
      !show
    );

  }


  const pageLoading =
    document.getElementById(
      "tradingLoading"
    );


  if (pageLoading) {

    pageLoading.classList.toggle(
      "hidden",
      !show
    );

  }

}


/* =========================================================
   SET TODAY
========================================================= */

function setTradingToday() {

  setTradingInputValue(
    [
      "tanggal",
      "transactionDate",
      "tradeDate"
    ],
    getTodayStringTrading()
  );


  const todayElements =
    document.querySelectorAll(
      "#todayDate, #reportToday, [data-today]"
    );


  todayElements.forEach(
    element => {

      element.textContent =
        formatTradingDate(
          new Date()
        );

    }
  );

}


/* =========================================================
   NEXT
   TAHAP 2 BERISI:
   - format number/date
   - normalize result
   - action/result badge
   - toast
   - escape HTML
   - capital helper
   - API compatibility
   - public Trading object
   - shortcut global
========================================================= */
/* =========================================================
   TRADING JOURNAL
   trading.js
   TAHAP 2
   EDIT + HAPUS + TABLE + MODAL + RENDER + SYNC

   LANJUTAN DARI TAHAP 1
========================================================= */

"use strict";


/* =========================================================
   STATE TAMBAHAN
========================================================= */

let editingTransactionId = null;

let deletingTransactionId = null;

let tradingTableData = [];

let tradingSearchKeyword = "";

let tradingCurrentPage = 1;

const TRADING_PAGE_SIZE = 20;


/* =========================================================
   DOM READY TAMBAHAN
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    setupTradingStage2Events();

  }
);


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupTradingStage2Events() {

  /*
   * SEARCH
   */

  const searchInput =
    document.getElementById(
      "searchTransaction"
    );

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        tradingSearchKeyword =
          this.value
            .trim()
            .toLowerCase();

        tradingCurrentPage = 1;

        renderTradingTable();

      }
    );

  }


  /*
   * REFRESH
   */

  const refreshButton =
    document.getElementById(
      "refreshButton"
    );

  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      function () {

        refreshTradingData();

      }
    );

  }


  /*
   * CLOSE EDIT MODAL
   */

  const closeEditButton =
    document.getElementById(
      "closeEditModal"
    );

  if (closeEditButton) {

    closeEditButton.addEventListener(
      "click",
      closeEditTransactionModal
    );

  }


  const cancelEditButton =
    document.getElementById(
      "cancelEditButton"
    );

  if (cancelEditButton) {

    cancelEditButton.addEventListener(
      "click",
      closeEditTransactionModal
    );

  }


  /*
   * SAVE EDIT
   */

  const saveEditButton =
    document.getElementById(
      "saveEditButton"
    );

  if (saveEditButton) {

    saveEditButton.addEventListener(
      "click",
      saveEditedTransaction
    );

  }


  /*
   * CLOSE MODAL JIKA KLIK LUAR
   */

  const editModal =
    document.getElementById(
      "editTransactionModal"
    );

  if (editModal) {

    editModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          editModal
        ) {

          closeEditTransactionModal();

        }

      }
    );

  }


  /*
   * CONFIRM DELETE
   */

  const confirmDeleteButton =
    document.getElementById(
      "confirmDeleteButton"
    );

  if (confirmDeleteButton) {

    confirmDeleteButton.addEventListener(
      "click",
      confirmDeleteTransaction
    );

  }


  /*
   * CANCEL DELETE
   */

  const cancelDeleteButton =
    document.getElementById(
      "cancelDeleteButton"
    );

  if (cancelDeleteButton) {

    cancelDeleteButton.addEventListener(
      "click",
      closeDeleteModal
    );

  }


  /*
   * CLOSE DELETE
   */

  const closeDeleteButton =
    document.getElementById(
      "closeDeleteModal"
    );

  if (closeDeleteButton) {

    closeDeleteButton.addEventListener(
      "click",
      closeDeleteModal
    );

  }


  /*
   * FORM EDIT SUBMIT
   */

  const editForm =
    document.getElementById(
      "editTransactionForm"
    );

  if (editForm) {

    editForm.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();

        saveEditedTransaction();

      }
    );

  }

}


/* =========================================================
   REFRESH DATA
========================================================= */

async function refreshTradingData() {

  try {

    showTradingGlobalLoading(
      true,
      "Memuat data trading..."
    );


    const transactions =
      await TradingAPI.getTransactions();


    tradingTableData =
      normalizeTradingTransactions(
        transactions
      );


    /*
     * Jika tahap 1 memiliki state
     * transactions global, sinkronkan.
     */

    if (
      typeof window.transactions !==
      "undefined"
    ) {

      window.transactions =
        tradingTableData;

    }


    if (
      typeof window.tradingTransactions !==
      "undefined"
    ) {

      window.tradingTransactions =
        tradingTableData;

    }


    renderTradingTable();

    updateTradingSummaryFromData();


    showTradingToast(
      "Berhasil",
      "Data trading berhasil diperbarui.",
      "success"
    );


  } catch (error) {

    console.error(
      "REFRESH TRADING ERROR:",
      error
    );


    showTradingToast(
      "Gagal",
      getTradingErrorMessage(
        error
      ),
      "error"
    );


  } finally {

    showTradingGlobalLoading(
      false
    );

  }

}


/* =========================================================
   NORMALIZE TRANSACTIONS
========================================================= */

function normalizeTradingTransactions(
  data
) {

  if (
    !Array.isArray(data)
  ) {

    return [];

  }


  return data.map(
    function (transaction, index) {

      const item =
        {
          ...transaction
        };


      /*
       * ID
       */

      item.id =
        transaction.id ??
        transaction.ID ??
        transaction.Id ??
        transaction.rowId ??
        transaction.rowNumber ??
        transaction._id ??
        index + 1;


      /*
       * NORMALIZE FIELD
       */

      item.tanggal =
        transaction.tanggal ??
        transaction.date ??
        "";


      item.saham =
        String(
          transaction.saham ??
          transaction.stock ??
          ""
        )
        .trim()
        .toUpperCase();


      item.aksi =
        String(
          transaction.aksi ??
          transaction.action ??
          ""
        )
        .trim()
        .toUpperCase();


      item.harga =
        parseTradingNumber(
          transaction.harga ??
          transaction.price
        );


      item.lot =
        parseTradingNumber(
          transaction.lot
        );


      item.hasil =
        normalizeTradingResult(
          transaction.hasil ??
          transaction.profitRugi ??
          transaction.result ??
          ""
        );


      item.profitRugi =
        item.hasil;


      item.nominal =
        parseTradingNumber(
          transaction.nominal ??
          transaction.amount
        );


      item.catatan =
        transaction.catatan ??
        transaction.note ??
        "";


      return item;

    }
  );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderTradingTable() {

  const tbody =
    document.getElementById(
      "transactionTableBody"
    ) ||
    document.getElementById(
      "transactionsBody"
    ) ||
    document.getElementById(
      "tradingTableBody"
    );


  if (!tbody) {

    console.warn(
      "tbody transaksi tidak ditemukan."
    );

    return;

  }


  const filtered =
    getTradingFilteredData();


  const start =
    (
      tradingCurrentPage -
      1
    ) *
    TRADING_PAGE_SIZE;


  const pageData =
    filtered.slice(
      start,
      start +
      TRADING_PAGE_SIZE
    );


  tbody.innerHTML =
    "";


  if (
    pageData.length === 0
  ) {

    const row =
      document.createElement(
        "tr"
      );


    row.innerHTML = `

      <td
        colspan="10"
        class="empty-table-cell"
      >
        Belum ada transaksi.
      </td>

    `;


    tbody.appendChild(
      row
    );


    updateTradingPagination(
      filtered.length
    );

    return;

  }


  pageData.forEach(
    function (
      transaction
    ) {

      tbody.appendChild(
        createTradingTableRow(
          transaction
        )
      );

    }
  );


  updateTradingPagination(
    filtered.length
  );

}


/* =========================================================
   CREATE TABLE ROW
========================================================= */

function createTradingTableRow(
  transaction
) {

  const row =
    document.createElement(
      "tr"
    );


  const id =
    transaction.id;


  const tanggal =
    formatTradingDate(
      transaction.tanggal
    );


  const saham =
    transaction.saham ||
    "-";


  const aksi =
    transaction.aksi ||
    "-";


  const harga =
    formatTradingRupiah(
      transaction.harga
    );


  const lot =
    formatTradingNumber(
      transaction.lot
    );


  const hasil =
    transaction.hasil ||
    "-";


  const nominal =
    transaction.nominal;


  const catatan =
    transaction.catatan ||
    "-";


  const actionClass =
    aksi === "BUY"
      ? "badge-buy"
      : aksi === "SELL"
        ? "badge-sell"
        : "";


  const resultClass =
    hasil === "PROFIT"
      ? "badge-profit"
      : hasil === "RUGI"
        ? "badge-loss"
        : "";


  const amountClass =
    nominal > 0
      ? "text-profit"
      : nominal < 0
        ? "text-loss"
        : "text-muted";


  row.innerHTML = `

    <td>
      ${escapeTradingHtml(
        tanggal
      )}
    </td>

    <td>
      <strong>
        ${escapeTradingHtml(
          saham
        )}
      </strong>
    </td>

    <td>
      <span class="badge ${actionClass}">
        ${escapeTradingHtml(
          aksi
        )}
      </span>
    </td>

    <td>
      ${harga}
    </td>

    <td>
      ${lot}
    </td>

    <td>
      <span class="badge ${resultClass}">
        ${escapeTradingHtml(
          hasil
        )}
      </span>
    </td>

    <td class="${amountClass}">
      ${
        nominal !== 0
          ? formatTradingSignedRupiah(
              nominal
            )
          : "-"
      }
    </td>

    <td>
      ${escapeTradingHtml(
        catatan
      )}
    </td>

    <td>

      <div class="transaction-actions">

        <button
          type="button"
          class="edit-transaction-button"
          data-id="${escapeTradingAttribute(id)}"
        >
          Edit
        </button>

        <button
          type="button"
          class="delete-transaction-button"
          data-id="${escapeTradingAttribute(id)}"
        >
          Hapus
        </button>

      </div>

    </td>

  `;


  /*
   * EDIT
   */

  const editButton =
    row.querySelector(
      ".edit-transaction-button"
    );


  if (editButton) {

    editButton.addEventListener(
      "click",
      function () {

        openEditTransactionModal(
          id
        );

      }
    );

  }


  /*
   * DELETE
   */

  const deleteButton =
    row.querySelector(
      ".delete-transaction-button"
    );


  if (deleteButton) {

    deleteButton.addEventListener(
      "click",
      function () {

        openDeleteTransactionModal(
          id
        );

      }
    );

  }


  return row;

}


/* =========================================================
   FILTER TABLE
========================================================= */

function getTradingFilteredData() {

  let data =
    Array.isArray(
      tradingTableData
    )
      ? [...tradingTableData]
      : [];


  if (
    tradingSearchKeyword
  ) {

    data =
      data.filter(
        function (
          transaction
        ) {

          const text =
            [
              transaction.tanggal,
              transaction.saham,
              transaction.aksi,
              transaction.hasil,
              transaction.catatan,
              transaction.harga,
              transaction.lot,
              transaction.nominal
            ]
              .join(" ")
              .toLowerCase();


          return text.includes(
            tradingSearchKeyword
          );

        }
      );

  }


  data.sort(
    function (
      a,
      b
    ) {

      const dateA =
        parseTradingDate(
          a.tanggal
        );


      const dateB =
        parseTradingDate(
          b.tanggal
        );


      return (
        (dateB?.getTime() || 0) -
        (dateA?.getTime() || 0)
      );

    }
  );


  return data;

}


/* =========================================================
   EDIT TRANSACTION
========================================================= */

function openEditTransactionModal(
  id
) {

  const transaction =
    findTradingTransactionById(
      id
    );


  if (!transaction) {

    showTradingToast(
      "Gagal",
      "Transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  editingTransactionId =
    transaction.id;


  /*
   * Isi field edit.
   */

  setTradingInputValue(
    [
      "editTanggal",
      "editTransactionDate"
    ],
    convertTradingDateToInput(
      transaction.tanggal
    )
  );


  setTradingInputValue(
    [
      "editSaham",
      "editTransactionStock"
    ],
    transaction.saham
  );


  setTradingInputValue(
    [
      "editAksi",
      "editTransactionAction"
    ],
    transaction.aksi
  );


  setTradingInputValue(
    [
      "editHarga",
      "editTransactionPrice"
    ],
    transaction.harga
  );


  setTradingInputValue(
    [
      "editLot",
      "editTransactionLot"
    ],
    transaction.lot
  );


  setTradingInputValue(
    [
      "editHasil",
      "editTransactionResult"
    ],
    transaction.hasil
  );


  setTradingInputValue(
    [
      "editNominal",
      "editTransactionAmount"
    ],
    Math.abs(
      transaction.nominal
    )
  );


  setTradingInputValue(
    [
      "editCatatan",
      "editTransactionNote"
    ],
    transaction.catatan
  );


  const modal =
    document.getElementById(
      "editTransactionModal"
    );


  if (!modal) {

    /*
     * Fallback jika modal belum ada.
     */

    showTradingToast(
      "Edit",
      "Form modal edit belum tersedia di HTML.",
      "error"
    );

    return;

  }


  modal.classList.remove(
    "hidden"
  );


  modal.classList.add(
    "show"
  );


  document.body.classList.add(
    "modal-open"
  );

}


/* =========================================================
   SAVE EDIT
========================================================= */

async function saveEditedTransaction() {

  if (
    editingTransactionId ===
    null ||
    editingTransactionId ===
    undefined
  ) {

    showTradingToast(
      "Gagal",
      "ID transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  const transaction =
    collectEditTransactionForm();


  if (!validateTradingTransaction(
    transaction
  )) {

    return;

  }


  try {

    showTradingGlobalLoading(
      true,
      "Menyimpan perubahan..."
    );


    /*
     * Backend API yang diperlukan:
     *
     * action:
     * update_transaction
     */

    if (
      !window.TradingAPI ||
      typeof window.TradingAPI.post !==
        "function"
    ) {

      throw new Error(
        "TradingAPI tidak tersedia."
      );

    }


    const result =
      await window.TradingAPI.post(
        "update_transaction",
        {

          id:
            editingTransactionId,

          tanggal:
            transaction.tanggal,

          saham:
            transaction.saham,

          aksi:
            transaction.aksi,

          harga:
            transaction.harga,

          lot:
            transaction.lot,

          profitRugi:
            transaction.profitRugi,

          nominal:
            transaction.nominal,

          catatan:
            transaction.catatan

        }
      );


    console.log(
      "UPDATE RESULT:",
      result
    );


    /*
     * Tutup modal.
     */

    closeEditTransactionModal();


    /*
     * Ambil ulang dari Google Sheets.
     */

    await refreshTradingData();


    showTradingToast(
      "Berhasil",
      "Transaksi berhasil diperbarui.",
      "success"
    );


  } catch (error) {

    console.error(
      "UPDATE TRANSACTION ERROR:",
      error
    );


    showTradingToast(
      "Gagal mengedit",
      getTradingErrorMessage(
        error
      ),
      "error"
    );


  } finally {

    showTradingGlobalLoading(
      false
    );

  }

}


/* =========================================================
   COLLECT EDIT FORM
========================================================= */

function collectEditTransactionForm() {

  const tanggal =
    getTradingInputValue(
      [
        "editTanggal",
        "editTransactionDate"
      ]
    );


  const saham =
    getTradingInputValue(
      [
        "editSaham",
        "editTransactionStock"
      ]
    )
      .toUpperCase();


  const aksi =
    getTradingInputValue(
      [
        "editAksi",
        "editTransactionAction"
      ]
    )
      .toUpperCase();


  const harga =
    parseTradingNumber(
      getTradingInputValue(
        [
          "editHarga",
          "editTransactionPrice"
        ]
      )
    );


  const lot =
    parseTradingNumber(
      getTradingInputValue(
        [
          "editLot",
          "editTransactionLot"
        ]
      )
    );


  const hasil =
    normalizeTradingResult(
      getTradingInputValue(
        [
          "editHasil",
          "editTransactionResult"
        ]
      )
    );


  const nominalInput =
    parseTradingNumber(
      getTradingInputValue(
        [
          "editNominal",
          "editTransactionAmount"
        ]
      )
    );


  const catatan =
    getTradingInputValue(
      [
        "editCatatan",
        "editTransactionNote"
      ]
    );


  /*
   * Nominal dikirim positif.
   * Backend akan menentukan PROFIT/RUGI.
   */

  const nominal =
    nominalInput;


  return {

    tanggal:
      tanggal,

    saham:
      saham,

    aksi:
      aksi,

    harga:
      harga,

    lot:
      lot,

    profitRugi:
      hasil,

    hasil:
      hasil,

    nominal:
      nominal,

    catatan:
      catatan

  };

}


/* =========================================================
   VALIDATE TRANSACTION
========================================================= */

function validateTradingTransaction(
  transaction
) {

  if (
    !transaction.tanggal
  ) {

    showTradingToast(
      "Validasi",
      "Tanggal wajib diisi.",
      "error"
    );

    return false;

  }


  if (
    !transaction.saham
  ) {

    showTradingToast(
      "Validasi",
      "Kode saham wajib diisi.",
      "error"
    );

    return false;

  }


  if (
    transaction.aksi !== "BUY" &&
    transaction.aksi !== "SELL"
  ) {

    showTradingToast(
      "Validasi",
      "Aksi harus BUY atau SELL.",
      "error"
    );

    return false;

  }


  if (
    !Number.isFinite(
      transaction.harga
    ) ||
    transaction.harga <= 0
  ) {

    showTradingToast(
      "Validasi",
      "Harga harus lebih besar dari 0.",
      "error"
    );

    return false;

  }


  if (
    !Number.isFinite(
      transaction.lot
    ) ||
    transaction.lot <= 0
  ) {

    showTradingToast(
      "Validasi",
      "Lot harus lebih besar dari 0.",
      "error"
    );

    return false;

  }


  if (
    transaction.profitRugi &&
    transaction.profitRugi !==
      "PROFIT" &&
    transaction.profitRugi !==
      "RUGI"
  ) {

    showTradingToast(
      "Validasi",
      "Hasil harus PROFIT atau RUGI.",
      "error"
    );

    return false;

  }


  if (
    transaction.profitRugi &&
    transaction.nominal <= 0
  ) {

    showTradingToast(
      "Validasi",
      "Nominal hasil wajib lebih besar dari 0.",
      "error"
    );

    return false;

  }


  return true;

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

    modal.classList.add(
      "hidden"
    );

    modal.classList.remove(
      "show"
    );

  }


  editingTransactionId =
    null;


  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   OPEN DELETE MODAL
========================================================= */

function openDeleteTransactionModal(
  id
) {

  const transaction =
    findTradingTransactionById(
      id
    );


  if (!transaction) {

    showTradingToast(
      "Gagal",
      "Transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  deletingTransactionId =
    transaction.id;


  const stockElement =
    document.getElementById(
      "deleteTransactionStock"
    );


  if (stockElement) {

    stockElement.textContent =
      transaction.saham ||
      "-";

  }


  const modal =
    document.getElementById(
      "deleteTransactionModal"
    );


  if (!modal) {

    /*
     * Fallback konfirmasi browser.
     */

    const confirmed =
      window.confirm(
        "Hapus transaksi " +
        transaction.saham +
        "?"
      );


    if (confirmed) {

      deleteTradingTransaction(
        transaction.id
      );

    }

    return;

  }


  modal.classList.remove(
    "hidden"
  );


  modal.classList.add(
    "show"
  );


  document.body.classList.add(
    "modal-open"
  );

}


/* =========================================================
   CONFIRM DELETE
========================================================= */

async function confirmDeleteTransaction() {

  if (
    deletingTransactionId ===
    null ||
    deletingTransactionId ===
    undefined
  ) {

    showTradingToast(
      "Gagal",
      "ID transaksi tidak ditemukan.",
      "error"
    );

    return;

  }


  await deleteTradingTransaction(
    deletingTransactionId
  );

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTradingTransaction(
  id
) {

  try {

    showTradingGlobalLoading(
      true,
      "Menghapus transaksi..."
    );


    /*
     * =====================================================
     * API DELETE
     * =====================================================
     *
     * api.js yang sekarang memang mempunyai:
     *
     * TradingAPI.deleteTransaction()
     *
     * tetapi fungsi tersebut belum aktif.
     *
     * Untuk backend baru gunakan:
     *
     * delete_transaction
     */

    let result;


    if (
      window.TradingAPI &&
      typeof window.TradingAPI.post ===
        "function"
    ) {

      result =
        await window.TradingAPI.post(
          "delete_transaction",
          {

            id:
              id

          }
        );

    } else {

      throw new Error(
        "TradingAPI tidak tersedia."
      );

    }


    console.log(
      "DELETE RESULT:",
      result
    );


    /*
     * Tutup modal.
     */

    closeDeleteModal();


    /*
     * Ambil data terbaru.
     */

    await refreshTradingData();


    showTradingToast(
      "Berhasil",
      "Transaksi berhasil dihapus.",
      "success"
    );


  } catch (error) {

    console.error(
      "DELETE TRANSACTION ERROR:",
      error
    );


    showTradingToast(
      "Gagal menghapus",
      getTradingErrorMessage(
        error
      ),
      "error"
    );


  } finally {

    showTradingGlobalLoading(
      false
    );

  }

}


/* =========================================================
   CLOSE DELETE MODAL
========================================================= */

function closeDeleteModal() {

  const modal =
    document.getElementById(
      "deleteTransactionModal"
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );

    modal.classList.remove(
      "show"
    );

  }


  deletingTransactionId =
    null;


  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   FIND TRANSACTION
========================================================= */

function findTradingTransactionById(
  id
) {

  return (
    tradingTableData.find(
      function (
        transaction
      ) {

        return String(
          transaction.id
        ) ===
        String(id);

      }
    ) ||
    null
  );

}


/* =========================================================
   SET INPUT VALUE
========================================================= */

function setTradingInputValue(
  ids,
  value
) {

  for (
    const id of ids
  ) {

    const element =
      document.getElementById(
        id
      );


    if (element) {

      element.value =
        value ?? "";

      return;

    }

  }

}


/* =========================================================
   GET INPUT VALUE
========================================================= */

function getTradingInputValue(
  ids
) {

  for (
    const id of ids
  ) {

    const element =
      document.getElementById(
        id
      );


    if (element) {

      return String(
        element.value ??
        ""
      ).trim();

    }

  }


  return "";

}


/* =========================================================
   PAGINATION
========================================================= */

function updateTradingPagination(
  total
) {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
        TRADING_PAGE_SIZE
      )
    );


  const pageLabel =
    document.getElementById(
      "tradingPageLabel"
    );


  if (pageLabel) {

    pageLabel.textContent =
      `${tradingCurrentPage} / ${totalPages}`;

  }


  const previous =
    document.getElementById(
      "tradingPreviousPage"
    );


  if (previous) {

    previous.disabled =
      tradingCurrentPage <= 1;

  }


  const next =
    document.getElementById(
      "tradingNextPage"
    );


  if (next) {

    next.disabled =
      tradingCurrentPage >=
      totalPages;

  }


  if (previous) {

    previous.onclick =
      function () {

        if (
          tradingCurrentPage > 1
        ) {

          tradingCurrentPage--;

          renderTradingTable();

        }

      };

  }


  if (next) {

    next.onclick =
      function () {

        if (
          tradingCurrentPage <
          totalPages
        ) {

          tradingCurrentPage++;

          renderTradingTable();

        }

      };

  }

}


/* =========================================================
   SUMMARY
========================================================= */

function updateTradingSummaryFromData() {

  const data =
    Array.isArray(
      tradingTableData
    )
      ? tradingTableData
      : [];


  let profit =
    0;

  let loss =
    0;

  let profitCount =
    0;

  let lossCount =
    0;


  data.forEach(
    function (
      transaction
    ) {

      const amount =
        parseTradingNumber(
          transaction.nominal
        );


      const result =
        normalizeTradingResult(
          transaction.hasil ??
          transaction.profitRugi
        );


      if (
        amount > 0 &&
        result === "PROFIT"
      ) {

        profit +=
          amount;

        profitCount++;

      } else if (
        amount > 0 &&
        result === "RUGI"
      ) {

        loss +=
          amount;

        lossCount++;

      } else if (
        amount < 0
      ) {

        loss +=
          Math.abs(amount);

        lossCount++;

      }

    }
  );


  /*
   * ID summary dibuat fleksibel
   * supaya cocok dengan tahap 1.
   */

  setTradingText(
    [
      "totalTransactions",
      "transactionCount",
      "totalTrades"
    ],
    formatTradingNumber(
      data.length
    )
  );


  setTradingText(
    [
      "totalProfit",
      "profitValue",
      "profit"
    ],
    formatTradingSignedRupiah(
      profit
    )
  );


  setTradingText(
    [
      "totalLoss",
      "lossValue",
      "loss"
    ],
    formatTradingSignedRupiah(
      -loss
    )
  );


  setTradingText(
    [
      "netProfit",
      "netValue",
      "net"
    ],
    formatTradingSignedRupiah(
      profit -
      loss
    )
  );


  const completed =
    profitCount +
    lossCount;


  const winRate =
    completed > 0
      ? (
          profitCount /
          completed
        ) *
        100
      : 0;


  setTradingText(
    [
      "winRate"
    ],
    winRate.toFixed(
      1
    ) +
    "%"
  );


  setTradingText(
    [
      "profitCount",
      "winCount"
    ],
    formatTradingNumber(
      profitCount
    )
  );


  setTradingText(
    [
      "lossCount"
    ],
    formatTradingNumber(
      lossCount
    )
  );

}


/* =========================================================
   SET TEXT MULTI ID
========================================================= */

function setTradingText(
  ids,
  value
) {

  ids.forEach(
    function (id) {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.textContent =
          value;

      }

    }
  );

}


/* =========================================================
   PARSE NUMBER
========================================================= */

function parseTradingNumber(
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


  let text =
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
      "."
    );


  const number =
    Number(
      text
    );


  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatTradingNumber(
  value
) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    parseTradingNumber(
      value
    )
  );

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatTradingRupiah(
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
    parseTradingNumber(
      value
    )
  );

}


/* =========================================================
   FORMAT SIGNED RUPIAH
========================================================= */

function formatTradingSignedRupiah(
  value
) {

  const number =
    parseTradingNumber(
      value
    );


  if (
    number > 0
  ) {

    return (
      "+" +
      formatTradingRupiah(
        number
      )
    );

  }


  if (
    number < 0
  ) {

    return (
      "-" +
      formatTradingRupiah(
        Math.abs(
          number
        )
      )
    );

  }


  return formatTradingRupiah(
    0
  );

}


/* =========================================================
   NORMALIZE RESULT
========================================================= */

function normalizeTradingResult(
  value
) {

  const result =
    String(
      value ??
      ""
    )
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
   PARSE DATE
========================================================= */

function parseTradingDate(
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


  const text =
    String(
      value
    ).trim();


  let match =
    text.match(
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
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );


  if (match) {

    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      12
    );

  }


  const date =
    new Date(
      text
    );


  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatTradingDate(
  value
) {

  const date =
    parseTradingDate(
      value
    );


  if (!date) {

    return String(
      value ||
      "-"
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
   DATE INPUT
========================================================= */

function convertTradingDateToInput(
  value
) {

  const date =
    parseTradingDate(
      value
    );


  if (!date) {

    return "";

  }


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
    year +
    "-" +
    month +
    "-" +
    day
  );

}


/* =========================================================
   ERROR
========================================================= */

function getTradingErrorMessage(
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

function showTradingToast(
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
      3500
    );

}


/* =========================================================
   GLOBAL LOADING
========================================================= */

function showTradingGlobalLoading(
  show,
  text = "Memuat..."
) {

  const loading =
    document.getElementById(
      "globalLoading"
    );


  if (!loading) {

    return;

  }


  const textElement =
    document.getElementById(
      "globalLoadingText"
    );


  if (textElement) {

    textElement.textContent =
      text;

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
   ESCAPE HTML
========================================================= */

function escapeTradingHtml(
  value
) {

  return String(
    value ??
    ""
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

function escapeTradingAttribute(
  value
) {

  return escapeTradingHtml(
    value
  );

}


/* =========================================================
   PUBLIC API
========================================================= */

window.TradingPage = {

  refresh:
    refreshTradingData,

  render:
    renderTradingTable,

  edit:
    openEditTransactionModal,

  delete:
    openDeleteTransactionModal,

  getData:
    function () {

      return [
        ...tradingTableData
      ];

    }

};


/* =========================================================
   GLOBAL SHORTCUTS
========================================================= */

window.refreshTradingData =
  refreshTradingData;


window.editTradingTransaction =
  openEditTransactionModal;


window.deleteTradingTransaction =
  openDeleteTransactionModal;


/* =========================================================
   AUTO LOAD
========================================================= */

setTimeout(
  function () {

    /*
     * Jangan memaksa load kalau
     * TradingAPI belum tersedia.
     */

    if (
      window.TradingAPI &&
      typeof window.TradingAPI.getTransactions ===
        "function"
    ) {

      refreshTradingData();

    }

  },
  300
);


/* =========================================================
   END TAHAP 2
========================================================= */
