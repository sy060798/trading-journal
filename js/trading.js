"use strict";

/* =========================================================
   TRADING JOURNAL
   TRADING.JS
   VERSION:
   FULL UPDATE - STAGE 1
   =========================================================

   GOOGLE SHEETS TRANSAKSI:

   ID
   Tanggal
   Saham
   Aksi
   Harga
   Lot
   Profit/Rugi
   Nominal
   Catatan
   Timestamp

   API:
   window.TradingAPI
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

const TradingState = {

  transactions: [],

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

  editingId: null,

  loading: false

};


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

  console.log(
    "[Trading] Initializing..."
  );


  setupDefaultDates();

  setupFormEvents();

  setupModalEvents();

  setupProfitRugiEvents();

  setupInputEvents();

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


  if (
    tanggal &&
    !tanggal.value
  ) {

    tanggal.value =
      today;

  }


  const addTanggal =
    document.getElementById(
      "addModalTanggal"
    );


  if (
    addTanggal &&
    !addTanggal.value
  ) {

    addTanggal.value =
      today;

  }


  const withdrawTanggal =
    document.getElementById(
      "withdrawModalTanggal"
    );


  if (
    withdrawTanggal &&
    !withdrawTanggal.value
  ) {

    withdrawTanggal.value =
      today;

  }

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadTradingData() {

  setTransactionLoading(
    true
  );


  try {

    console.log(
      "[Trading] Loading API data..."
    );


    if (
      !window.TradingAPI ||
      typeof TradingAPI.getAllData !==
        "function"
    ) {

      throw new Error(
        "TradingAPI belum tersedia. Pastikan api.js dimuat sebelum trading.js."
      );

    }


    const result =
      await TradingAPI.getAllData();


    console.log(
      "[Trading] API result:",
      result
    );


    if (
      !result
    ) {

      throw new Error(
        "Response API kosong."
      );

    }


    if (
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal mengambil data Trading Journal."
      );

    }


    const data =
      result.data || {};


    /*
     * ========================================
     * TRANSAKSI
     * ========================================
     */

    const rawTransactions =
      Array.isArray(
        data.transaksi
      )
        ? data.transaksi
        : Array.isArray(
            result.transactions
          )
          ? result.transactions
          : [];


    TradingState.transactions =
      rawTransactions.map(
        normalizeTransaction
      );


    /*
     * ========================================
     * MODAL
     * ========================================
     */

    TradingState.modal =
      Array.isArray(
        data.modal
      )
        ? data.modal
        : [];


    /*
     * ========================================
     * SUMMARY
     * ========================================
     */

    TradingState.summary =
      normalizeSummary(
        data.summary ||
        result.summary ||
        {}
      );


    console.log(
      "[Trading] Transactions:",
      TradingState.transactions
    );


    console.log(
      "[Trading] Summary:",
      TradingState.summary
    );


    /*
     * ========================================
     * RENDER
     * ========================================
     */

    renderSummary();

    renderRecentTransactions();


  } catch (error) {

    console.error(
      "[Trading] LOAD ERROR:",
      error
    );


    TradingState.transactions =
      [];


    renderRecentTransactions();


    showToast(
      "error",
      "Gagal Memuat Data",
      getErrorMessage(error)
    );


  } finally {

    setTransactionLoading(
      false
    );

  }

}


/* =========================================================
   NORMALIZE TRANSACTION
========================================================= */

/**
 * Google Sheets backend mengembalikan:
 *
 * {
 *   ID: "...",
 *   Tanggal: "...",
 *   Saham: "...",
 *   Aksi: "...",
 *   Harga: 8200,
 *   Lot: 10,
 *   "Profit/Rugi": "PROFIT",
 *   Nominal: 300000,
 *   Catatan: "...",
 *   Timestamp: "..."
 * }
 *
 * Kita ubah menjadi object internal.
 *
 * Header Google Sheet TIDAK diubah.
 */

function normalizeTransaction(
  row
) {

  if (
    !row ||
    typeof row !== "object"
  ) {

    return {

      ID: "",

      Tanggal: "",

      Saham: "",

      Aksi: "",

      Harga: 0,

      Lot: 0,

      "Profit/Rugi": "",

      Nominal: 0,

      Catatan: "",

      Timestamp: "",

      _id: "",

      _tanggal: "",

      _saham: "",

      _aksi: "",

      _harga: 0,

      _lot: 0,

      _profitRugi: "",

      _nominal: 0,

      _catatan: "",

      _timestamp: ""

    };

  }


  /*
   * ========================================
   * FIELD ASLI GOOGLE SHEETS
   * ========================================
   */

  const ID =
    String(
      row.ID ??
      row.id ??
      ""
    ).trim();


  const Tanggal =
    String(
      row.Tanggal ??
      row.tanggal ??
      ""
    ).trim();


  const Saham =
    String(
      row.Saham ??
      row.saham ??
      ""
    )
    .trim()
    .toUpperCase();


  const Aksi =
    String(
      row.Aksi ??
      row.aksi ??
      ""
    )
    .trim()
    .toUpperCase();


  const Harga =
    toNumber(
      row.Harga ??
      row.harga
    );


  const Lot =
    toNumber(
      row.Lot ??
      row.lot
    );


  const profitRugi =
    String(
      row["Profit/Rugi"] ??
      row.profitRugi ??
      row.hasil ??
      ""
    )
    .trim()
    .toUpperCase();


  const Nominal =
    toNumber(
      row.Nominal ??
      row.nominal
    );


  const Catatan =
    String(
      row.Catatan ??
      row.catatan ??
      ""
    ).trim();


  const Timestamp =
    String(
      row.Timestamp ??
      row.timestamp ??
      ""
    ).trim();


  /*
   * ========================================
   * SIMPAN FIELD ASLI
   * ========================================
   */

  return {

    ID:
      ID,

    Tanggal:
      Tanggal,

    Saham:
      Saham,

    Aksi:
      Aksi,

    Harga:
      Harga,

    Lot:
      Lot,

    "Profit/Rugi":
      profitRugi,

    Nominal:
      Nominal,

    Catatan:
      Catatan,

    Timestamp:
      Timestamp,


    /*
     * Internal alias.
     *
     * Dipakai oleh trading.js supaya
     * lebih mudah.
     */

    _id:
      ID,

    _tanggal:
      Tanggal,

    _saham:
      Saham,

    _aksi:
      Aksi,

    _harga:
      Harga,

    _lot:
      Lot,

    _profitRugi:
      profitRugi,

    _nominal:
      Nominal,

    _catatan:
      Catatan,

    _timestamp:
      Timestamp

  };

}


/* =========================================================
   NORMALIZE SUMMARY
========================================================= */

function normalizeSummary(
  summary
) {

  return {

    modalAwal:
      toNumber(
        summary.modalAwal
      ),

    totalTambah:
      toNumber(
        summary.totalTambah
      ),

    totalTarik:
      toNumber(
        summary.totalTarik
      ),

    modal:
      toNumber(
        summary.modal
      ),

    totalProfit:
      toNumber(
        summary.totalProfit
      ),

    totalRugi:
      toNumber(
        summary.totalRugi
      ),

    netProfit:
      toNumber(
        summary.netProfit
      ),

    total:
      toNumber(
        summary.total
      ),

    jumlahTransaksi:
      toNumber(
        summary.jumlahTransaksi
      ),

    jumlahProfit:
      toNumber(
        summary.jumlahProfit
      ),

    jumlahRugi:
      toNumber(
        summary.jumlahRugi
      ),

    winRate:
      toNumber(
        summary.winRate
      )

  };

}


/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary() {

  const summary =
    TradingState.summary || {};


  /*
   * MODAL
   */

  const modalValue =
    document.getElementById(
      "modalValue"
    );


  if (modalValue) {

    modalValue.textContent =
      formatRupiah(
        summary.modal
      );

  }


  /*
   * PROFIT / LOSS
   */

  const profitLossValue =
    document.getElementById(
      "profitLossValue"
    );


  const profitLossDescription =
    document.getElementById(
      "profitLossDescription"
    );


  const profitIcon =
    document.getElementById(
      "profitIcon"
    );


  const netProfit =
    toNumber(
      summary.netProfit
    );


  if (profitLossValue) {

    profitLossValue.textContent =
      formatRupiah(
        netProfit
      );

  }


  if (
    profitLossDescription
  ) {

    if (netProfit > 0) {

      profitLossDescription.textContent =
        "Net profit trading";

    }

    else if (netProfit < 0) {

      profitLossDescription.textContent =
        "Net loss trading";

    }

    else {

      profitLossDescription.textContent =
        "Net hasil trading";

    }

  }


  if (profitIcon) {

    if (netProfit > 0) {

      profitIcon.textContent =
        "↗";

      profitIcon.classList.add(
        "profit-positive"
      );

      profitIcon.classList.remove(
        "profit-negative"
      );

    }

    else if (netProfit < 0) {

      profitIcon.textContent =
        "↘";

      profitIcon.classList.add(
        "profit-negative"
      );

      profitIcon.classList.remove(
        "profit-positive"
      );

    }

    else {

      profitIcon.textContent =
        "→";

      profitIcon.classList.remove(
        "profit-positive"
      );

      profitIcon.classList.remove(
        "profit-negative"
      );

    }

  }


  /*
   * TOTAL
   */

  const totalValue =
    document.getElementById(
      "totalValue"
    );


  if (totalValue) {

    totalValue.textContent =
      formatRupiah(
        summary.total
      );

  }

}


/* =========================================================
   RENDER RECENT TRANSACTIONS
========================================================= */

function renderRecentTransactions() {

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


  /*
   * Bersihkan tabel.
   */

  tbody.innerHTML =
    "";


  /*
   * Ambil maksimal 10 terbaru.
   */

  const transactions =
    TradingState.transactions
      .slice()
      .sort(
        compareTransactionDate
      )
      .slice(
        0,
        10
      );


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


  transactions.forEach(
    function(transaction) {

      const row =
        document.createElement(
          "tr"
        );


      /*
       * TANGGAL
       */

      const dateCell =
        document.createElement(
          "td"
        );

      dateCell.textContent =
        formatDisplayDate(
          transaction._tanggal
        );


      /*
       * SAHAM
       */

      const stockCell =
        document.createElement(
          "td"
        );


      const stockStrong =
        document.createElement(
          "strong"
        );

      stockStrong.textContent =
        transaction._saham || "-";


      stockCell.appendChild(
        stockStrong
      );


      /*
       * AKSI
       */

      const actionCell =
        document.createElement(
          "td"
        );


      const actionBadge =
        document.createElement(
          "span"
        );


      actionBadge.textContent =
        transaction._aksi || "-";


      actionBadge.className =
        "transaction-action " +
        (
          transaction._aksi === "BUY"
            ? "buy"
            : "sell"
        );


      actionCell.appendChild(
        actionBadge
      );


      /*
       * HARGA
       */

      const priceCell =
        document.createElement(
          "td"
        );


      priceCell.textContent =
        formatNumber(
          transaction._harga
        );


      /*
       * LOT
       */

      const lotCell =
        document.createElement(
          "td"
        );


      lotCell.textContent =
        formatNumber(
          transaction._lot
        );


      /*
       * HASIL
       */

      const resultCell =
        document.createElement(
          "td"
        );


      if (
        transaction._profitRugi
      ) {

        const resultBadge =
          document.createElement(
            "span"
          );


        resultBadge.textContent =
          transaction._profitRugi;


        resultBadge.className =
          "transaction-result " +
          (
            transaction._profitRugi ===
            "PROFIT"
              ? "profit"
              : "loss"
          );


        resultCell.appendChild(
          resultBadge
        );

      }

      else {

        resultCell.textContent =
          "-";

      }


      /*
       * NOMINAL
       */

      const nominalCell =
        document.createElement(
          "td"
        );


      nominalCell.textContent =
        transaction._nominal > 0
          ? formatRupiah(
              transaction._nominal
            )
          : "-";


      /*
       * CATATAN
       */

      /*
       * CATATAN tidak ditampilkan
       * di tabel utama karena HTML
       * saat ini hanya menyediakan
       * 7 kolom.
       *
       * Tetap disimpan di object.
       */


      row.appendChild(
        dateCell
      );

      row.appendChild(
        stockCell
      );

      row.appendChild(
        actionCell
      );

      row.appendChild(
        priceCell
      );

      row.appendChild(
        lotCell
      );

      row.appendChild(
        resultCell
      );

      row.appendChild(
        nominalCell
      );


      /*
       * Simpan ID di DOM.
       */

      row.dataset.transactionId =
        transaction._id;


      tbody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   SETUP FORM EVENTS
========================================================= */

function setupFormEvents() {

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


  const addModalForm =
    document.getElementById(
      "addModalForm"
    );


  if (addModalForm) {

    addModalForm.addEventListener(
      "submit",
      handleAddModalSubmit
    );

  }


  const withdrawModalForm =
    document.getElementById(
      "withdrawModalForm"
    );


  if (withdrawModalForm) {

    withdrawModalForm.addEventListener(
      "submit",
      handleWithdrawModalSubmit
    );

  }


  const addModalButton =
    document.getElementById(
      "addModalButton"
    );


  if (addModalButton) {

    addModalButton.addEventListener(
      "click",
      function() {

        openModal(
          "addModal"
        );

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
      function() {

        openModal(
          "withdrawModal"
        );

      }
    );

  }

}


/* =========================================================
   TRANSACTION SUBMIT
========================================================= */

async function handleTransactionSubmit(
  event
) {

  event.preventDefault();


  if (
    TradingState.loading
  ) {

    return;

  }


  const tanggal =
    getElementValue(
      "tanggal"
    );


  const saham =
    getElementValue(
      "saham"
    )
    .trim()
    .toUpperCase();


  const aksi =
    getElementValue(
      "aksi"
    )
    .trim()
    .toUpperCase();


  const harga =
    toNumber(
      getElementValue(
        "harga"
      )
    );


  const lot =
    toNumber(
      getElementValue(
        "lot"
      )
    );


  const profitRugi =
    getElementValue(
      "profitRugi"
    )
    .trim()
    .toUpperCase();


  const nominal =
    toNumber(
      getElementValue(
        "nominal"
      )
    );


  const catatan =
    getElementValue(
      "catatan"
    ).trim();


  /*
   * ========================================
   * VALIDASI
   * ========================================
   */

  if (!tanggal) {

    showToast(
      "error",
      "Data Belum Lengkap",
      "Tanggal transaksi wajib diisi."
    );

    return;

  }


  if (!saham) {

    showToast(
      "error",
      "Data Belum Lengkap",
      "Kode saham wajib diisi."
    );

    return;

  }


  if (
    aksi !== "BUY" &&
    aksi !== "SELL"
  ) {

    showToast(
      "error",
      "Aksi Tidak Valid",
      "Aksi harus BUY atau SELL."
    );

    return;

  }


  if (
    harga <= 0
  ) {

    showToast(
      "error",
      "Harga Tidak Valid",
      "Harga harus lebih besar dari 0."
    );

    return;

  }


  if (
    lot <= 0
  ) {

    showToast(
      "error",
      "Lot Tidak Valid",
      "Lot harus lebih besar dari 0."
    );

    return;

  }


  if (
    profitRugi !== "" &&
    profitRugi !== "PROFIT" &&
    profitRugi !== "RUGI"
  ) {

    showToast(
      "error",
      "Hasil Tidak Valid",
      "Hasil harus PROFIT atau RUGI."
    );

    return;

  }


  if (
    profitRugi !== "" &&
    nominal <= 0
  ) {

    showToast(
      "error",
      "Nominal Belum Diisi",
      "Nominal wajib diisi jika PROFIT/RUGI dipilih."
    );

    return;

  }


  /*
   * ========================================
   * PAYLOAD
   * ========================================
   *
   * Nama field mengikuti Apps Script.
   */

  const transaction = {

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
      profitRugi,

    nominal:
      profitRugi
        ? nominal
        : 0,

    catatan:
      catatan

  };


  setGlobalLoading(
    true,
    "Menyimpan transaksi..."
  );


  TradingState.loading =
    true;


  try {

    const result =
      await TradingAPI.addTransaction(
        transaction
      );


    console.log(
      "[Trading] Add transaction response:",
      result
    );


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Transaksi gagal disimpan."
      );

    }


    /*
     * Reset form.
     */

    resetTransactionForm();


    /*
     * Ambil data terbaru dari
     * Google Sheets.
     */

    await loadTradingData();


    showToast(
      "success",
      "Berhasil",
      "Transaksi berhasil disimpan."
    );


  } catch (error) {

    console.error(
      "[Trading] ADD TRANSACTION ERROR:",
      error
    );


    showToast(
      "error",
      "Gagal Menyimpan",
      getErrorMessage(error)
    );


  } finally {

    TradingState.loading =
      false;


    setGlobalLoading(
      false
    );

  }

}


/* =========================================================
   RESET TRANSACTION FORM
========================================================= */

function resetTransactionForm() {

  const form =
    document.getElementById(
      "transactionForm"
    );


  if (form) {

    form.reset();

  }


  setupDefaultDates();


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


  updateNominalVisibility();

}


/* =========================================================
   PROFIT/RUGI EVENTS
========================================================= */

function setupProfitRugiEvents() {

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


  const nominal =
    document.getElementById(
      "nominal"
    );


  if (
    !select ||
    !group
  ) {

    return;

  }


  const value =
    select.value;


  if (
    value === "PROFIT" ||
    value === "RUGI"
  ) {

    group.classList.remove(
      "hidden"
    );


    if (nominal) {

      nominal.required =
        true;

    }

  }

  else {

    group.classList.remove(
      "hidden"
    );


    if (nominal) {

      nominal.required =
        false;

    }

  }

}


/* =========================================================
   INPUT EVENTS
========================================================= */

function setupInputEvents() {

  const saham =
    document.getElementById(
      "saham"
    );


  if (saham) {

    saham.addEventListener(
      "input",
      function() {

        this.value =
          this.value
            .toUpperCase();

      }
    );

  }


  const harga =
    document.getElementById(
      "harga"
    );


  if (harga) {

    harga.addEventListener(
      "input",
      sanitizeNumericInput
    );

  }


  const lot =
    document.getElementById(
      "lot"
    );


  if (lot) {

    lot.addEventListener(
      "input",
      sanitizeNumericInput
    );

  }


  const nominal =
    document.getElementById(
      "nominal"
    );


  if (nominal) {

    nominal.addEventListener(
      "input",
      sanitizeNumericInput
    );

  }

}


/* =========================================================
   MODAL EVENTS
========================================================= */

function setupModalEvents() {

  document.addEventListener(
    "click",
    function(event) {

      const closeButton =
        event.target.closest(
          "[data-close-modal]"
        );


      if (closeButton) {

        closeAllModals();

      }

    }
  );


  document.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Escape"
      ) {

        closeAllModals();

      }

    }
  );


  document.addEventListener(
    "click",
    function(event) {

      if (
        event.target.classList.contains(
          "modal-overlay"
        )
      ) {

        closeAllModals();

      }

    }
  );

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openModal(
  modalId
) {

  closeAllModals();


  const modal =
    document.getElementById(
      modalId
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


  /*
   * Set tanggal terbaru.
   */

  const today =
    getTodayString();


  if (
    modalId === "addModal"
  ) {

    const input =
      document.getElementById(
        "addModalTanggal"
      );


    if (input) {

      input.value =
        today;

    }

  }


  if (
    modalId === "withdrawModal"
  ) {

    const input =
      document.getElementById(
        "withdrawModalTanggal"
      );


    if (input) {

      input.value =
        today;

    }

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
   ADD CAPITAL SUBMIT
========================================================= */

async function handleAddModalSubmit(
  event
) {

  event.preventDefault();


  if (
    TradingState.loading
  ) {

    return;

  }


  const tanggal =
    getElementValue(
      "addModalTanggal"
    );


  const nominal =
    toNumber(
      getElementValue(
        "addModalNominal"
      )
    );


  const catatan =
    getElementValue(
      "addModalCatatan"
    ).trim();


  if (!tanggal) {

    showToast(
      "error",
      "Tanggal Belum Diisi",
      "Tanggal modal wajib diisi."
    );

    return;

  }


  if (
    nominal <= 0
  ) {

    showToast(
      "error",
      "Nominal Tidak Valid",
      "Nominal modal harus lebih besar dari 0."
    );

    return;

  }


  TradingState.loading =
    true;


  setGlobalLoading(
    true,
    "Menambahkan modal..."
  );


  try {

    const result =
      await TradingAPI.post(
        "add_modal",
        {

          tanggal:
            tanggal,

          nominal:
            nominal,

          catatan:
            catatan

        }
      );


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal menambahkan modal."
      );

    }


    closeAllModals();


    const form =
      document.getElementById(
        "addModalForm"
      );


    if (form) {

      form.reset();

    }


    await loadTradingData();


    showToast(
      "success",
      "Modal Berhasil",
      "Modal berhasil ditambahkan."
    );


  } catch (error) {

    console.error(
      "[Trading] ADD CAPITAL ERROR:",
      error
    );


    showToast(
      "error",
      "Gagal Menambah Modal",
      getErrorMessage(error)
    );


  } finally {

    TradingState.loading =
      false;


    setGlobalLoading(
      false
    );

  }

}


/* =========================================================
   WITHDRAW CAPITAL SUBMIT
========================================================= */

async function handleWithdrawModalSubmit(
  event
) {

  event.preventDefault();


  if (
    TradingState.loading
  ) {

    return;

  }


  const tanggal =
    getElementValue(
      "withdrawModalTanggal"
    );


  const nominal =
    toNumber(
      getElementValue(
        "withdrawModalNominal"
      )
    );


  const catatan =
    getElementValue(
      "withdrawModalCatatan"
    ).trim();


  if (!tanggal) {

    showToast(
      "error",
      "Tanggal Belum Diisi",
      "Tanggal penarikan wajib diisi."
    );

    return;

  }


  if (
    nominal <= 0
  ) {

    showToast(
      "error",
      "Nominal Tidak Valid",
      "Nominal penarikan harus lebih besar dari 0."
    );

    return;

  }


  if (
    nominal >
    TradingState.summary.modal
  ) {

    showToast(
      "error",
      "Modal Tidak Cukup",
      "Nominal penarikan lebih besar dari modal tersedia."
    );

    return;

  }


  TradingState.loading =
    true;


  setGlobalLoading(
    true,
    "Menarik modal..."
  );


  try {

    const result =
      await TradingAPI.post(
        "withdraw_modal",
        {

          tanggal:
            tanggal,

          nominal:
            nominal,

          catatan:
            catatan

        }
      );


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal menarik modal."
      );

    }


    closeAllModals();


    const form =
      document.getElementById(
        "withdrawModalForm"
      );


    if (form) {

      form.reset();

    }


    await loadTradingData();


    showToast(
      "success",
      "Penarikan Berhasil",
      "Modal berhasil ditarik."
    );


  } catch (error) {

    console.error(
      "[Trading] WITHDRAW ERROR:",
      error
    );


    showToast(
      "error",
      "Gagal Menarik Modal",
      getErrorMessage(error)
    );


  } finally {

    TradingState.loading =
      false;


    setGlobalLoading(
      false
    );

  }

}


/* =========================================================
   TRANSACTION SORT
========================================================= */

function compareTransactionDate(
  a,
  b
) {

  const dateA =
    parseSortableDate(
      a._tanggal
    );


  const dateB =
    parseSortableDate(
      b._tanggal
    );


  return dateB - dateA;

}


/* =========================================================
   SORTABLE DATE
========================================================= */

function parseSortableDate(
  value
) {

  if (!value) {

    return 0;

  }


  const stringValue =
    String(value)
      .trim();


  /*
   * YYYY-MM-DD
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/
      .test(
        stringValue
      )
  ) {

    const parts =
      stringValue.split("-");


    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    ).getTime();

  }


  /*
   * DD/MM/YYYY
   */

  if (
    /^\d{2}\/\d{2}\/\d{4}$/
      .test(
        stringValue
      )
  ) {

    const parts =
      stringValue.split("/");


    return new Date(
      Number(parts[2]),
      Number(parts[1]) - 1,
      Number(parts[0])
    ).getTime();

  }


  const date =
    new Date(
      stringValue
    );


  return isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();

}


/* =========================================================
   FORMAT DISPLAY DATE
========================================================= */

function formatDisplayDate(
  value
) {

  if (!value) {

    return "-";

  }


  const stringValue =
    String(value)
      .trim();


  /*
   * YYYY-MM-DD
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/
      .test(
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
   * DD/MM/YYYY
   */

  if (
    /^\d{2}\/\d{2}\/\d{4}$/
      .test(
        stringValue
      )
  ) {

    return stringValue;

  }


  return stringValue;

}


/* =========================================================
   FORMAT RUPIAH
========================================================= */

function formatRupiah(
  value
) {

  const number =
    toNumber(value);


  const sign =
    number < 0
      ? "-"
      : "";


  const absolute =
    Math.abs(number);


  return (
    sign +
    "Rp" +
    new Intl.NumberFormat(
      "id-ID"
    ).format(
      absolute
    )
  );

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
   TO NUMBER
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


  let stringValue =
    String(value)
      .trim();


  /*
   * Format Indonesia:
   *
   * 300.000
   * 1.500.000
   *
   * Hilangkan pemisah ribuan.
   */

  stringValue =
    stringValue.replace(
      /Rp/gi,
      ""
    );


  stringValue =
    stringValue.replace(
      /\s/g,
      ""
    );


  /*
   * Jika angka memakai titik
   * sebagai pemisah ribuan.
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
   * Koma dianggap desimal.
   */

  else if (
    stringValue.includes(",") &&
    stringValue.includes(".")
  ) {

    stringValue =
      stringValue.replace(
        /\./g,
        ""
      )
      .replace(
        ",",
        "."
      );

  }

  else {

    stringValue =
      stringValue.replace(
        ",",
        "."
      );

  }


  stringValue =
    stringValue.replace(
      /[^\d.-]/g,
      ""
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
   GET ELEMENT VALUE
========================================================= */

function getElementValue(
  id
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {

    return "";

  }


  return element.value || "";

}


/* =========================================================
   SANITIZE NUMERIC INPUT
========================================================= */

function sanitizeNumericInput(
  event
) {

  let value =
    event.target.value;


  value =
    value.replace(
      /[^\d]/g,
      ""
    );


  event.target.value =
    value;

}


/* =========================================================
   TODAY STRING
========================================================= */

function getTodayString() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    )
    .padStart(
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
   LOADING TRANSACTION
========================================================= */

function setTransactionLoading(
  isLoading
) {

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


    if (wrapper) {

      wrapper.classList.add(
        "hidden"
      );

    }

  }

  else {

    if (loading) {

      loading.classList.add(
        "hidden"
      );

    }

  }

}


/* =========================================================
   GLOBAL LOADING
========================================================= */

function setGlobalLoading(
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


  if (!loading) {

    return;

  }


  if (text) {

    text.textContent =
      message;

  }


  if (show) {

    loading.classList.remove(
      "hidden"
    );

  }

  else {

    loading.classList.add(
      "hidden"
    );

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


  if (!toast) {

    console.log(
      "[" +
      type +
      "] " +
      title +
      ": " +
      message
    );

    return;

  }


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
      type === "success"
        ? "✓"
        : "×";

  }


  toast.classList.remove(
    "hidden"
  );


  toast.classList.remove(
    "toast-success"
  );


  toast.classList.remove(
    "toast-error"
  );


  toast.classList.add(
    type === "success"
      ? "toast-success"
      : "toast-error"
  );


  clearTimeout(
    window.__tradingToastTimer
  );


  window.__tradingToastTimer =
    setTimeout(
      function() {

        toast.classList.add(
          "hidden"
        );

      },
      4000
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


  if (
    window.TradingAPI &&
    typeof TradingAPI.errorMessage ===
      "function"
  ) {

    return TradingAPI.errorMessage(
      error
    );

  }


  return String(
    error
  );

}


/* =========================================================
   DEBUG
========================================================= */

function debugTradingPage() {

  console.log(
    "========================================"
  );

  console.log(
    "TRADING JOURNAL DEBUG"
  );

  console.log(
    "Transactions:",
    TradingState.transactions
  );

  console.log(
    "Modal:",
    TradingState.modal
  );

  console.log(
    "Summary:",
    TradingState.summary
  );

  console.log(
    "========================================"
  );

}


/* =========================================================
   GLOBAL OBJECT
========================================================= */

window.TradingPage = {

  state:
    TradingState,

  load:
    loadTradingData,

  refresh:
    loadTradingData,

  render:
    renderRecentTransactions,

  summary:
    renderSummary,

  debug:
    debugTradingPage

};


/* =========================================================
   GLOBAL DEBUG SHORTCUT
========================================================= */

window.debugTradingPage =
  debugTradingPage;


/* =========================================================
   INITIAL LOG
========================================================= */

console.log(
  "[Trading] trading.js STAGE 1 loaded."
);

console.log(
  "[Trading] Google Sheets headers:"
);

console.log(
  "ID | Tanggal | Saham | Aksi | Harga | Lot | Profit/Rugi | Nominal | Catatan | Timestamp"
);
/* =========================================================
   TRADING JOURNAL
   TRADING.JS
   TAHAP 2 / 2

   FUNGSI:
   - Load transaksi
   - Render transaksi
   - Edit transaksi
   - Hapus transaksi
   - Tambah modal
   - Tarik modal
   - Refresh data
   - Update summary
   - Toast
   - Loading
   - Modal popup
   - Sinkronisasi Google Sheets

   CATATAN:
   Header TRANSAKSI Google Sheets:

   ID
   Tanggal
   Saham
   Aksi
   Harga
   Lot
   Profit/Rugi
   Nominal
   Catatan
   Timestamp
========================================================= */

"use strict";


/* =========================================================
   STATE
========================================================= */

const TradingState = {

  transactions: [],

  modal: [],

  summary: {},

  editingId: null,

  isLoading: false,

  isSaving: false

};


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {

  return document.getElementById(id);

}


/* =========================================================
   ELEMENTS
========================================================= */

const transactionForm =
  $("transactionForm");

const transactionTableBody =
  $("transactionTableBody");

const transactionTableWrapper =
  $("transactionTableWrapper");

const transactionLoading =
  $("transactionLoading");

const transactionEmpty =
  $("transactionEmpty");

const saveTransactionButton =
  $("saveTransactionButton");

const addModal =
  $("addModal");

const withdrawModal =
  $("withdrawModal");

const addModalButton =
  $("addModalButton");

const withdrawModalButton =
  $("withdrawModalButton");

const addModalForm =
  $("addModalForm");

const withdrawModalForm =
  $("withdrawModalForm");

const globalLoading =
  $("globalLoading");

const globalLoadingText =
  $("globalLoadingText");

const toast =
  $("toast");


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
   NORMALIZE TRANSACTION
========================================================= */

function normalizeTransaction(row) {

  if (!row || typeof row !== "object") {

    return null;

  }


  /*
   * Backend menggunakan:
   *
   * ID
   * Tanggal
   * Saham
   * Aksi
   * Harga
   * Lot
   * Profit/Rugi
   * Nominal
   * Catatan
   * Timestamp
   */

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
      String(
        row.Saham ??
        row.saham ??
        ""
      )
      .trim()
      .toUpperCase(),

    Aksi:
      String(
        row.Aksi ??
        row.aksi ??
        ""
      )
      .trim()
      .toUpperCase(),

    Harga:
      Number(
        row.Harga ??
        row.harga ??
        0
      ) || 0,

    Lot:
      Number(
        row.Lot ??
        row.lot ??
        0
      ) || 0,

    "Profit/Rugi":
      String(
        row["Profit/Rugi"] ??
        row.profitRugi ??
        row.hasil ??
        ""
      )
      .trim()
      .toUpperCase(),

    Nominal:
      Number(
        row.Nominal ??
        row.nominal ??
        0
      ) || 0,

    Catatan:
      String(
        row.Catatan ??
        row.catatan ??
        ""
      ),

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
   EXTRACT API DATA
========================================================= */

function extractApiData(result) {

  if (!result) {

    return {

      transaksi: [],

      modal: [],

      summary: {}

    };

  }


  /*
   * Backend utama:
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

  if (
    result.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
  ) {

    return {

      transaksi:
        Array.isArray(
          result.data.transaksi
        )
          ? result.data.transaksi
          : [],

      modal:
        Array.isArray(
          result.data.modal
        )
          ? result.data.modal
          : [],

      summary:
        result.data.summary || {}

    };

  }


  /*
   * Fallback response lama.
   */

  return {

    transaksi:
      Array.isArray(result.transaksi)
        ? result.transaksi
        : Array.isArray(result.transactions)
          ? result.transactions
          : [],

    modal:
      Array.isArray(result.modal)
        ? result.modal
        : [],

    summary:
      result.summary ||
      result.report ||
      {}

  };

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadTradingData(
  showLoading = true
) {

  if (TradingState.isLoading) {

    return;

  }


  TradingState.isLoading = true;


  if (showLoading) {

    setTransactionLoading(true);

  }


  try {

    /*
     * API JS sudah menyediakan:
     *
     * TradingAPI.getAllData()
     */

    const result =
      await TradingAPI.getAllData();


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal mengambil data."
      );

    }


    const data =
      extractApiData(result);


    /*
     * NORMALIZE TRANSACTIONS
     */

    TradingState.transactions =
      data.transaksi
        .map(
          normalizeTransaction
        )
        .filter(Boolean);


    /*
     * NORMALIZE MODAL
     */

    TradingState.modal =
      Array.isArray(data.modal)
        ? data.modal
        : [];


    /*
     * SUMMARY
     */

    TradingState.summary =
      normalizeSummary(
        data.summary
      );


    /*
     * UPDATE UI
     */

    renderSummary();

    renderTransactions();

    updateFormState();


    console.log(
      "[Trading] Data berhasil dimuat:",
      {
        transaksi:
          TradingState.transactions.length,

        modal:
          TradingState.modal.length,

        summary:
          TradingState.summary
      }
    );


  } catch (error) {

    console.error(
      "[Trading] Load error:",
      error
    );


    showToast(
      "error",
      "Gagal Memuat Data",
      getTradingErrorMessage(
        error
      )
    );


    renderTransactionsError();


  } finally {

    TradingState.isLoading = false;

    if (showLoading) {

      setTransactionLoading(false);

    }

  }

}


/* =========================================================
   REFRESH DATA
========================================================= */

async function refreshTradingData() {

  await loadTradingData(true);

}


/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary() {

  const summary =
    TradingState.summary ||
    {};


  const modalValue =
    $("modalValue");

  const profitLossValue =
    $("profitLossValue");

  const totalValue =
    $("totalValue");

  const profitIcon =
    $("profitIcon");

  const profitDescription =
    $("profitLossDescription");


  if (modalValue) {

    modalValue.textContent =
      formatRupiah(
        summary.modal
      );

  }


  if (profitLossValue) {

    profitLossValue.textContent =
      formatRupiah(
        summary.netProfit
      );


    profitLossValue.classList.remove(
      "positive",
      "negative",
      "profit",
      "loss"
    );


    if (
      summary.netProfit > 0
    ) {

      profitLossValue.classList.add(
        "positive"
      );

    }

    else if (
      summary.netProfit < 0
    ) {

      profitLossValue.classList.add(
        "negative"
      );

    }

  }


  if (profitIcon) {

    if (
      summary.netProfit > 0
    ) {

      profitIcon.textContent =
        "↗";

    }

    else if (
      summary.netProfit < 0
    ) {

      profitIcon.textContent =
        "↘";

    }

    else {

      profitIcon.textContent =
        "→";

    }

  }


  if (profitDescription) {

    if (
      summary.netProfit > 0
    ) {

      profitDescription.textContent =
        "Net profit trading";

    }

    else if (
      summary.netProfit < 0
    ) {

      profitDescription.textContent =
        "Net rugi trading";

    }

    else {

      profitDescription.textContent =
        "Net hasil trading";

    }

  }


  if (totalValue) {

    totalValue.textContent =
      formatRupiah(
        summary.total
      );

  }

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

  if (!transactionTableBody) {

    return;

  }


  transactionTableBody.innerHTML =
    "";


  const transactions =
    TradingState.transactions || [];


  /*
   * Urutkan transaksi terbaru
   * berdasarkan tanggal.
   */

  const sorted =
    [...transactions]
      .sort(
        function(a, b) {

          const dateA =
            parseTradingDate(
              a.Tanggal
            );

          const dateB =
            parseTradingDate(
              b.Tanggal
            );

          return (
            dateB.getTime() -
            dateA.getTime()
          );

        }
      );


  /*
   * Hanya tampilkan transaksi terbaru.
   */

  const recent =
    sorted.slice(
      0,
      10
    );


  if (
    recent.length === 0
  ) {

    showTransactionEmpty();

    return;

  }


  hideElement(
    transactionLoading
  );

  hideElement(
    transactionEmpty
  );

  showElement(
    transactionTableWrapper
  );


  recent.forEach(
    function(transaction) {

      const row =
        createTransactionRow(
          transaction
        );

      transactionTableBody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   CREATE TRANSACTION ROW
========================================================= */

function createTransactionRow(
  transaction
) {

  const tr =
    document.createElement(
      "tr"
    );


  tr.dataset.id =
    transaction.ID;


  /*
   * Tanggal
   */

  const tdTanggal =
    document.createElement(
      "td"
    );

  tdTanggal.textContent =
    formatDisplayDate(
      transaction.Tanggal
    );


  /*
   * Saham
   */

  const tdSaham =
    document.createElement(
      "td"
    );

  const saham =
    document.createElement(
      "strong"
    );

  saham.textContent =
    transaction.Saham || "-";

  tdSaham.appendChild(
    saham
  );


  /*
   * Aksi
   */

  const tdAksi =
    document.createElement(
      "td"
    );

  const aksiBadge =
    document.createElement(
      "span"
    );

  aksiBadge.className =
    "transaction-badge " +
    (
      transaction.Aksi === "BUY"
        ? "badge-buy"
        : "badge-sell"
    );

  aksiBadge.textContent =
    transaction.Aksi || "-";

  tdAksi.appendChild(
    aksiBadge
  );


  /*
   * Harga
   */

  const tdHarga =
    document.createElement(
      "td"
    );

  tdHarga.textContent =
    formatNumber(
      transaction.Harga
    );


  /*
   * Lot
   */

  const tdLot =
    document.createElement(
      "td"
    );

  tdLot.textContent =
    formatNumber(
      transaction.Lot
    );


  /*
   * Hasil
   */

  const tdHasil =
    document.createElement(
      "td"
    );


  const hasil =
    transaction["Profit/Rugi"];


  if (hasil) {

    const hasilBadge =
      document.createElement(
        "span"
      );

    hasilBadge.className =
      "result-badge " +
      (
        hasil === "PROFIT"
          ? "result-profit"
          : "result-loss"
      );

    hasilBadge.textContent =
      hasil;

    tdHasil.appendChild(
      hasilBadge
    );

  }

  else {

    tdHasil.textContent =
      "-";

  }


  /*
   * Nominal
   */

  const tdNominal =
    document.createElement(
      "td"
    );

  tdNominal.textContent =
    transaction.Nominal
      ? formatRupiah(
          transaction.Nominal
        )
      : "-";


  /*
   * Actions
   */

  const tdActions =
    document.createElement(
      "td"
    );

  tdActions.className =
    "transaction-actions";


  const editButton =
    document.createElement(
      "button"
    );

  editButton.type =
    "button";

  editButton.className =
    "table-action-button edit-button";

  editButton.textContent =
    "Edit";

  editButton.title =
    "Edit transaksi";


  editButton.addEventListener(
    "click",
    function() {

      editTransaction(
        transaction.ID
      );

    }
  );


  const deleteButton =
    document.createElement(
      "button"
    );

  deleteButton.type =
    "button";

  deleteButton.className =
    "table-action-button delete-button";

  deleteButton.textContent =
    "Hapus";

  deleteButton.title =
    "Hapus transaksi";


  deleteButton.addEventListener(
    "click",
    function() {

      deleteTransaction(
        transaction.ID
      );

    }
  );


  tdActions.appendChild(
    editButton
  );

  tdActions.appendChild(
    deleteButton
  );


  /*
   * Append
   */

  tr.appendChild(
    tdTanggal
  );

  tr.appendChild(
    tdSaham
  );

  tr.appendChild(
    tdAksi
  );

  tr.appendChild(
    tdHarga
  );

  tr.appendChild(
    tdLot
  );

  tr.appendChild(
    tdHasil
  );

  tr.appendChild(
    tdNominal
  );

  /*
   * Kolom action ditambahkan
   * walaupun header lama belum ada.
   */

  tr.appendChild(
    tdActions
  );


  return tr;

}


/* =========================================================
   EDIT TRANSACTION
========================================================= */

function editTransaction(
  id
) {

  if (!id) {

    showToast(
      "error",
      "Edit Gagal",
      "ID transaksi tidak ditemukan."
    );

    return;

  }


  const transaction =
    TradingState.transactions.find(
      function(item) {

        return String(
          item.ID
        ) === String(id);

      }
    );


  if (!transaction) {

    showToast(
      "error",
      "Edit Gagal",
      "Data transaksi tidak ditemukan."
    );

    return;

  }


  TradingState.editingId =
    String(id);


  /*
   * Isi form.
   */

  setInputValue(
    "tanggal",
    toInputDate(
      transaction.Tanggal
    )
  );


  setInputValue(
    "saham",
    transaction.Saham
  );


  setInputValue(
    "aksi",
    transaction.Aksi
  );


  setInputValue(
    "harga",
    transaction.Harga
  );


  setInputValue(
    "lot",
    transaction.Lot
  );


  setInputValue(
    "profitRugi",
    transaction["Profit/Rugi"]
  );


  setInputValue(
    "nominal",
    transaction.Nominal
  );


  setInputValue(
    "catatan",
    transaction.Catatan
  );


  updateNominalVisibility();


  /*
   * Ubah tombol menjadi mode edit.
   */

  if (saveTransactionButton) {

    saveTransactionButton.innerHTML =
      `
        <span>Update Transaksi</span>
        <span class="button-arrow">→</span>
      `;

  }


  /*
   * Scroll ke form.
   */

  if (transactionForm) {

    transactionForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  showToast(
    "info",
    "Mode Edit",
    "Silakan ubah data lalu tekan Update Transaksi."
  );

}


/* =========================================================
   SAVE EDIT TRANSACTION
========================================================= */

async function updateTransaction() {

  const id =
    TradingState.editingId;


  if (!id) {

    return false;

  }


  const formData =
    collectTransactionForm();


  /*
   * Kirim action editTransaction.
   */

  const payload = {

    id:
      id,

    tanggal:
      formData.tanggal,

    saham:
      formData.saham,

    aksi:
      formData.aksi,

    harga:
      formData.harga,

    lot:
      formData.lot,

    profitRugi:
      formData.profitRugi,

    nominal:
      formData.nominal,

    catatan:
      formData.catatan

  };


  setGlobalLoading(
    true,
    "Mengupdate transaksi..."
  );


  try {

    const result =
      await TradingAPI.post(
        "editTransaction",
        payload
      );


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal mengupdate transaksi."
      );

    }


    /*
     * Reset mode edit.
     */

    TradingState.editingId =
      null;


    resetTransactionForm();


    /*
     * Gunakan response API
     * agar langsung update.
     */

    if (
      result &&
      result.data
    ) {

      applyApiData(
        result
      );

    }

    else {

      await loadTradingData(
        false
      );

    }


    showToast(
      "success",
      "Berhasil",
      "Transaksi berhasil diupdate."
    );


    return true;


  } catch (error) {

    console.error(
      "[Trading] Update error:",
      error
    );


    showToast(
      "error",
      "Update Gagal",
      getTradingErrorMessage(
        error
      )
    );


    return false;


  } finally {

    setGlobalLoading(
      false
    );

  }

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTransaction(
  id
) {

  if (!id) {

    showToast(
      "error",
      "Hapus Gagal",
      "ID transaksi tidak ditemukan."
    );

    return;

  }


  const transaction =
    TradingState.transactions.find(
      function(item) {

        return String(
          item.ID
        ) === String(id);

      }
    );


  const saham =
    transaction
      ? transaction.Saham
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


  setGlobalLoading(
    true,
    "Menghapus transaksi..."
  );


  try {

    const result =
      await TradingAPI.post(
        "deleteTransaction",
        {
          id: id
        }
      );


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal menghapus transaksi."
      );

    }


    /*
     * Jika response sudah membawa
     * seluruh data, gunakan langsung.
     */

    if (
      result &&
      result.data
    ) {

      applyApiData(
        result
      );

    }

    else {

      await loadTradingData(
        false
      );

    }


    showToast(
      "success",
      "Berhasil",
      "Transaksi berhasil dihapus."
    );


  } catch (error) {

    console.error(
      "[Trading] Delete error:",
      error
    );


    showToast(
      "error",
      "Hapus Gagal",
      getTradingErrorMessage(
        error
      )
    );


  } finally {

    setGlobalLoading(
      false
    );

  }

}


/* =========================================================
   APPLY API DATA
========================================================= */

function applyApiData(
  result
) {

  const data =
    extractApiData(
      result
    );


  TradingState.transactions =
    data.transaksi
      .map(
        normalizeTransaction
      )
      .filter(Boolean);


  TradingState.modal =
    Array.isArray(
      data.modal
    )
      ? data.modal
      : [];


  TradingState.summary =
    normalizeSummary(
      data.summary
    );


  renderSummary();

  renderTransactions();

  updateFormState();

}


/* =========================================================
   COLLECT TRANSACTION FORM
========================================================= */

function collectTransactionForm() {

  const tanggal =
    $("tanggal")?.value || "";


  const saham =
    String(
      $("saham")?.value || ""
    )
    .trim()
    .toUpperCase();


  const aksi =
    String(
      $("aksi")?.value || ""
    )
    .trim()
    .toUpperCase();


  const harga =
    Number(
      $("harga")?.value
    ) || 0;


  const lot =
    Number(
      $("lot")?.value
    ) || 0;


  const profitRugi =
    String(
      $("profitRugi")?.value || ""
    )
    .trim()
    .toUpperCase();


  const nominal =
    profitRugi
      ? Number(
          $("nominal")?.value
        ) || 0
      : 0;


  const catatan =
    String(
      $("catatan")?.value || ""
    )
    .trim();


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
      profitRugi,

    nominal:
      nominal,

    catatan:
      catatan

  };

}


/* =========================================================
   SUBMIT TRANSACTION
========================================================= */

async function handleTransactionSubmit(
  event
) {

  event.preventDefault();


  if (TradingState.isSaving) {

    return;

  }


  const formData =
    collectTransactionForm();


  /*
   * VALIDASI
   */

  if (!formData.tanggal) {

    showToast(
      "error",
      "Data Belum Lengkap",
      "Tanggal wajib diisi."
    );

    return;

  }


  if (!formData.saham) {

    showToast(
      "error",
      "Data Belum Lengkap",
      "Kode saham wajib diisi."
    );

    return;

  }


  if (
    !["BUY", "SELL"]
      .includes(
        formData.aksi
      )
  ) {

    showToast(
      "error",
      "Data Tidak Valid",
      "Aksi harus BUY atau SELL."
    );

    return;

  }


  if (
    formData.harga <= 0
  ) {

    showToast(
      "error",
      "Data Tidak Valid",
      "Harga harus lebih besar dari 0."
    );

    return;

  }


  if (
    formData.lot <= 0
  ) {

    showToast(
      "error",
      "Data Tidak Valid",
      "Lot harus lebih besar dari 0."
    );

    return;

  }


  if (
    formData.profitRugi &&
    formData.nominal <= 0
  ) {

    showToast(
      "error",
      "Data Tidak Valid",
      "Nominal profit/rugi harus lebih besar dari 0."
    );

    return;

  }


  TradingState.isSaving =
    true;


  setGlobalLoading(
    true,
    TradingState.editingId
      ? "Mengupdate transaksi..."
      : "Menyimpan transaksi..."
  );


  try {

    /*
     * EDIT
     */

    if (
      TradingState.editingId
    ) {

      await updateTransaction();

      return;

    }


    /*
     * TAMBAH
     */

    const result =
      await TradingAPI.addTransaction(
        formData
      );


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal menyimpan transaksi."
      );

    }


    /*
     * Gunakan response langsung
     * jika tersedia.
     */

    if (
      result &&
      result.data
    ) {

      applyApiData(
        result
      );

    }

    else {

      await loadTradingData(
        false
      );

    }


    resetTransactionForm();


    showToast(
      "success",
      "Berhasil",
      "Transaksi berhasil disimpan."
    );


  } catch (error) {

    console.error(
      "[Trading] Save error:",
      error
    );


    showToast(
      "error",
      "Gagal Menyimpan",
      getTradingErrorMessage(
        error
      )
    );


  } finally {

    TradingState.isSaving =
      false;

    setGlobalLoading(
      false
    );

  }

}


/* =========================================================
   RESET TRANSACTION FORM
========================================================= */

function resetTransactionForm() {

  if (transactionForm) {

    transactionForm.reset();

  }


  TradingState.editingId =
    null;


  setToday(
    "tanggal"
  );


  if (saveTransactionButton) {

    saveTransactionButton.innerHTML =
      `
        <span>Simpan Transaksi</span>
        <span class="button-arrow">→</span>
      `;

  }


  updateNominalVisibility();

}


/* =========================================================
   UPDATE FORM STATE
========================================================= */

function updateFormState() {

  if (
    TradingState.editingId &&
    saveTransactionButton
  ) {

    saveTransactionButton.innerHTML =
      `
        <span>Update Transaksi</span>
        <span class="button-arrow">→</span>
      `;

  }

}


/* =========================================================
   NOMINAL VISIBILITY
========================================================= */

function updateNominalVisibility() {

  const group =
    $("nominalGroup");

  const select =
    $("profitRugi");


  if (!group || !select) {

    return;

  }


  const value =
    select.value;


  if (value === "") {

    group.classList.add(
      "hidden"
    );


    const nominal =
      $("nominal");

    if (nominal) {

      nominal.value =
        "";

    }

  }

  else {

    group.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   LOAD TODAY
========================================================= */

function setToday(
  inputId
) {

  const input =
    $(inputId);


  if (!input) {

    return;

  }


  if (input.value) {

    return;

  }


  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    )
    .padStart(
      2,
      "0"
    );


  input.value =
    year +
    "-" +
    month +
    "-" +
    day;

}


/* =========================================================
   ADD CAPITAL FORM
========================================================= */

async function handleAddCapital(
  event
) {

  event.preventDefault();


  const tanggal =
    $("addModalTanggal")?.value ||
    getTodayStringTrading();


  const nominal =
    Number(
      $("addModalNominal")?.value
    ) || 0;


  const catatan =
    String(
      $("addModalCatatan")?.value ||
      ""
    )
    .trim();


  if (
    !tanggal
  ) {

    showToast(
      "error",
      "Data Tidak Valid",
      "Tanggal wajib diisi."
    );

    return;

  }


  if (
    nominal <= 0
  ) {

    showToast(
      "error",
      "Data Tidak Valid",
      "Nominal modal harus lebih besar dari 0."
    );

    return;

  }


  setGlobalLoading(
    true,
    "Menambahkan modal..."
  );


  try {

    /*
     * API JS menggunakan addCapital.
     *
     * API JS saat ini membuat tanggal sendiri.
     * Karena form HTML memiliki tanggal,
     * kita kirim action langsung agar tanggal
     * form tetap dipakai oleh backend.
     */

    const result =
      await TradingAPI.post(
        "add_modal",
        {

          tanggal:
            tanggal,

          nominal:
            nominal,

          catatan:
            catatan

        }
      );


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal menambah modal."
      );

    }


    if (
      result &&
      result.data
    ) {

      applyApiData(
        result
      );

    }

    else {

      await loadTradingData(
        false
      );

    }


    closeModal(
      addModal
    );


    if (addModalForm) {

      addModalForm.reset();

    }


    setToday(
      "addModalTanggal"
    );


    showToast(
      "success",
      "Berhasil",
      "Modal berhasil ditambahkan."
    );


  } catch (error) {

    console.error(
      "[Trading] Add capital error:",
      error
    );


    showToast(
      "error",
      "Gagal",
      getTradingErrorMessage(
        error
      )
    );


  } finally {

    setGlobalLoading(
      false
    );

  }

}


/* =========================================================
   WITHDRAW CAPITAL FORM
========================================================= */

async function handleWithdrawCapital(
  event
) {

  event.preventDefault();


  const tanggal =
    $("withdrawModalTanggal")?.value ||
    getTodayStringTrading();


  const nominal =
    Number(
      $("withdrawModalNominal")?.value
    ) || 0;


  const catatan =
    String(
      $("withdrawModalCatatan")?.value ||
      ""
    )
    .trim();


  if (
    nominal <= 0
  ) {

    showToast(
      "error",
      "Data Tidak Valid",
      "Nominal penarikan harus lebih besar dari 0."
    );

    return;

  }


  if (
    TradingState.summary &&
    nominal >
      Number(
        TradingState.summary.modal
      )
  ) {

    showToast(
      "error",
      "Penarikan Ditolak",
      "Nominal penarikan lebih besar dari modal tersedia."
    );

    return;

  }


  setGlobalLoading(
    true,
    "Menarik modal..."
  );


  try {

    const result =
      await TradingAPI.post(
        "withdraw_modal",
        {

          tanggal:
            tanggal,

          nominal:
            nominal,

          catatan:
            catatan

        }
      );


    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal menarik modal."
      );

    }


    if (
      result &&
      result.data
    ) {

      applyApiData(
        result
      );

    }

    else {

      await loadTradingData(
        false
      );

    }


    closeModal(
      withdrawModal
    );


    if (
      withdrawModalForm
    ) {

      withdrawModalForm.reset();

    }


    setToday(
      "withdrawModalTanggal"
    );


    showToast(
      "success",
      "Berhasil",
      "Penarikan modal berhasil disimpan."
    );


  } catch (error) {

    console.error(
      "[Trading] Withdraw error:",
      error
    );


    showToast(
      "error",
      "Gagal",
      getTradingErrorMessage(
        error
      )
    );


  } finally {

    setGlobalLoading(
      false
    );

  }

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openModal(
  modal
) {

  if (!modal) {

    return;

  }


  modal.classList.remove(
    "hidden"
  );


  document.body.classList.add(
    "modal-open"
  );


  /*
   * Set tanggal otomatis.
   */

  if (
    modal === addModal
  ) {

    setToday(
      "addModalTanggal"
    );

  }


  if (
    modal === withdrawModal
  ) {

    setToday(
      "withdrawModalTanggal"
    );

  }


  /*
   * Fokus input nominal.
   */

  setTimeout(
    function() {

      if (
        modal === addModal
      ) {

        $("addModalNominal")?.focus();

      }

      else if (
        modal === withdrawModal
      ) {

        $("withdrawModalNominal")?.focus();

      }

    },
    100
  );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal(
  modal
) {

  if (!modal) {

    return;

  }


  modal.classList.add(
    "hidden"
  );


  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   TRANSACTION LOADING
========================================================= */

function setTransactionLoading(
  loading
) {

  if (loading) {

    showElement(
      transactionLoading
    );

    hideElement(
      transactionEmpty
    );

    hideElement(
      transactionTableWrapper
    );

  }

  else {

    hideElement(
      transactionLoading
    );

  }

}


/* =========================================================
   EMPTY
========================================================= */

function showTransactionEmpty() {

  hideElement(
    transactionLoading
  );

  hideElement(
    transactionTableWrapper
  );

  showElement(
    transactionEmpty
  );

}


/* =========================================================
   ERROR STATE
========================================================= */

function renderTransactionsError() {

  hideElement(
    transactionLoading
  );

  hideElement(
    transactionTableWrapper
  );


  if (transactionEmpty) {

    transactionEmpty.classList.remove(
      "hidden"
    );


    transactionEmpty.innerHTML =
      `
        <div class="empty-icon">!</div>
        <h3>Gagal memuat transaksi</h3>
        <p>
          Periksa koneksi Google Apps Script lalu coba lagi.
        </p>
        <button
          type="button"
          id="retryTradingButton"
          class="secondary-button"
        >
          Coba Lagi
        </button>
      `;


    $("retryTradingButton")?.addEventListener(
      "click",
      function() {

        loadTradingData(
          true
        );

      }
    );

  }

}


/* =========================================================
   GLOBAL LOADING
========================================================= */

function setGlobalLoading(
  loading,
  message = "Memproses..."
) {

  if (!globalLoading) {

    return;

  }


  if (loading) {

    if (globalLoadingText) {

      globalLoadingText.textContent =
        message;

    }

    globalLoading.classList.remove(
      "hidden"
    );

  }

  else {

    globalLoading.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer =
  null;


function showToast(
  type,
  title,
  message
) {

  if (!toast) {

    return;

  }


  const toastTitle =
    $("toastTitle");

  const toastMessage =
    $("toastMessage");

  const toastIcon =
    $("toastIcon");


  if (toastTitle) {

    toastTitle.textContent =
      title;

  }


  if (toastMessage) {

    toastMessage.textContent =
      message;

  }


  if (toastIcon) {

    if (type === "error") {

      toastIcon.textContent =
        "×";

    }

    else if (
      type === "info"
    ) {

      toastIcon.textContent =
        "i";

    }

    else {

      toastIcon.textContent =
        "✓";

    }

  }


  toast.classList.remove(
    "hidden",
    "toast-success",
    "toast-error",
    "toast-info"
  );


  toast.classList.add(
    "toast-" +
    (
      type ||
      "success"
    )
  );


  if (toastTimer) {

    clearTimeout(
      toastTimer
    );

  }


  toastTimer =
    setTimeout(
      function() {

        toast.classList.add(
          "hidden"
        );

      },
      4000
    );

}


/* =========================================================
   GENERIC ELEMENT
========================================================= */

function showElement(
  element
) {

  if (!element) {

    return;

  }


  element.classList.remove(
    "hidden"
  );

}


function hideElement(
  element
) {

  if (!element) {

    return;

  }


  element.classList.add(
    "hidden"
  );

}


function setInputValue(
  id,
  value
) {

  const input =
    $(id);


  if (input) {

    input.value =
      value ??
      "";

  }

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getTodayStringTrading() {

  const now =
    new Date();


  return (
    now.getFullYear() +
    "-" +
    String(
      now.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    ) +
    "-" +
    String(
      now.getDate()
    )
    .padStart(
      2,
      "0"
    )
  );

}


function parseTradingDate(
  value
) {

  if (!value) {

    return new Date(0);

  }


  if (
    value instanceof Date
  ) {

    return value;

  }


  const string =
    String(value)
      .trim();


  /*
   * YYYY-MM-DD
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/
      .test(string)
  ) {

    const parts =
      string.split("-");


    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );

  }


  /*
   * DD/MM/YYYY
   */

  if (
    /^\d{2}\/\d{2}\/\d{4}$/
      .test(string)
  ) {

    const parts =
      string.split("/");


    return new Date(
      Number(parts[2]),
      Number(parts[1]) - 1,
      Number(parts[0])
    );

  }


  const parsed =
    new Date(string);


  return isNaN(
    parsed.getTime()
  )
    ? new Date(0)
    : parsed;

}


function toInputDate(
  value
) {

  const date =
    parseTradingDate(
      value
    );


  if (
    date.getTime() === 0
  ) {

    return "";

  }


  return (
    date.getFullYear() +
    "-" +
    String(
      date.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    ) +
    "-" +
    String(
      date.getDate()
    )
    .padStart(
      2,
      "0"
    )
  );

}


function formatDisplayDate(
  value
) {

  if (!value) {

    return "-";

  }


  const date =
    parseTradingDate(
      value
    );


  if (
    date.getTime() === 0
  ) {

    return String(value);

  }


  return (
    String(
      date.getDate()
    )
    .padStart(
      2,
      "0"
    ) +
    "/" +
    String(
      date.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    ) +
    "/" +
    date.getFullYear()
  );

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getTradingErrorMessage(
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


  return String(
    error
  );

}


/* =========================================================
   EVENT: PROFIT/RUGI
========================================================= */

function bindProfitRugi() {

  const select =
    $("profitRugi");


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
   EVENT: MODAL BUTTONS
========================================================= */

function bindModalEvents() {

  if (
    addModalButton
  ) {

    addModalButton.addEventListener(
      "click",
      function() {

        openModal(
          addModal
        );

      }
    );

  }


  if (
    withdrawModalButton
  ) {

    withdrawModalButton.addEventListener(
      "click",
      function() {

        openModal(
          withdrawModal
        );

      }
    );

  }


  /*
   * Semua tombol data-close-modal.
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

            closeModal(
              addModal
            );

            closeModal(
              withdrawModal
            );

          }
        );

      }
    );


  /*
   * Klik overlay untuk tutup.
   */

  [addModal, withdrawModal]
    .forEach(
      function(modal) {

        if (!modal) {

          return;

        }


        modal.addEventListener(
          "click",
          function(event) {

            if (
              event.target === modal
            ) {

              closeModal(
                modal
              );

            }

          }
        );

      }
    );


  /*
   * ESC untuk tutup.
   */

  document.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Escape"
      ) {

        closeModal(
          addModal
        );

        closeModal(
          withdrawModal
        );

      }

    }
  );

}


/* =========================================================
   EVENT: FORMS
========================================================= */

function bindFormEvents() {

  if (
    transactionForm
  ) {

    transactionForm.addEventListener(
      "submit",
      handleTransactionSubmit
    );

  }


  if (
    addModalForm
  ) {

    addModalForm.addEventListener(
      "submit",
      handleAddCapital
    );

  }


  if (
    withdrawModalForm
  ) {

    withdrawModalForm.addEventListener(
      "submit",
      handleWithdrawCapital
    );

  }

}


/* =========================================================
   AUTO REFRESH
========================================================= */

let autoRefreshTimer =
  null;


function startAutoRefresh() {

  if (autoRefreshTimer) {

    clearInterval(
      autoRefreshTimer
    );

  }


  /*
   * Refresh setiap 60 detik.
   *
   * Tidak mengganggu jika sedang
   * menyimpan/edit/hapus.
   */

  autoRefreshTimer =
    setInterval(
      function() {

        if (
          TradingState.isSaving ||
          TradingState.isLoading
        ) {

          return;

        }


        loadTradingData(
          false
        );

      },
      60000
    );

}


/* =========================================================
   PAGE VISIBILITY
========================================================= */

function bindVisibilityRefresh() {

  document.addEventListener(
    "visibilitychange",
    function() {

      if (
        document.visibilityState ===
        "visible"
      ) {

        if (
          !TradingState.isSaving
        ) {

          loadTradingData(
            false
          );

        }

      }

    }
  );

}


/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener(
  "beforeunload",
  function() {

    if (
      TradingState.isSaving
    ) {

      /*
       * Browser akan menangani
       * proses navigasi.
       */

      return;

    }

  }
);


/* =========================================================
   GLOBAL TRADING OBJECT
========================================================= */

window.TradingJournal = {

  state:
    TradingState,

  load:
    loadTradingData,

  refresh:
    refreshTradingData,

  render:
    renderTransactions,

  renderSummary:
    renderSummary,

  edit:
    editTransaction,

  update:
    updateTransaction,

  delete:
    deleteTransaction,

  reset:
    resetTransactionForm,

  openModal:
    openModal,

  closeModal:
    closeModal

};


/* =========================================================
   GLOBAL SHORTCUT
========================================================= */

window.refreshTrading =
  refreshTradingData;


/* =========================================================
   INITIALIZE
========================================================= */

async function initTradingPage() {

  console.log(
    "========================================"
  );

  console.log(
    "[Trading] Trading Journal starting..."
  );

  console.log(
    "[Trading] API available:",
    typeof window.TradingAPI !== "undefined"
  );

  console.log(
    "========================================"
  );


  /*
   * Tanggal default.
   */

  setToday(
    "tanggal"
  );

  setToday(
    "addModalTanggal"
  );

  setToday(
    "withdrawModalTanggal"
  );


  /*
   * Event.
   */

  bindProfitRugi();

  bindModalEvents();

  bindFormEvents();

  bindVisibilityRefresh();


  /*
   * Load Google Sheets.
   */

  await loadTradingData(
    true
  );


  /*
   * Auto refresh.
   */

  startAutoRefresh();


  console.log(
    "[Trading] Initialization selesai."
  );

}


/* =========================================================
   DOM READY
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initTradingPage
  );

}

else {

  initTradingPage();

}
